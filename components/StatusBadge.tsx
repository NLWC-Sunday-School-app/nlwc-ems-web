import { REGISTRATION_BADGE } from "@/lib/format";
import type { RegistrationState } from "@/lib/types";

export function StatusBadge({ state }: { state: RegistrationState }) {
  const spec = REGISTRATION_BADGE[state];
  return <span className={`badge ${spec.className}`}>{spec.label}</span>;
}
