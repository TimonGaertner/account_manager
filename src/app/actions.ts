"use server";

import { createSupabaseServerClient } from "../lib/supabase/server";
import type {
    Contact,
    Communication,
    PotentialEntry,
    IncomingRequestEntry,
    ContactedContactEntry,
    ClientEntry,
    AddContactFormData,
    UpdateContactFormData,
    AddCommunicationFormData,
    WorkflowStage,
    LatestCommunicationDetails,
} from "../lib/types";
import { revalidatePath } from "next/cache";

const getContactWithLatestComm = async (
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
    contactId: string
): Promise<LatestCommunicationDetails> => {
    const { data: commDetails, error: commError } = await supabase.rpc(
        "get_latest_communication_details",
        {
            p_contact_id: contactId,
        }
    );

    if (commError) {
        console.error(
            `Error fetching latest communication for ${contactId}:`,
            commError
        );
        return {};
    }
    return commDetails?.[0] || {};
};

// Helper to fetch contacts and their latest communications for a workflow stage
async function getWorkflowStageContacts<T extends { contact_id: string }>(
    stageTable: WorkflowStage,
    additionalSelectFields = "" // e.g., "notes, initial_way_of_contact" for contacted_contacts
): Promise<(T & { contact: Contact & LatestCommunicationDetails })[]> {
    const supabase = await createSupabaseServerClient();

    // Construct the select query string carefully
    // The RPC function `get_latest_communication_details` is called on the `contacts` table,
    // so we need to make sure it's aliased correctly if we select it directly.
    // However, it's simpler to call it as a sub-query or join if Supabase syntax allows.
    // Given the current RPC, we'll fetch contacts and then enrich them.
    // A more efficient way would be a VIEW or a modified RPC that joins.

    // Let's try to use the RPC directly in the select if possible, or adjust.
    // The previous attempt was good, let's refine the data mapping.

    const { data, error } = await supabase.from(stageTable).select(`
    ${additionalSelectFields ? `${additionalSelectFields},` : ""}
    contact_id,
    created_at,
    contact:contacts (
      id,
      name,
      product,
      email,
      telephone,
      company,
      address,
      notes,
      next_steps,
      created_at,
      updated_at
    )
  `);
    // .eq('contact.id', 'contact_id') // This kind of join isn't direct in select like this
    // The foreign key relationship handles the join for `contact:contacts(...)`

    if (error) {
        console.error(`Error fetching ${stageTable}:`, error);
        return [];
    }

    if (!data) {
        return [];
    }

    // Now, for each contact, fetch its latest communication details
    const enrichedData = await Promise.all(
        data.map(async (item: any) => {
            if (!item.contact) {
                // This case should ideally not happen if DB constraints are set up
                console.warn(
                    `Item in ${stageTable} with contact_id ${item.contact_id} has no associated contact. Skipping.`
                );
                return null; // or handle as an error
            }
            const latestCommDetails = await getContactWithLatestComm(
                supabase,
                item.contact.id
            );
            return {
                ...item,
                contact: {
                    ...item.contact,
                    ...latestCommDetails,
                },
            };
        })
    );

    return enrichedData.filter((item) => item !== null) as (T & {
        contact: Contact & LatestCommunicationDetails;
    })[];
}

// Update the individual stage getters to pass the correct fields for that stage table
export async function getPotentials(): Promise<PotentialEntry[]> {
    return getWorkflowStageContacts<PotentialEntry>(
        "potentials",
        "contact_id, created_at"
    );
}

export async function getIncomingRequests(): Promise<IncomingRequestEntry[]> {
    return getWorkflowStageContacts<IncomingRequestEntry>(
        "incoming_requests",
        "contact_id, date_of_request, notes, created_at"
    );
}

export async function getContactedContacts(): Promise<ContactedContactEntry[]> {
    return getWorkflowStageContacts<ContactedContactEntry>(
        "contacted_contacts",
        "contact_id, notes, initial_way_of_contact, created_at"
    );
}

export async function getClients(): Promise<ClientEntry[]> {
    return getWorkflowStageContacts<ClientEntry>(
        "clients",
        "contact_id, contract_conditions, contract_number, created_at"
    );
}

export async function getAllContacts(): Promise<
    (Contact & LatestCommunicationDetails)[]
> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("name");
    if (error) {
        console.error("Error fetching contacts:", error);
        return [];
    }

    if (!data) return [];

    // Enrich each contact with their latest communication details
    const enrichedContacts = await Promise.all(
        data.map(async (contact: Contact) => {
            const latestCommDetails = await getContactWithLatestComm(
                supabase,
                contact.id
            );
            return {
                ...contact,
                ...latestCommDetails,
            };
        })
    );

    return enrichedContacts;
}

export async function getContactById(
    id: string
): Promise<(Contact & { communications: Communication[] }) | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("contacts")
        .select(
            `
    *,
    communications (*)
  `
        )
        .eq("id", id)
        .single();

    if (error) {
        console.error(`Error fetching contact ${id}:`, error);
        return null;
    }
    return data as (Contact & { communications: Communication[] }) | null;
}

