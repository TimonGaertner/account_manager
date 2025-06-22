"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
    AddContactFormData,
    Contact,
    UpdateContactFormData,
} from "@/lib/types";
import { useEffect } from "react";

const contactFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Invalid email address." }),
    product: z.string().optional().nullable(),
    telephone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    next_steps: z.string().optional().nullable(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactFormProps {
    onSubmit: (
        data: AddContactFormData | UpdateContactFormData
    ) => Promise<void>;
    initialData?: Contact | null;
    isSubmitting: boolean;
    submitButtonText?: string;
}

export default function ContactForm({
    onSubmit,
    initialData,
    isSubmitting,
    submitButtonText = "Save Contact",
}: ContactFormProps) {
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            name: initialData?.name || "",
            email: initialData?.email || "",
            product: initialData?.product || "",
            telephone: initialData?.telephone || "",
            company: initialData?.company || "",
            address: initialData?.address || "",
            notes: initialData?.notes || "",
            next_steps: initialData?.next_steps || "",
        },
    });

    useEffect(() => {
        if (initialData) {
            form.reset({
                name: initialData.name || "",
                email: initialData.email || "",
                product: initialData.product || "",
                telephone: initialData.telephone || "",
                company: initialData.company || "",
                address: initialData.address || "",
                notes: initialData.notes || "",
                next_steps: initialData.next_steps || "",
            });
        }
    }, [initialData, form]);

    const handleSubmit = async (values: ContactFormValues) => {
        await onSubmit(values);
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name *</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="john.doe@example.com"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="product"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    Product/Service Interested In
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="e.g., SaaS Subscription"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="telephone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telephone</FormLabel>
                                <FormControl>
                                    <Input
                                        type="tel"
                                        placeholder="+1234567890"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Acme Corp"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="123 Main St, Anytown, USA"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>General Notes</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Any relevant notes about the contact..."
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormDescription>
                                These are general notes about the contact
                                themselves.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="next_steps"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact's Next Steps</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="e.g., Follow up on proposal"
                                    {...field}
                                    value={field.value ?? ""}
                                />
                            </FormControl>
                            <FormDescription>
                                This is for the contact entity itself, not tied
                                to a specific communication.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                >
                    {isSubmitting ? "Saving..." : submitButtonText}
                </Button>
            </form>
        </Form>
    );
}
