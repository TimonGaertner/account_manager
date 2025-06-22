"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { WorkflowStage, AddContactFormData } from "@/lib/types";
import {
    addContactToPotentials,
    addContactToIncomingRequests,
    addContactToContactedContacts,
    addContactToClients,
} from "@/app/actions";

interface AddContactToStageButtonProps {
    stage: WorkflowStage;
    className?: string;
}

export default function AddContactToStageButton({
    stage,
    className,
}: AddContactToStageButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Contact form data
    const [contactData, setContactData] = useState<AddContactFormData>({
        name: "",
        email: "",
        telephone: "",
        company: "",
        product: "",
        address: "",
        notes: "",
        next_steps: "",
    });

    // Stage-specific fields
    const [requestNotes, setRequestNotes] = useState("");
    const [contactNotes, setContactNotes] = useState("");
    const [initialWayOfContact, setInitialWayOfContact] = useState<
        "incoming/warm" | "outbound/cold"
    >("outbound/cold");
    const [contractConditions, setContractConditions] = useState("");
    const [contractNumber, setContractNumber] = useState("");

    const resetForm = () => {
        setContactData({
            name: "",
            email: "",
            telephone: "",
            company: "",
            product: "",
            address: "",
            notes: "",
            next_steps: "",
        });
        setRequestNotes("");
        setContactNotes("");
        setInitialWayOfContact("outbound/cold");
        setContractConditions("");
        setContractNumber("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contactData.name || !contactData.email) {
            toast({
                title: "Error",
                description: "Name and email are required.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            let result: { success: boolean; message: string };

            switch (stage) {
                case "potentials":
                    result = await addContactToPotentials(contactData);
                    break;
                case "incoming_requests":
                    result = await addContactToIncomingRequests(
                        contactData,
                        requestNotes
                    );
                    break;
                case "contacted_contacts":
                    result = await addContactToContactedContacts(
                        contactData,
                        contactNotes,
                        initialWayOfContact
                    );
                    break;
                case "clients":
                    result = await addContactToClients(
                        contactData,
                        contractConditions,
                        contractNumber
                    );
                    break;
                default:
                    result = { success: false, message: "Invalid stage" };
            }

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setIsOpen(false);
                resetForm();
                router.refresh();
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error creating contact:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStageDisplayName = (stage: WorkflowStage) => {
        switch (stage) {
            case "potentials":
                return "Potential";
            case "incoming_requests":
                return "Incoming Request";
            case "contacted_contacts":
                return "Contacted Contact";
            case "clients":
                return "Client";
            default:
                return "Contact";
        }
    };

    const renderStageSpecificFields = () => {
        switch (stage) {
            case "incoming_requests":
                return (
                    <div className="space-y-2">
                        <Label htmlFor="requestNotes">Request Notes</Label>
                        <Textarea
                            id="requestNotes"
                            value={requestNotes}
                            onChange={(e) => setRequestNotes(e.target.value)}
                            placeholder="Enter notes about this incoming request..."
                            rows={3}
                        />
                    </div>
                );
            case "contacted_contacts":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="contactNotes">Contact Notes</Label>
                            <Textarea
                                id="contactNotes"
                                value={contactNotes}
                                onChange={(e) =>
                                    setContactNotes(e.target.value)
                                }
                                placeholder="Enter notes about this contact..."
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="initialWayOfContact">
                                Initial Contact Method
                            </Label>
                            <Select
                                value={initialWayOfContact}
                                onValueChange={(
                                    value: "incoming/warm" | "outbound/cold"
                                ) => setInitialWayOfContact(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="outbound/cold">
                                        Outbound/Cold
                                    </SelectItem>
                                    <SelectItem value="incoming/warm">
                                        Incoming/Warm
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                );
            case "clients":
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="contractNumber">
                                Contract Number
                            </Label>
                            <Input
                                id="contractNumber"
                                value={contractNumber}
                                onChange={(e) =>
                                    setContractNumber(e.target.value)
                                }
                                placeholder="Enter contract number..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contractConditions">
                                Contract Conditions
                            </Label>
                            <Textarea
                                id="contractConditions"
                                value={contractConditions}
                                onChange={(e) =>
                                    setContractConditions(e.target.value)
                                }
                                placeholder="Enter contract conditions..."
                                rows={3}
                            />
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className={className}
                size="sm"
            >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add {getStageDisplayName(stage)}
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Add New {getStageDisplayName(stage)}
                        </DialogTitle>
                        <DialogDescription>
                            Create a new contact and add them directly to{" "}
                            {getStageDisplayName(stage).toLowerCase()}s.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Contact Information */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={contactData.name}
                                    onChange={(e) =>
                                        setContactData({
                                            ...contactData,
                                            name: e.target.value,
                                        })
                                    }
                                    placeholder="Contact name"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={contactData.email}
                                    onChange={(e) =>
                                        setContactData({
                                            ...contactData,
                                            email: e.target.value,
                                        })
                                    }
                                    placeholder="email@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="telephone">Phone</Label>
                                <Input
                                    id="telephone"
                                    value={contactData.telephone || ""}
                                    onChange={(e) =>
                                        setContactData({
                                            ...contactData,
                                            telephone: e.target.value,
                                        })
                                    }
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={contactData.company || ""}
                                    onChange={(e) =>
                                        setContactData({
                                            ...contactData,
                                            company: e.target.value,
                                        })
                                    }
                                    placeholder="Company name"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="product">Product/Service</Label>
                            <Input
                                id="product"
                                value={contactData.product || ""}
                                onChange={(e) =>
                                    setContactData({
                                        ...contactData,
                                        product: e.target.value,
                                    })
                                }
                                placeholder="Product or service of interest"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={contactData.address || ""}
                                onChange={(e) =>
                                    setContactData({
                                        ...contactData,
                                        address: e.target.value,
                                    })
                                }
                                placeholder="Contact address"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="generalNotes">General Notes</Label>
                            <Textarea
                                id="generalNotes"
                                value={contactData.notes || ""}
                                onChange={(e) =>
                                    setContactData({
                                        ...contactData,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="General notes about this contact..."
                                rows={2}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nextSteps">Next Steps</Label>
                            <Textarea
                                id="nextSteps"
                                value={contactData.next_steps || ""}
                                onChange={(e) =>
                                    setContactData({
                                        ...contactData,
                                        next_steps: e.target.value,
                                    })
                                }
                                placeholder="What are the next steps with this contact..."
                                rows={2}
                            />
                        </div>

                        {/* Stage-specific fields */}
                        {renderStageSpecificFields()}

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsOpen(false);
                                    resetForm();
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? "Creating..."
                                    : "Create Contact"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
