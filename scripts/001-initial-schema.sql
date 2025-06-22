-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    product TEXT,
    email TEXT UNIQUE NOT NULL,
    telephone TEXT,
    company TEXT,
    address TEXT,
    notes TEXT,
    -- This 'next_steps' is for the contact entity itself, as requested.
    -- Workflow tables will derive 'Latest Next Steps' from communications.
    next_steps TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE contacts IS 'Primary table for storing contact information.';

-- Communications Table
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    contact_again_due_date DATE,
    next_steps TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE communications IS 'Tracks all communications with contacts.';

-- Enum for initial_way_of_contact
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_source_type') THEN
        CREATE TYPE contact_source_type AS ENUM ('incoming/warm', 'outbound/cold');
    END IF;
END$$;
COMMENT ON TYPE contact_source_type IS 'Describes how a contact was initially engaged.';

-- Workflow Tables
CREATE TABLE potentials (
    contact_id UUID PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE potentials IS 'Contacts that are potential leads.';

CREATE TABLE incoming_requests (
    contact_id UUID PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
    date_of_request TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE incoming_requests IS 'Contacts that made an incoming request.';

CREATE TABLE contacted_contacts (
    contact_id UUID PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
    notes TEXT,
    initial_way_of_contact contact_source_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE contacted_contacts IS 'Contacts that have been actively contacted.';

CREATE TABLE clients (
    contact_id UUID PRIMARY KEY REFERENCES contacts(id) ON DELETE CASCADE,
    contract_conditions TEXT,
    contract_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
COMMENT ON TABLE clients IS 'Contacts that have become clients.';

-- Trigger for updated_at on contacts
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_contacts_timestamp') THEN
        CREATE TRIGGER set_contacts_timestamp
        BEFORE UPDATE ON contacts
        FOR EACH ROW
        EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END$$;

-- Function to get latest communication details for a contact
CREATE OR REPLACE FUNCTION get_latest_communication_details(p_contact_id UUID)
RETURNS TABLE (latest_next_steps TEXT, latest_contact_again_due_date DATE, communication_id UUID, communication_date TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
    RETURN QUERY
    SELECT
        comm.next_steps,
        comm.contact_again_due_date,
        comm.id,
        comm.date
    FROM
        communications comm
    WHERE
        comm.contact_id = p_contact_id
    ORDER BY
        comm.date DESC, comm.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION get_latest_communication_details(UUID) IS 'Retrieves the most recent communication details for a given contact.';

-- RLS Policies (assuming public access for now, adjust with authentication)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "Allow users to insert contacts" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update contacts" ON contacts FOR UPDATE USING (true);
CREATE POLICY "Allow users to delete contacts" ON contacts FOR DELETE USING (true);

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to communications" ON communications FOR SELECT USING (true);
CREATE POLICY "Allow users to insert communications" ON communications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users to update communications" ON communications FOR UPDATE USING (true);
CREATE POLICY "Allow users to delete communications" ON communications FOR DELETE USING (true);

-- Apply RLS to workflow tables similarly
ALTER TABLE potentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to potentials" ON potentials FOR SELECT USING (true);
CREATE POLICY "Allow users to manage potentials" ON potentials FOR ALL USING (true);

ALTER TABLE incoming_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to incoming_requests" ON incoming_requests FOR SELECT USING (true);
CREATE POLICY "Allow users to manage incoming_requests" ON incoming_requests FOR ALL USING (true);

ALTER TABLE contacted_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to contacted_contacts" ON contacted_contacts FOR SELECT USING (true);
CREATE POLICY "Allow users to manage contacted_contacts" ON contacted_contacts FOR ALL USING (true);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to clients" ON clients FOR SELECT USING (true);
CREATE POLICY "Allow users to manage clients" ON clients FOR ALL USING (true);
