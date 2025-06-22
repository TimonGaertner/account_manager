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
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { AddCommunicationFormData } from "@/lib/types";

const communicationFormSchema = z.object({
    date: z.date({ required_error: "Communication date is required." }),
    contact_again_due_date: z.date().optional().nullable(),
    next_steps: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
});

type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

interface CommunicationFormProps {
    contactId: string;
    onSubmit: (data: AddCommunicationFormData) => Promise<void>;
    isSubmitting: boolean;
    submitButtonText?: string;
}

export default function CommunicationForm({
    contactId,
    onSubmit,
    isSubmitting,
    submitButtonText = "Add Communication",
}: CommunicationFormProps) {
    const form = useForm<CommunicationFormValues>({
        resolver: zodResolver(communicationFormSchema),
        defaultValues: {
            date: new Date(),
            contact_again_due_date: null,
            next_steps: "",
            notes: "",
        },
    });

    const handleSubmit = async (values: CommunicationFormValues) => {
        const submissionData: AddCommunicationFormData = {
            ...values,
            contact_id: contactId,
            date: values.date.toISOString(),
            contact_again_due_date: values.contact_again_due_date
                ? format(values.contact_again_due_date, "yyyy-MM-dd")
                : null,
        };
        await onSubmit(submissionData);
        form.reset(); // Reset form after successful submission
    };

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
            >
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Communication Date *</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value &&
                                                    "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contact_again_due_date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Contact Again Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value &&
                                                    "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={field.value || undefined} // Calendar expects Date | undefined
                                        onSelect={field.onChange}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="next_steps"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Next Steps</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="e.g., Send follow-up email, Schedule demo"
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
                            <FormLabel>Communication Notes *</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Details of the communication..."
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto"
                >
                    {isSubmitting ? "Adding..." : submitButtonText}
                </Button>
            </form>
        </Form>
    );
}
