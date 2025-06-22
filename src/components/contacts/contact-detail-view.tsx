"use client";

import { useState } from "react";
import type {
    Contact,
    Communication,
    AddCommunicationFormData,
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
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { addCommunication, updateContact } from "../../app/actions";
import CommunicationForm from "@/components/dialogs/communication-form";
import ContactForm from "@/components/dialogs/contact-form";
import { useRouter } from "next/navigation"; // Import useRouter

interface ContactDetailViewProps {
    contactDetails: Contact & { communications: Communication[] };
}

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

export default function ContactDetailView({
    contactDetails: initialContactDetails,
}: ContactDetailViewProps) {
    const router = useRouter(); // Initialize router
    const { toast } = useToast();
    // The local state `contactDetails` will be updated by router.refresh() implicitly
    // No need for `setContactDetails` for data that comes from the server after refresh.
    // const [contactDetails, setContactDetails] = useState(initialContactDetails)
    // Instead, use initialContactDetails directly or derive from props if needed for optimistic updates.
    // For simplicity and to ensure data consistency, we'll rely on router.refresh()
    const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Use initialContactDetails directly for rendering, router.refresh() will update it.
    const sortedCommunications = [...initialContactDetails.communications].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

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
                                        <TableHead>Date</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead>Next Steps</TableHead>
                                        <TableHead>Due Date</TableHead>
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
