"use client";

import { useState, useMemo } from "react";
import type {
    Contact,
    Communication,
    AddCommunicationFormData,
    WorkflowStage,
} from "@/lib/types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquarePlusIcon,
    Edit3Icon,
    MailIcon,
    PhoneIcon,
    BuildingIcon,
    MapPinIcon,
    PackageIcon,
    FileTextIcon,
    StepForwardIcon,
    ArrowUpDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
    WorkflowIcon,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { addCommunication, updateContact } from "../../app/actions";
import CommunicationForm from "@/components/dialogs/communication-form";
import ContactForm from "@/components/dialogs/contact-form";
import { useRouter } from "next/navigation"; // Import useRouter

interface ContactDetailViewProps {
    contactDetails: Contact & {
        communications: Communication[];
        workflow_stage?: WorkflowStage | null;
    };
}

type CommunicationSortField =
    | "date"
    | "notes"
    | "next_steps"
    | "contact_again_due_date";
type SortDirection = "asc" | "desc";

const formatDateSafe = (dateString?: string | null, dateFormat = "PPP") => {
    if (!dateString) return "N/A";
    try {
        const parsedDate = parseISO(dateString);
        return isValid(parsedDate)
            ? format(parsedDate, dateFormat)
            : "Invalid Date";
    } catch (error) {
        return "Invalid Date";
    }
};

// Helper to format workflow stage for display
const formatWorkflowStage = (stage?: WorkflowStage | null): string => {
    if (!stage) return "Not in workflow";

    switch (stage) {
        case "potentials":
            return "Potential";
        case "incoming_requests":
            return "Incoming Request";
        case "contacted_contacts":
            return "Contacted";
        case "clients":
            return "Client";
        default:
            return "Unknown";
    }
};

