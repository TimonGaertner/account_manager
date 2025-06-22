"use client";

import { useState } from "react";
import type { Contact } from "@/lib/types";
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
    Edit3Icon,
    Trash2Icon,
    UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";
import ContactForm from "@/components/dialogs/contact-form";
import { updateContact, deleteContact } from "../../app/actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation"; // Import useRouter

interface ContactsTableProps {
    contacts: Contact[];
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

export default function ContactsTable({ contacts }: ContactsTableProps) {
    const router = useRouter(); // Initialize router
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null
    );

    const handleUpdateContact = async (formData: Partial<Contact>) => {
        if (!selectedContact?.id) return;
        const result = await updateContact(selectedContact.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsEditDialogOpen(false);
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

    const openEditDialog = (contact: Contact) => {
        setSelectedContact(contact);
        setIsEditDialogOpen(true);
    };

    if (!contacts || contacts.length === 0) {
        return (
            <p className="text-muted-foreground">
                No contacts found. Add one to get started!
            </p>
        );
    }

    return (
        <>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Company</TableHead>
                            <TableHead>Product</TableHead>
                            <TableHead>Date Added</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.map((contact) => (
                            <TableRow key={contact.id}>
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
                                    {contact.company || "N/A"}
                                </TableCell>
                                <TableCell>
                                    {contact.product || "N/A"}
                                </TableCell>
                                <TableCell>
                                    {formatDateSafe(contact.created_at)}
                                </TableCell>
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
                                            <DropdownMenuItem asChild>
                                                <Link
                                                    href={`/contacts/${contact.id}`}
                                                >
                                                    <UserRoundIcon className="mr-2 h-4 w-4" />{" "}
                                                    View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    openEditDialog(contact)
                                                }
                                            >
                                                <Edit3Icon className="mr-2 h-4 w-4" />{" "}
                                                Edit Contact
                                            </DropdownMenuItem>
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
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Contact Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                            isSubmitting={false} // This should be managed by the form itself
                            submitButtonText="Save Changes"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
