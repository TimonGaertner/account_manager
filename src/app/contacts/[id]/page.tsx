import { getContactById } from "@/app/actions";
import ContactDetailView from "@/components/contacts/contact-detail-view";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";

interface ContactDetailPageProps {
    params: {
        id: string;
    };
}

export default async function ContactDetailPage({
    params,
}: ContactDetailPageProps) {
    const contactDetails = await getContactById(params.id);

    if (!contactDetails) {
        notFound();
    }

    return (
        <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link href="/contacts">
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Back to All Contacts
                </Link>
            </Button>
            <ContactDetailView contactDetails={contactDetails} />
        </div>
    );
}
