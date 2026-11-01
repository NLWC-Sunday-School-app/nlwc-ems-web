"use client";

import { ChildEmergency, Collectors } from "@/components/ChildContacts";
import { EmergencyContactForm } from "@/components/EmergencyContactForm";
import { Avatar, Loading } from "@/components/Form";
import { api } from "@/lib/api";
import { pickupText } from "@/lib/editions";
import { initials } from "@/lib/format";
import type { Contact, PublicEdition } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";
import { isPhysical, type Entry } from "./model";

function SelfEmergency() {
  const { data, loading } = useLoad(() => api.get<Contact | null>("/emergency-contact"));
  if (loading && data === undefined) return <Loading />;
  return <EmergencyContactForm path="/emergency-contact" initial={data} title="Your emergency contact" key={data?.phone ?? "none"} />;
}

export function PickupStep({ edition, entries }: { edition: PublicEdition; entries: Entry[] }) {
  const physical = entries.filter((e) => e.registration && isPhysical(e.registration.participationMode));
  const kids = physical.filter((e) => e.person.isChild);
  const self = physical.find((e) => e.person.isSelf);
  const pickup = pickupText(edition);

  if (physical.length === 0)
    return (
      <div className="card stack-4">
        <h3>Pick-up and contacts</h3>
        <p className="sm muted">Nobody you've chosen is attending in person, so there is nothing to add here. Continue to the next step.</p>
      </div>
    );

  return (
    <div className="stack-6">
      <div>
        <h3>Who may pick up, and who can we call?</h3>
        {pickup && (
          <div className="alert warn" style={{ marginTop: "var(--space-3)" }}>
            <span aria-hidden="true">⏱</span>
            <div><b>Walk-in children must be picked up {pickup.replace(" daily", "")} every day.</b>A pass alone never releases a child. Only the people you list can collect them.</div>
          </div>
        )}
      </div>

      {kids.map((e) => (
        <section className="card stack-6" key={e.person.personId} aria-label={`Pick-up for ${e.person.given}`}>
          <div className="row">
            <Avatar>{initials(e.person.given)}</Avatar>
            <h3>{e.person.given} {e.person.family}</h3>
          </div>
          <Collectors childId={e.person.personId} />
          <hr className="divider" />
          <ChildEmergency childId={e.person.personId} />
        </section>
      ))}

      {self && (
        <section className="card" aria-label="Your emergency contact">
          <SelfEmergency />
        </section>
      )}
    </div>
  );
}
