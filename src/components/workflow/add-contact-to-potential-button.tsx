"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircleIcon } from "lucide-react";
import ContactForm from "@/components/dialogs/contact-form";
import { addContactToPotentials } from "../../app/actions";
import type { AddContactFormData } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation"; // Import useRouter

export default function AddContactToPotentialButton() {
    const router = useRouter(); // Initialize router
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (data: AddContactFormData) => {
        setIsSubmitting(true);
        const result = await addContactToPotentials(data);
        setIsSubmitting(false);
        if (result.success) {
            toast({ title: "Success", description: result.message });
            setIsOpen(false);
            router.refresh(); // Refresh data on success
        } else {
            toast({
                title: "Error",
                description: result.message,
                variant: "destructive",
            });
        }
    };
    return null;
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircleIcon className="mr-2 h-4 w-4" /> Add New
                    Potential
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Potential Contact</DialogTitle>
                    <DialogDescription>
                        Enter the details of the new potential contact. They
                        will be added to the "Potentials" stage.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <ContactForm
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        submitButtonText="Add Potential"
                    />
                </div>
                {/* Footer can be removed if submit is handled within form component and dialog closes on success */}
                {/* <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter> */}
            </DialogContent>
        </Dialog>
    );
}
