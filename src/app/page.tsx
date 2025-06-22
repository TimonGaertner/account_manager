import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    getPotentials,
    getIncomingRequests,
    getContactedContacts,
    getClients,
} from "./actions";
import WorkflowTable from "@/components/workflow/workflow-table"; // Create this next
import type {
    PotentialEntry,
    IncomingRequestEntry,
    ContactedContactEntry,
    ClientEntry,
} from "../lib/types";
import AddContactToPotentialButton from "@/components/workflow/add-contact-to-potential-button"; // Create this

export default async function HomePage() {
    const potentials = await getPotentials();
    const incomingRequests = await getIncomingRequests();
    const contactedContacts = await getContactedContacts();
    const clients = await getClients();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Workflow Stages</h1>
                <AddContactToPotentialButton />
            </div>
            <Tabs defaultValue="potentials" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
                    <TabsTrigger value="potentials">
                        Potentials ({potentials.length})
                    </TabsTrigger>
                    <TabsTrigger value="incoming_requests">
                        Incoming Requests ({incomingRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="contacted_contacts">
                        Contacted ({contactedContacts.length})
                    </TabsTrigger>
                    <TabsTrigger value="clients">
                        Clients ({clients.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="potentials">
                    <WorkflowTable
                        stage="potentials"
                        data={potentials as PotentialEntry[]}
                    />
                </TabsContent>
                <TabsContent value="incoming_requests">
                    <WorkflowTable
                        stage="incoming_requests"
                        data={incomingRequests as IncomingRequestEntry[]}
                    />
                </TabsContent>
                <TabsContent value="contacted_contacts">
                    <WorkflowTable
                        stage="contacted_contacts"
                        data={contactedContacts as ContactedContactEntry[]}
                    />
                </TabsContent>
                <TabsContent value="clients">
                    <WorkflowTable
                        stage="clients"
                        data={clients as ClientEntry[]}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
