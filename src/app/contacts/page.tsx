import { getAllContacts } from "../actions";
import ContactsTable from "@/components/contacts/contacts-table";
import AddContactButton from "@/components/contacts/add-contact-button";

export default async function ContactsPage() {
    const contacts = await getAllContacts();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">All Contacts</h1>
                <AddContactButton />
            </div>
            <ContactsTable contacts={contacts} />
        </div>
    );
}
