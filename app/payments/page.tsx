import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payments" };

/** Nothing to pay for yet: Bible Bootcamp 2026 is free. This page is where receipts and balances will appear. */
export default function PaymentsPage() {
  return (
    <div className="container page-pad">
      <div className="narrow stack-6">
        <div>
          <h1>Payments</h1>
          <p className="muted sm" style={{ marginTop: 4 }}>Receipts and balances for events that have a price.</p>
        </div>
        <div className="empty">
          <h3>No payments yet</h3>
          <p className="muted sm">Events that are free, like Bible Bootcamp 2026, never ask for payment. If you register for an event with a price, its receipt will appear here.</p>
          <p style={{ marginTop: "var(--space-4)" }}><Link className="btn btn-secondary" href="/events">Browse events</Link></p>
        </div>
      </div>
    </div>
  );
}
