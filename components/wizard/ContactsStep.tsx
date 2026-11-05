"use client";

import { EmergencyContacts } from "@/components/EmergencyContacts";
import type { EmergencyContact } from "@/lib/types";

/** Step 3: the family's emergency contacts. The ones already on file are shown; add more if needed. At least one is required. */
export function ContactsStep({ onChange }: { onChange: (contacts: EmergencyContact[]) => void }) {
  return (
    <div className="stack-4">
      <p className="sm muted">These are the people we call if we can't reach you. They apply to every child you register, and you can change them any time from your profile.</p>
      <EmergencyContacts heading="h3" intro="Check these are right, and add anyone else we should be able to call." onChange={onChange} />
    </div>
  );
}
