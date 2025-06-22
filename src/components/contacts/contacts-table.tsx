"use client";

import { useState, useMemo } from "react";
import type { Contact, LatestCommunicationDetails } from "@/lib/types";
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
    ArrowUpDownIcon,
    ArrowUpIcon,
    ArrowDownIcon,
} from "lucide-react";
import Link from "next/link";
import { format, parseISO, isValid, isPast } from "date-fns";
import ContactForm from "@/components/dialogs/contact-form";
import { updateContact, deleteContact } from "../../app/actions";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface ContactsTableProps {
    contacts: (Contact & LatestCommunicationDetails)[];
}

type SortField =
    | "name"
    | "email"
    | "company"
    | "product"
    | "created_at"
    | "contact_due_date";
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

export default function ContactsTable({ contacts }: ContactsTableProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(
        null
    );

    // Sorting state
    const [sortField, setSortField] = useState<SortField>("contact_due_date");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    // Sort the contacts
    const sortedContacts = useMemo(() => {
        if (!contacts || contacts.length === 0) return [];

        return [...contacts].sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (sortField) {
                case "name":
                    aValue = a.name?.toLowerCase() || "";
                    bValue = b.name?.toLowerCase() || "";
                    break;
                case "email":
                    aValue = a.email?.toLowerCase() || "";
                    bValue = b.email?.toLowerCase() || "";
                    break;
                case "company":
                    aValue = a.company?.toLowerCase() || "";
                    bValue = b.company?.toLowerCase() || "";
                    break;
                case "product":
                    aValue = a.product?.toLowerCase() || "";
                    bValue = b.product?.toLowerCase() || "";
                    break;
                case "created_at":
                    aValue = a.created_at
                        ? new Date(a.created_at).getTime()
                        : 0;
                    bValue = b.created_at
                        ? new Date(b.created_at).getTime()
                        : 0;
                    break;
                case "contact_due_date":
                    // Sort by latest_contact_again_due_date, with null values last
                    aValue = a.latest_contact_again_due_date
                        ? new Date(a.latest_contact_again_due_date).getTime()
                        : Number.MAX_SAFE_INTEGER;
                    bValue = b.latest_contact_again_due_date
                        ? new Date(b.latest_contact_again_due_date).getTime()
                        : Number.MAX_SAFE_INTEGER;
                    break;
                default:
                    return 0;
            }

            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }, [contacts, sortField, sortDirection]);

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

    const handleUpdateContact = async (formData: Partial<Contact>) => {
        if (!selectedContact?.id) return;
        const result = await updateContact(selectedContact.id, formData);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsEditDialogOpen(false);
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
                            <TableHead>
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
                                    onClick={() => handleSort("product")}
                                    className="h-auto p-0 font-semibold"
                                >
                                    Product
                                    {getSortIcon("product")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() => handleSort("created_at")}
                                    className="h-auto p-0 font-semibold"
                                >
                                    Date Added
                                    {getSortIcon("created_at")}
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    onClick={() =>
                                        handleSort("contact_due_date")
                                    }
                                    className="h-auto p-0 font-semibold"
                                >
                                    Contact Due Date
                                    {getSortIcon("contact_due_date")}
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedContacts.map((contact) => {
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
                                        {contact.company || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {contact.product || "N/A"}
                                    </TableCell>
                                    <TableCell>
                                        {formatDateSafe(contact.created_at)}
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
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                >
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
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
        </>
    );
}