export async function addContact(
    formData: AddContactFormData,
    initialWorkflowStage?: WorkflowStage
): Promise<{ success: boolean; message: string; contact?: Contact }> {
    const supabase = await createSupabaseServerClient();

    // Check for existing email
    const { data: existingContact, error: existingError } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", formData.email)
        .single();

    if (existingError && existingError.code !== "PGRST116") {
        // PGRST116: no rows found
        console.error("Error checking existing contact:", existingError);
        return {
            success: false,
            message: "Error checking for existing contact.",
        };
    }
    if (existingContact) {
        return {
            success: false,
            message: "A contact with this email already exists.",
        };
    }

    const { data: newContact, error } = await supabase
        .from("contacts")
        .insert(formData)
        .select()
        .single();

    if (error || !newContact) {
        console.error("Error adding contact:", error);
        return {
            success: false,
            message: error?.message || "Failed to add contact.",
        };
    }

    if (initialWorkflowStage) {
        const { error: workflowError } = await supabase
            .from(initialWorkflowStage)
            .insert({ contact_id: newContact.id });
        if (workflowError) {
            console.error(
                `Error adding contact to ${initialWorkflowStage}:`,
                workflowError
            );
            // Optionally delete the contact if adding to workflow fails, or handle differently
            return {
                success: false,
                message: `Contact added, but failed to assign to ${initialWorkflowStage}.`,
            };
        }
    }

    revalidatePath("/");
    revalidatePath("/contacts");
    if (newContact.id) {
        // If contact has an ID, a detail page might exist or be created
        revalidatePath(`/contacts/${newContact.id}`);
    }
    return {
        success: true,
        message: "Contact added successfully.",
        contact: newContact,
    };
}

export async function updateContact(
    id: string,
    formData: UpdateContactFormData
): Promise<{ success: boolean; message: string }> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
        .from("contacts")
        .update(formData)
        .eq("id", id);

    if (error) {
        console.error(`Error updating contact ${id}:`, error);
        return { success: false, message: error.message };
    }
    revalidatePath("/");
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    return { success: true, message: "Contact updated successfully." };
}

export async function addCommunication(
    formData: AddCommunicationFormData
): Promise<{ success: boolean; message: string }> {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("communications").insert(formData);

    if (error) {
        console.error("Error adding communication:", error);
        return { success: false, message: error.message };
    }
    revalidatePath("/"); // For workflow tables
    revalidatePath(`/contacts`); // For all contacts page if it shows some summary
    revalidatePath(`/contacts/${formData.contact_id}`); // For contact detail page
    return { success: true, message: "Communication added successfully." };
}

async function moveContactWorkflow(
    contactId: string,
    fromStage: WorkflowStage | null,
    toStage: WorkflowStage,
    toStageData: Record<string, any> // e.g., { notes: '...', initial_way_of_contact: '...' }
): Promise<{ success: boolean; message: string }> {
    const supabase = await createSupabaseServerClient();

    // Supabase doesn't have transactions in the JS library directly for multiple table operations like this.
    // Ideally, this would be a database function/trigger for atomicity.
    // For now, we'll do it step-by-step. If a step fails, the state might be inconsistent.

    if (fromStage) {
        const { error: deleteError } = await supabase
            .from(fromStage)
            .delete()
            .eq("contact_id", contactId);
        if (deleteError) {
            console.error(
                `Error removing contact ${contactId} from ${fromStage}:`,
                deleteError
            );
            return {
                success: false,
                message: `Failed to remove from ${fromStage}: ${deleteError.message}`,
            };
        }
    }

    const { error: insertError } = await supabase
        .from(toStage)
        .insert({ contact_id: contactId, ...toStageData });

    if (insertError) {
        console.error(
            `Error moving contact ${contactId} to ${toStage}:`,
            insertError
        );
        // Attempt to roll back by re-inserting to fromStage if it existed? Complex without transactions.
        return {
            success: false,
            message: `Failed to move to ${toStage}: ${insertError.message}`,
        };
    }

    revalidatePath("/");
    return {
        success: true,
        message: `Contact moved to ${toStage} successfully.`,
    };
}

export async function movePotentialToContacted(
    contactId: string,
    notes?: string
    // initialWayOfContact is now fixed to "outbound/cold"
): Promise<{ success: boolean; message: string }> {
    return moveContactWorkflow(contactId, "potentials", "contacted_contacts", {
        notes,
        initial_way_of_contact: "outbound/cold", // Always cold for potentials
    });
}

export async function moveIncomingRequestToContacted(
    contactId: string,
    notes?: string
): Promise<{ success: boolean; message: string }> {
    return moveContactWorkflow(
        contactId,
        "incoming_requests",
        "contacted_contacts",
        {
            notes,
            initial_way_of_contact: "incoming/warm", // Always warm for incoming requests
        }
    );
}

export async function moveContactedToClient(
    contactId: string,
    contractConditions?: string,
    contractNumber?: string
): Promise<{ success: boolean; message: string }> {
    return moveContactWorkflow(contactId, "contacted_contacts", "clients", {
        contract_conditions: contractConditions,
        contract_number: contractNumber,
    });
}

export async function convertPotentialToIncomingRequest(
    contactId: string,
    requestNotes?: string
): Promise<{ success: boolean; message: string }> {
    return moveContactWorkflow(contactId, "potentials", "incoming_requests", {
        notes: requestNotes,
        date_of_request: new Date().toISOString(),
    });
}

// Action to add a new contact directly to Potentials
export async function addContactToPotentials(
    formData: AddContactFormData
): Promise<{ success: boolean; message: string; contact?: Contact }> {
    return addContact(formData, "potentials");
}

export async function deleteContact(
    contactId: string
): Promise<{ success: boolean; message: string }> {
    const supabase = await createSupabaseServerClient();

    // Deleting a contact will also delete related communications and workflow entries
    // due to ON DELETE CASCADE in the schema.
    const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId);

    if (error) {
        console.error(`Error deleting contact ${contactId}:`, error);
        return {
            success: false,
            message: `Failed to delete contact: ${error.message}`,
        };
    }

    revalidatePath("/");
    revalidatePath("/contacts");
    // No need to revalidate /contacts/[id] as it will be gone
    return { success: true, message: "Contact deleted successfully." };
}
