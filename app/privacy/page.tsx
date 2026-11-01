"use client";

import Link from "next/link";
import { Loading, FormError } from "@/components/Form";
import { RequireAuth } from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { CONSENT_TITLE } from "@/components/wizard/model";
import { ageOn, formatShortDate } from "@/lib/format";
import { editionOf, isLive, whoMap } from "@/lib/registrations";
import type { Consent, Dependant, Profile, PublicEdition, Registration } from "@/lib/types";
import { useLoad } from "@/lib/useAsync";

export default function PrivacyPage() {
  return (
    <RequireAuth>
      <Privacy />
    </RequireAuth>
  );
}

function Privacy() {
  const { data, loading, error } = useLoad(async () => {
    const [profile, kids, regs, editions] = await Promise.all([
      api.get<Profile>("/profile"),
      api.get<Dependant[]>("/dependant"),
      api.get<Registration[]>("/registration"),
      api.get<PublicEdition[]>("/public/edition"),
    ]);
    const who = whoMap(profile, kids, (d) => ageOn(d));
    const rows = (
      await Promise.all(
        regs.filter(isLive).map(async (r) => {
          const list = await api.get<Consent[]>(`/registration/${r.id}/consent`).catch(() => [] as Consent[]);
          return list.map((c) => ({ reg: r, consent: c, who: who[r.personId], edition: editionOf(r, editions) }));
        }),
      )
    ).flat();
    return rows.sort((a, b) => b.consent.answeredAt.localeCompare(a.consent.answeredAt));
  });

  return (
    <div className="container page-pad">
      <div className="narrow stack-4">
        <h1>Privacy and consents</h1>

        <div className="card stack-4">
          <h3>Communication</h3>
          <div className="row between">
            <div><b>Event messages</b><div className="xs muted">Receipts, passes and safety alerts. Needed to take part.</div></div>
            <span className="badge b-neutral">Always on</span>
          </div>
          <p className="xs muted">{/* TODO(communications API): optional news and WhatsApp alert preferences need an API before they can be shown here. */}Choices for news and invitations will appear here once messaging is switched on.</p>
        </div>

        <div className="card stack-2">
          <h3>Consent history</h3>
          <FormError message={error} />
          {loading && !data && <Loading />}
          {data?.length === 0 && <p className="sm muted">You haven't answered any permissions yet.</p>}
          {data?.map(({ reg, consent, who, edition }) => (
            <div className="price" key={`${reg.id}-${consent.kind}`}>
              <span>
                {CONSENT_TITLE[consent.kind]} · {who?.given ?? "Someone"} · {edition?.name ?? reg.reference}{" "}
                <span className="mono xs muted">{consent.documentId} v{consent.documentVersion}</span>
              </span>
              <span className={`badge ${consent.accepted ? "b-ok" : consent.kind === "Media" ? "b-neutral" : "b-bad"}`}>
                {consent.accepted ? "Accepted" : "Declined"} {formatShortDate(consent.answeredAt.slice(0, 10))}
              </span>
            </div>
          ))}
          <p className="xs muted">
            You can change a photo and video answer while a registration is still a draft, from <Link href="/dashboard">My events</Link>. Every answer is recorded with its date and the wording version.
          </p>
        </div>

        <div className="card stack-4">
          <h3>Your data</h3>
          <div className="row">
            <button className="btn btn-secondary" disabled aria-disabled="true">Download my data</button>
            <button className="btn btn-ghost" disabled aria-disabled="true">Request correction</button>
          </div>
          {/* TODO(data-request API): the data-request workflow (export, correct, delete) isn't built yet. */}
          <p className="xs muted">Data requests aren't available online yet. Until they are, contact the NLWC events team and we'll handle it for you.</p>
        </div>
      </div>
    </div>
  );
}
