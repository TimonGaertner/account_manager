// From your SQL schema
export type ContactSourceType = "incoming/warm" | "outbound/cold";

export interface Contact {
    id: string; // UUID
    name: string;
    product?: string | null;
    email: string;
    telephone?: string | null;
    company?: string | null;
    address?: string | null;
    notes?: string | null;
    next_steps?: string | null; // Contact's own next steps
    created_at: string; // ISO Date string
    updated_at: string; // ISO Date string
}

export interface Communication {
    id: string; // UUID
    contact_id: string; // UUID
    date: string; // ISO Date string
    contact_again_due_date?: string | null; // ISO Date string (just date part)
    next_steps?: string | null;
    notes?: string | null;
    created_at: string; // ISO Date string
}

export interface Potential {
    contact_id: string; // UUID
    created_at: string; // ISO Date string
}

export interface IncomingRequest {
    contact_id: string; // UUID
    date_of_request?: string | null; // ISO Date string
    notes?: string | null;
    created_at: string; // ISO Date string
}

export interface ContactedContact {
    contact_id: string; // UUID
    notes?: string | null;
    initial_way_of_contact: ContactSourceType;
    created_at: string; // ISO Date string
}

export interface Client {
    contact_id: string; // UUID
    contract_conditions?: string | null;
    contract_number?: string | null;
    created_at: string; // ISO Date string
}

// Enriched types for display
export interface LatestCommunicationDetails {
    latest_next_steps?: string | null;
    latest_contact_again_due_date?: string | null; // ISO Date string
    communication_id?: string | null; // UUID
    communication_date?: string | null; // ISO Date string
}

export interface WorkflowStageDetails {
    workflow_stage?: WorkflowStage | null;
}

export type ContactWithLatestCommunication = Contact &
    LatestCommunicationDetails;
export type ContactWithWorkflowStage = Contact &
    LatestCommunicationDetails &
    WorkflowStageDetails;

export type PotentialEntry = Potential & {
    contact: ContactWithLatestCommunication;
};
export type IncomingRequestEntry = IncomingRequest & {
    contact: ContactWithLatestCommunication;
};
export type ContactedContactEntry = ContactedContact & {
    contact: ContactWithLatestCommunication;
};
export type ClientEntry = Client & { contact: ContactWithLatestCommunication };

export type WorkflowStage =
    | "potentials"
    | "incoming_requests"
    | "contacted_contacts"
    | "clients";

export type AddContactFormData = Omit<
    Contact,
    "id" | "created_at" | "updated_at"
>;
export type UpdateContactFormData = Partial<AddContactFormData>;

export type AddCommunicationFormData = Omit<Communication, "id" | "created_at">;