export default function ContactDetailView({
    contactDetails: initialContactDetails,
}: ContactDetailViewProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Sorting state for communications - default to contact_again_due_date (earliest first)
    const [sortField, setSortField] = useState<CommunicationSortField>(
        "contact_again_due_date"
    );
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Sort the communications
    const sortedCommunications = useMemo(() => {
        if (
            !initialContactDetails.communications ||
            initialContactDetails.communications.length === 0
        ) {
            return [];
        }

        return [...initialContactDetails.communications].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case "date":
                    aValue = a.date ? new Date(a.date).getTime() : 0;
                    bValue = b.date ? new Date(b.date).getTime() : 0;
                    break;
                case "notes":
                    aValue = a.notes?.toLowerCase() || "";
                    bValue = b.notes?.toLowerCase() || "";
                    break;
                case "next_steps":
                    aValue = a.next_steps?.toLowerCase() || "";
                    bValue = b.next_steps?.toLowerCase() || "";
                    break;
                case "contact_again_due_date":
                    // Sort by due date, with null values last
                    aValue = a.contact_again_due_date
                        ? new Date(a.contact_again_due_date).getTime()
                        : Number.MAX_SAFE_INTEGER;
                    bValue = b.contact_again_due_date
                        ? new Date(b.contact_again_due_date).getTime()
                        : Number.MAX_SAFE_INTEGER;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [initialContactDetails.communications, sortField, sortDirection]);

    const handleSort = (field: CommunicationSortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const getSortIcon = (field: CommunicationSortField) => {
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
        const result = await addCommunication(formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsCommDialogOpen(false);
            router.refresh(); // Refresh the page data
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };

    const handleUpdateContact = async (formData: Partial<Contact>) => {
        const result = await updateContact(initialContactDetails.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsEditDialogOpen(false);
            router.refresh(); // Refresh the page data
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <div>
                            <CardTitle className="text-2xl">
                                {initialContactDetails.name}
                            </CardTitle>
                            <CardDescription>
                                {initialContactDetails.company ||
                                    "No company specified"}
                            </CardDescription>
                        </div>
                        <Dialog
                            open={isEditDialogOpen}
                            onOpenChange={setIsEditDialogOpen}
                        >
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Edit3Icon className="h-5 w-5" />
                                    <span className="sr-only">
                                        Edit Contact
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        Edit Contact:{" "}
                                        {initialContactDetails.name}
                                    </DialogTitle>
                                </DialogHeader>
                                <ContactForm
                                    initialData={initialContactDetails}
                                    onSubmit={handleUpdateContact}
                                    isSubmitting={false}
                                    submitButtonText="Save Changes"
                                />
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center">
                            <MailIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                            <a
                                href={`mailto:${initialContactDetails.email}`}
                                className="text-sm hover:underline"
                            >
                                {initialContactDetails.email}
                            </a>
                        </div>
                        {initialContactDetails.telephone && (
                            <div className="flex items-center">
                                <PhoneIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                                <span className="text-sm">
                                    {initialContactDetails.telephone}
                                </span>
                            </div>
                        )}
                        {initialContactDetails.company && (
                            <div className="flex items-center">
                                <BuildingIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                                <span className="text-sm">
                                    {initialContactDetails.company}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center">
                            <WorkflowIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                            <span className="text-sm">
                                Workflow Stage:{" "}
                                <Badge variant="outline" className="ml-1">
                                    {formatWorkflowStage(
                                        initialContactDetails.workflow_stage
                                    )}
                                </Badge>
                            </span>
                        </div>
                        {initialContactDetails.address && (
                            <div className="flex items-start">
                                <MapPinIcon className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                                <span className="text-sm">
                                    {initialContactDetails.address}
                                </span>
                            </div>
                        )}
                        {initialContactDetails.product && (
                            <div className="flex items-center">
                                <PackageIcon className="h-4 w-4 mr-3 text-muted-foreground" />
                                <span className="text-sm">
                                    Interested in:{" "}
                                    <Badge variant="secondary">
                                        {initialContactDetails.product}
                                    </Badge>
                                </span>
                            </div>
                        )}
                        {initialContactDetails.notes && (
                            <div className="flex items-start">
                                <FileTextIcon className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground italic border-l-2 pl-3">
                                    {initialContactDetails.notes}
                                </p>
                            </div>
                        )}
                        {initialContactDetails.next_steps && (
                            <div className="flex items-start">
                                <StepForwardIcon className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                                <p className="text-sm font-semibold border-l-2 pl-3">
                                    {initialContactDetails.next_steps}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Communication History</CardTitle>
                            <Dialog
                                open={isCommDialogOpen}
                                onOpenChange={setIsCommDialogOpen}
                            >
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <MessageSquarePlusIcon className="mr-2 h-4 w-4" />{" "}
                                        Add Communication
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Add Communication for{" "}
                                            {initialContactDetails.name}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <CommunicationForm
                                        contactId={initialContactDetails.id}
                                        onSubmit={handleAddCommunication}
                                        isSubmitting={false}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <CardDescription>
                            A log of all past and future scheduled
                            communications with this contact.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sortedCommunications.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    handleSort("date")
                                                }
                                                className="h-auto p-0 font-semibold"
                                            >
                                                Date
                                                {getSortIcon("date")}
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    handleSort("notes")
                                                }
                                                className="h-auto p-0 font-semibold"
                                            >
                                                Notes
                                                {getSortIcon("notes")}
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    handleSort("next_steps")
                                                }
                                                className="h-auto p-0 font-semibold"
                                            >
                                                Next Steps
                                                {getSortIcon("next_steps")}
                                            </Button>
                                        </TableHead>
                                        <TableHead>
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    handleSort(
                                                        "contact_again_due_date"
                                                    )
                                                }
                                                className="h-auto p-0 font-semibold"
                                            >
                                                Due Date
                                                {getSortIcon(
                                                    "contact_again_due_date"
                                                )}
                                            </Button>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedCommunications.map((comm) => (
                                        <TableRow key={comm.id}>
                                            <TableCell className="font-medium">
                                                {formatDateSafe(comm.date)}
                                            </TableCell>
                                            <TableCell className="max-w-sm whitespace-pre-wrap">
                                                {comm.notes}
                                            </TableCell>
                                            <TableCell>
                                                {comm.next_steps || "N/A"}
                                            </TableCell>
                                            <TableCell>
                                                {formatDateSafe(
                                                    comm.contact_again_due_date
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No communications logged yet.</p>
                                <p className="text-sm">
                                    Click "Add Communication" to get started.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
