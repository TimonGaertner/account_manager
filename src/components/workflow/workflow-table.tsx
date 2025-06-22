"use client";

import { DialogFooter } from "@/components/ui/dialog";

import { useState } from "react";
import type {
    WorkflowStage,
    PotentialEntry,
    IncomingRequestEntry,
    ContactedContactEntry,
    ClientEntry,
    Contact,
    AddCommunicationFormData,
} from "@/lib/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    MoreHorizontalIcon,
    MessageSquarePlusIcon,
    ArrowRightCircleIcon,
    UserPlusIcon,
    Edit3Icon,
    Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isPast, isValid } from "date-fns";
import CommunicationForm from "@/components/dialogs/communication-form";
import ContactForm from "@/components/dialogs/contact-form";
import {
    addCommunication,
    movePotentialToContacted,
    moveIncomingRequestToContacted,
    moveContactedToClient,
    convertPotentialToIncomingRequest,
    updateContact,
    deleteContact,
} from "../../app/actions";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useRouter } from "next/navigation"; // Import useRouter

type WorkflowData =
    | PotentialEntry
    | IncomingRequestEntry
    | ContactedContactEntry
    | ClientEntry;

interface WorkflowTableProps {
    stage: WorkflowStage;
    data: WorkflowData[];
}

// Helper to format date strings, handling null or invalid dates
const formatDateSafe = (dateString?: string | null, dateFormat = "PPP") => {
    if (!dateString) return "N/A";
    try {
        const parsedDate = parseISO(dateString);
        if (!isValid(parsedDate)) return "Invalid Date";
        return format(parsedDate, dateFormat);
    } catch (error) {
        return "Invalid Date";
    }
};

// Helper to check if a date is overdue
const isDateOverdue = (dateString?: string | null): boolean => {
    if (!dateString) return false;
    try {
        const parsedDate = parseISO(dateString);
        return isValid(parsedDate) && isPast(parsedDate);
    } catch (error) {
        return false;
    }
};

