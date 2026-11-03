"use client";

import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { Loading } from "@/components/Form";
import { api } from "@/lib/api";
import type { Contact } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";
import { isPhysical, type Entry } from "./model";

function SelfEmergency() {
  const { data, loading } = useLoad(() => api.get<Contact | null>("/emergency-contact"));
  if (loading && data === undefined) return <Loading />;
  return <EmergencyContactForm path="/emergency-contact" initial={data} title="Your emergency contact" key={data?.phone ?? "none"} />;
}

export function PickupStep({ entries }: { entries: Entry[] }) {
  const physical = entries.filter((e) => e.registration && isPhysical(e.registration.participationMode));
  const self = physical.find((e) => e.person.isSelf);

  if (!self)
    return (
      <div className="card stack-4">
        <h3>Contacts</h3>
        <p className="sm muted">Nothing to add here. Continue to the next step.</p>
      </div>
    );

  return (
    <section className="card" aria-label="Your emergency contact">
      <SelfEmergency />
    </section>
  );
}
