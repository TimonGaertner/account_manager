"use client";

import { DialogFooter } from "@/components/ui/dialog";

import { useState, useMemo } from "react";
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
    ArrowUpDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
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
import { useRouter } from "next/navigation";
import AddContactToStageButton from "./add-contact-to-stage-button";

type WorkflowData =
    | PotentialEntry
    | IncomingRequestEntry
    | ContactedContactEntry
    | ClientEntry;

interface WorkflowTableProps {
    stage: WorkflowStage;
    data: WorkflowData[];
}

type SortField =
    | "name"
    | "email"
    | "phone"
    | "company"
    | "latest_next_steps"
    | "contact_due_date"
    | "date_of_request"
    | "initial_way_of_contact"
    | "contract_number"
    | "contract_conditions";
type SortDirection = "asc" | "desc";

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
    if (!dateString) return true;
    try {
        const parsedDate = parseISO(dateString);
        return isValid(parsedDate) && isPast(parsedDate);
    } catch (error) {
        return false;
    }
};

export default function WorkflowTable({ stage, data }: WorkflowTableProps) {
    const router = useRouter();
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

    // Sorting state - default to contact_due_date with earliest first
    const [sortField, setSortField] = useState<SortField>("contact_due_date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Sort the data
    const sortedData = useMemo(() => {
        if (!data || data.length === 0) return [];

        return [...data].sort((a, b) => {
            const contactA = (a as any).contact as Contact & {
                latest_next_steps?: string;
                latest_contact_again_due_date?: string;
            };
            const contactB = (b as any).contact as Contact & {
                latest_next_steps?: string;
                latest_contact_again_due_date?: string;
            };

            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case "name":
                    aValue = contactA.name?.toLowerCase() || "";
                    bValue = contactB.name?.toLowerCase() || "";
                    break;
                case "email":
                    aValue = contactA.email?.toLowerCase() || "";
                    bValue = contactB.email?.toLowerCase() || "";
                    break;
                case "phone":
                    aValue = contactA.telephone?.toLowerCase() || "";
                    bValue = contactB.telephone?.toLowerCase() || "";
                    break;
                case "company":
                    aValue = contactA.company?.toLowerCase() || "";
                    bValue = contactB.company?.toLowerCase() || "";
                    break;
                case "latest_next_steps":
                    aValue = contactA.latest_next_steps?.toLowerCase() || "";
                    bValue = contactB.latest_next_steps?.toLowerCase() || "";
                    break;
                case "contact_due_date":
                    aValue = contactA.latest_contact_again_due_date
                        ? new Date(
                              contactA.latest_contact_again_due_date
                          ).getTime()
                        : Number.MAX_SAFE_INTEGER;
                    bValue = contactB.latest_contact_again_due_date
                        ? new Date(
                              contactB.latest_contact_again_due_date
                          ).getTime()
                        : Number.MAX_SAFE_INTEGER;
                    break;
                case "date_of_request":
                    if (stage === "incoming_requests") {
                        aValue = (a as IncomingRequestEntry).date_of_request
                            ? new Date(
                                  (a as IncomingRequestEntry).date_of_request!
                              ).getTime()
                            : 0;
                        bValue = (b as IncomingRequestEntry).date_of_request
                            ? new Date(
                                  (b as IncomingRequestEntry).date_of_request!
                              ).getTime()
                            : 0;
                    } else {
                        return 0;
                    }
                    break;
                case "initial_way_of_contact":
                    if (stage === "contacted_contacts") {
                        aValue =
                            (
                                a as ContactedContactEntry
                            ).initial_way_of_contact?.toLowerCase() || "";
                        bValue =
                            (
                                b as ContactedContactEntry
                            ).initial_way_of_contact?.toLowerCase() || "";
                    } else {
                        return 0;
                    }
                    break;
                case "contract_number":
                    if (stage === "clients") {
                        aValue =
                            (a as ClientEntry).contract_number?.toLowerCase() ||
                            "";
                        bValue =
                            (b as ClientEntry).contract_number?.toLowerCase() ||
                            "";
                    } else {
                        return 0;
                    }
                    break;
                case "contract_conditions":
                    if (stage === "clients") {
                        aValue =
                            (
                                a as ClientEntry
                            ).contract_conditions?.toLowerCase() || "";
                        bValue =
                            (
                                b as ClientEntry
                            ).contract_conditions?.toLowerCase() || "";
                    } else {
                        return 0;
                    }
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortField, sortDirection, stage]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <ArrowUpDownIcon className="ml-2 h-4 w-4" />;
        }
        return sortDirection === "asc" ? (
            <ArrowUpIcon className="ml-2 h-4 w-4" />
        ) : (
            <ArrowDownIcon className="ml-2 h-4 w-4" />
        );
    };

    const handleAddCommunication = async (
        formData: AddCommunicationFormData
    ) => {
        if (!selectedContact) return;
        const result = await addCommunication(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsCommDialogOpen(false);
            router.refresh();
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
        const result = await updateContact(selectedContact.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsEditContactDialogOpen(false);
            router.refresh();
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
                router.refresh();
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
        setMoveNotes("");
        setMoveContractConditions("");
        setMoveContractNumber("");
        setIsMoveDialogOpen(true);
    };

    const executeMoveAction = async () => {
        if (!moveActionData) return;

        const { contactId, targetStage, currentStage } = moveActionData;
        let result: { success: boolean; message: string } | undefined;

        try {
            if (targetStage === "contacted_contacts") {
                if (currentStage === "potentials") {
                    result = await movePotentialToContacted(
                        contactId,
                        moveNotes
                    );
                } else if (currentStage === "incoming_requests") {
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
                router.refresh();
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

    const commonTableHeaders = (
        <>
            <TableHead className="w-[200px]">
                <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="h-auto p-0 font-semibold"
                >
                    Name
                    {getSortIcon("name")}
                </Button>
            </TableHead>
            <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort("email")}
                    className="h-auto p-0 font-semibold"
                >
                    Email
                    {getSortIcon("email")}
                </Button>
            </TableHead>
            <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort("phone")}
                    className="h-auto p-0 font-semibold"
                >
                    Phone
                    {getSortIcon("phone")}
                </Button>
            </TableHead>
            <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort("company")}
                    className="h-auto p-0 font-semibold"
                >
                    Company
                    {getSortIcon("company")}
                </Button>
            </TableHead>
            <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort("latest_next_steps")}
                    className="h-auto p-0 font-semibold"
                >
                    Latest Next Steps
                    {getSortIcon("latest_next_steps")}
                </Button>
            </TableHead>
            <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort("contact_due_date")}
                    className="h-auto p-0 font-semibold"
                >
                    Contact Due Date
                    {getSortIcon("contact_due_date")}
                </Button>
            </TableHead>
        </>
    );

    const stageSpecificHeaders = () => {
        switch (stage) {
            case "incoming_requests":
                return (
                    <TableHead>
                        <Button
                            variant="ghost"
                            onClick={() => handleSort("date_of_request")}
                            className="h-auto p-0 font-semibold"
                        >
                            Date of Request
                            {getSortIcon("date_of_request")}
                        </Button>
                    </TableHead>
                );
            case "contacted_contacts":
                return (
                    <TableHead>
                        <Button
                            variant="ghost"
                            onClick={() => handleSort("initial_way_of_contact")}
                            className="h-auto p-0 font-semibold"
                        >
                            Initial Contact Method
                            {getSortIcon("initial_way_of_contact")}
                        </Button>
                    </TableHead>
                );
            case "clients":
                return (
                    <>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() => handleSort("contract_number")}
                                className="h-auto p-0 font-semibold"
                            >
                                Contract Number
                                {getSortIcon("contract_number")}
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    handleSort("contract_conditions")
                                }
                                className="h-auto p-0 font-semibold"
                            >
                                Contract Conditions
                                {getSortIcon("contract_conditions")}
                            </Button>
                        </TableHead>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="mb-4 flex justify-end">
                <AddContactToStageButton stage={stage} />
            </div>
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
                    {sortedData.map((item) => {
                        const contact = (item as any).contact as Contact & {
                            latest_next_steps?: string;
                            latest_contact_again_due_date?: string;
                        };
                        if (!contact) return null;

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

            {/* Communication Dialog */}
            <Dialog open={isCommDialogOpen} onOpenChange={setIsCommDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Add Communication for {selectedContact?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedContact && (
                        <CommunicationForm
                            contactId={selectedContact.id}
                            onSubmit={handleAddCommunication}
                            isSubmitting={false}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Contact Dialog */}
            <Dialog
                open={isEditContactDialogOpen}
                onOpenChange={setIsEditContactDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Contact</DialogTitle>
                        <DialogDescription>
                            Update the contact information below.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedContact && (
                        <ContactForm
                            initialData={selectedContact}
                            onSubmit={handleUpdateContact}
                            isSubmitting={false}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Move Dialog */}
            <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Move Contact</DialogTitle>
                        <DialogDescription>
                            {moveActionData && (
                                <>
                                    Moving contact to{" "}
                                    <strong>
                                        {moveActionData.targetStage.replace(
                                            "_",
                                            " "
                                        )}
                                    </strong>
                                    . Please provide additional details below.
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {moveActionData?.targetStage === "clients" && (
                            <>
                                <div>
                                    <label className="text-sm font-medium">
                                        Contract Number
                                    </label>
                                    <Input
                                        value={moveContractNumber}
                                        onChange={(e) =>
                                            setMoveContractNumber(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter contract number..."
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">
                                        Contract Conditions
                                    </label>
                                    <Textarea
                                        value={moveContractConditions}
                                        onChange={(e) =>
                                            setMoveContractConditions(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter contract conditions..."
                                        rows={3}
                                    />
                                </div>
                            </>
                        )}
                        {(moveActionData?.targetStage ===
                            "contacted_contacts" ||
                            moveActionData?.targetStage ===
                                "incoming_requests") && (
                            <div>
                                <label className="text-sm font-medium">
                                    Notes
                                </label>
                                <Textarea
                                    value={moveNotes}
                                    onChange={(e) =>
                                        setMoveNotes(e.target.value)
                                    }
                                    placeholder="Enter notes about this move..."
                                    rows={3}
                                />
                            </div>
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
                            Move Contact
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