export default function WorkflowTable({ stage, data }: WorkflowTableProps) {
    const router = useRouter(); // Initialize router
    const { toast } = useToast();
    const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
    const [isEditContactDialogOpen, setIsEditContactDialogOpen] =
        useState(false);
    const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null
    );
    const [moveActionData, setMoveActionData] = useState<{
        contactId: string;
        currentStage: WorkflowStage;
        targetStage: WorkflowStage;
        additionalFields?: Record<string, any>;
    } | null>(null);
    const [moveNotes, setMoveNotes] = useState("");
    const [moveContractConditions, setMoveContractConditions] = useState("");
    const [moveContractNumber, setMoveContractNumber] = useState("");
    // Remove moveInitialWayOfContact state as it's no longer needed for the dialog
    // const [moveInitialWayOfContact, setMoveInitialWayOfContact] = useState<ContactSourceType>("outbound/cold")

    const handleAddCommunication = async (
        formData: AddCommunicationFormData
    ) => {
        if (!selectedContact) return;
        // Indicate submission start
        const result = await addCommunication(formData);
        // Indicate submission end
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsCommDialogOpen(false);
            router.refresh(); // Refresh data on success
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };

    const handleUpdateContact = async (formData: Partial<Contact>) => {
        if (!selectedContact?.id) return;
        // Indicate submission start
        const result = await updateContact(selectedContact.id, formData);
        // Indicate submission end
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsEditContactDialogOpen(false);
            router.refresh(); // Refresh data on success
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };

    const handleDeleteContact = async (
        contactId: string,
        contactName: string
    ) => {
        if (
            confirm(
                `Are you sure you want to delete contact "${contactName}"? This action cannot be undone.`
            )
        ) {
            const result = await deleteContact(contactId);
            if (result.success) {
                toast({ title: "Success", description: result.message });
                router.refresh(); // Refresh data on success
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        }
    };

    const openCommDialog = (contact: Contact) => {
        setSelectedContact(contact);
        setIsCommDialogOpen(true);
    };

    const openEditContactDialog = (contact: Contact) => {
        setSelectedContact(contact);
        setIsEditContactDialogOpen(true);
    };

    const openMoveDialog = (
        contactId: string,
        currentStage: WorkflowStage,
        targetStage: WorkflowStage,
        additionalFields?: Record<string, any>
    ) => {
        setMoveActionData({
            contactId,
            currentStage,
            targetStage,
            additionalFields,
        });
        // Reset form fields for move dialog
        setMoveNotes("");
        setMoveContractConditions("");
        setMoveContractNumber("");
        // setMoveInitialWayOfContact("outbound/cold")
        setIsMoveDialogOpen(true);
    };

    const executeMoveAction = async () => {
        if (!moveActionData) return;

        const { contactId, targetStage, currentStage } = moveActionData;
        let result: { success: boolean; message: string } | undefined;

        try {
            if (targetStage === "contacted_contacts") {
                if (currentStage === "potentials") {
                    // initialWayOfContact is now handled by the server action (fixed to outbound/cold)
                    result = await movePotentialToContacted(
                        contactId,
                        moveNotes
                    );
                } else if (currentStage === "incoming_requests") {
                    // initialWayOfContact is now handled by the server action (fixed to incoming/warm)
                    result = await moveIncomingRequestToContacted(
                        contactId,
                        moveNotes
                    );
                }
            } else if (
                targetStage === "clients" &&
                currentStage === "contacted_contacts"
            ) {
                result = await moveContactedToClient(
                    contactId,
                    moveContractConditions,
                    moveContractNumber
                );
            } else if (
                targetStage === "incoming_requests" &&
                currentStage === "potentials"
            ) {
                result = await convertPotentialToIncomingRequest(
                    contactId,
                    moveNotes
                );
            }

            if (result?.success) {
                toast({ title: "Success", description: result.message });
                setIsMoveDialogOpen(false);
                router.refresh(); // Refresh data on success
            } else {
                toast({
                    title: "Error",
                    description: result?.message || "Failed to move contact.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error executing move action:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    if (!data || data.length === 0) {
        return (
            <p className="text-muted-foreground">No contacts in this stage.</p>
        );
    }

    const commonTableHeaders = (
        <>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Latest Next Steps</TableHead>
            <TableHead>Contact Due Date</TableHead>
        </>
    );

    const stageSpecificHeaders = () => {
        switch (stage) {
            case "incoming_requests":
                return <TableHead>Date of Request</TableHead>;
            case "contacted_contacts":
                return <TableHead>Initial Contact Method</TableHead>;
            case "clients":
                return (
                    <>
                        <TableHead>Contract Number</TableHead>
                        <TableHead>Contract Conditions</TableHead>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        {commonTableHeaders}
                        {stageSpecificHeaders()}
                        <TableHead className="text-right w-[100px]">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item) => {
                        const contact = (item as any).contact as Contact & {
                            latest_next_steps?: string;
                            latest_contact_again_due_date?: string;
                        };
                        if (!contact) return null; // Should not happen with current data fetching

                        const isOverdue = isDateOverdue(
                            contact.latest_contact_again_due_date
                        );
                        const rowClass = isOverdue
                            ? "bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50"
                            : "hover:bg-muted/50";

                        return (
                            <TableRow key={contact.id} className={rowClass}>
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/contacts/${contact.id}`}
                                        className="hover:underline"
                                    >
                                        {contact.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{contact.email}</TableCell>
                                <TableCell>
                                    {contact.telephone || "N/A"}
                                </TableCell>
                                <TableCell>
                                    {contact.company || "N/A"}
                                </TableCell>
                                <TableCell>
                                    {contact.latest_next_steps || "N/A"}
                                </TableCell>
                                <TableCell>
                                    {formatDateSafe(
                                        contact.latest_contact_again_due_date
                                    )}
                                    {isOverdue && (
                                        <span className="ml-2 text-xs font-semibold text-red-600 dark:text-red-400">
                                            (OVERDUE)
                                        </span>
                                    )}
                                </TableCell>

                                {/* Stage Specific Cells */}
                                {stage === "incoming_requests" && (
                                    <TableCell>
                                        {formatDateSafe(
                                            (item as IncomingRequestEntry)
                                                .date_of_request
                                        )}
                                    </TableCell>
                                )}
                                {stage === "contacted_contacts" && (
                                    <TableCell>
                                        {
                                            (item as ContactedContactEntry)
                                                .initial_way_of_contact
                                        }
                                    </TableCell>
                                )}
                                {stage === "clients" && (
                                    <>
                                        <TableCell>
                                            {(item as ClientEntry)
                                                .contract_number || "N/A"}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {(item as ClientEntry)
                                                .contract_conditions || "N/A"}
                                        </TableCell>
                                    </>
                                )}

                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreHorizontalIcon className="h-4 w-4" />
                                                <span className="sr-only">
                                                    Actions
                                                </span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>
                                                {contact.name}
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openCommDialog(contact)
                                                }
                                            >
                                                <MessageSquarePlusIcon className="mr-2 h-4 w-4" />{" "}
                                                Add Communication
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openEditContactDialog(
                                                        contact
                                                    )
                                                }
                                            >
                                                <Edit3Icon className="mr-2 h-4 w-4" />{" "}
                                                Edit Contact
                                            </DropdownMenuItem>
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/contacts/${contact.id}`}
                                                >
                                                    <UserPlusIcon className="mr-2 h-4 w-4" />{" "}
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>
                                                    <ArrowRightCircleIcon className="mr-2 h-4 w-4" />{" "}
                                                    Move To
                                                </DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {stage ===
                                                            "potentials" && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openMoveDialog(
                                                                            contact.id,
                                                                            "potentials",
                                                                            "incoming_requests"
                                                                        )
                                                                    }
                                                                >
                                                                    Incoming
                                                                    Request
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        openMoveDialog(
                                                                            contact.id,
                                                                            "potentials",
                                                                            "contacted_contacts"
                                                                        )
                                                                    }
                                                                >
                                                                    Contacted
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                        {stage ===
                                                            "incoming_requests" && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openMoveDialog(
                                                                        contact.id,
                                                                        "incoming_requests",
                                                                        "contacted_contacts"
                                                                    )
                                                                }
                                                            >
                                                                Contacted
                                                            </DropdownMenuItem>
                                                        )}
                                                        {stage ===
                                                            "contacted_contacts" && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    openMoveDialog(
                                                                        contact.id,
                                                                        "contacted_contacts",
                                                                        "clients"
                                                                    )
                                                                }
                                                            >
                                                                Client
                                                            </DropdownMenuItem>
                                                        )}
                                                        {stage !==
                                                            "potentials" &&
                                                            stage !==
                                                                "incoming_requests" &&
                                                            stage !==
                                                                "contacted_contacts" &&
                                                            stage !==
                                                                "clients" && (
                                                                <DropdownMenuItem
                                                                    disabled
                                                                >
                                                                    No moves
                                                                    available
                                                                </DropdownMenuItem>
                                                            )}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600 hover:!text-red-600 focus:!text-red-600"
                                                onClick={() =>
                                                    handleDeleteContact(
                                                        contact.id,
                                                        contact.name
                                                    )
                                                }
                                            >
                                                <Trash2Icon className="mr-2 h-4 w-4" />{" "}
                                                Delete Contact
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>

            {/* Add Communication Dialog */}
            <Dialog open={isCommDialogOpen} onOpenChange={setIsCommDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Add Communication for {selectedContact?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Log a new communication record.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedContact && (
                        <CommunicationForm
                            contactId={selectedContact.id}
                            onSubmit={handleAddCommunication}
                            isSubmitting={false} // This should be managed by the form itself or passed down
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Contact Dialog */}
            <Dialog
                open={isEditContactDialogOpen}
                onOpenChange={setIsEditContactDialogOpen}
            >
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            Edit Contact: {selectedContact?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Update the contact's details.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedContact && (
                        <ContactForm
                            initialData={selectedContact}
                            onSubmit={handleUpdateContact}
                            isSubmitting={false} // Manage within form or pass down
                            submitButtonText="Save Changes"
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Move Contact Dialog */}
            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Move Contact to{" "}
                            {moveActionData?.targetStage.replace("_", " ")}
                        </DialogTitle>
                        <DialogDescription>
                            Provide additional details for the move.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Potentials -> Contacted or Incoming Request -> Contacted */}
                        {moveActionData?.targetStage ===
                            "contacted_contacts" && (
                            <>
                                <div className="space-y-1">
                                    <label
                                        htmlFor="moveNotes"
                                        className="text-sm font-medium"
                                    >
                                        Notes for Contacted Stage
                                    </label>
                                    <Textarea
                                        id="moveNotes"
                                        value={moveNotes}
                                        onChange={(e) =>
                                            setMoveNotes(e.target.value)
                                        }
                                        placeholder="e.g., Initial call details, interest level"
                                    />
                                </div>
                                {/*
                  Remove this block from the move dialog:
                  {moveActionData?.currentStage === "potentials" && ( // Only show for Potential -> Contacted
                    <div className="space-y-1">
                      <label htmlFor="initialWayOfContact" className="text-sm font-medium">
                        Initial Way of Contact
                      </label>
                      <Select
                        value={moveInitialWayOfContact}
                        onValueChange={(value: ContactSourceType) => setMoveInitialWayOfContact(value)}
                      >
                        <SelectTrigger id="initialWayOfContact">
                          <SelectValue placeholder="Select contact method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="outbound/cold">Outbound / Cold</SelectItem>
                          <SelectItem value="incoming/warm">Incoming / Warm</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                */}
                            </>
                        )}
                        {/* Potentials -> Incoming Request */}
                        {moveActionData?.targetStage === "incoming_requests" &&
                            moveActionData?.currentStage === "potentials" && (
                                <div className="space-y-1">
                                    <label
                                        htmlFor="moveNotes"
                                        className="text-sm font-medium"
                                    >
                                        Notes for Incoming Request
                                    </label>
                                    <Textarea
                                        id="moveNotes"
                                        value={moveNotes}
                                        onChange={(e) =>
                                            setMoveNotes(e.target.value)
                                        }
                                        placeholder="e.g., Details of their request"
                                    />
                                </div>
                            )}
                        {/* Contacted -> Client */}
                        {moveActionData?.targetStage === "clients" && (
                            <>
                                <div className="space-y-1">
                                    <label
                                        htmlFor="moveContractNumber"
                                        className="text-sm font-medium"
                                    >
                                        Contract Number
                                    </label>
                                    <Input
                                        id="moveContractNumber"
                                        value={moveContractNumber}
                                        onChange={(e) =>
                                            setMoveContractNumber(
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g., CN-2024-001"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label
                                        htmlFor="moveContractConditions"
                                        className="text-sm font-medium"
                                    >
                                        Contract Conditions
                                    </label>
                                    <Textarea
                                        id="moveContractConditions"
                                        value={moveContractConditions}
                                        onChange={(e) =>
                                            setMoveContractConditions(
                                                e.target.value
                                            )
                                        }
                                        placeholder="e.g., Payment terms, service scope"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsMoveDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={executeMoveAction}>
                            Confirm Move
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
