"use client";

import { EmergencyContacts } from "@/components/EmergencyContacts";

/** Step 3: the family's pick-up persons. The ones already on file are shown; adding more is optional. */
export function ContactsStep() {
  return (
    <div className="stack-4">
      <p className="sm muted">Optional. These are the people we can call, or who may collect your children, if we can't reach you. They apply to every child you register, and you can add or change them any time from your profile.</p>
      <EmergencyContacts heading="h3" intro="Add anyone who may collect your children. You can skip this and add people later." />
    </div>
  );
}
