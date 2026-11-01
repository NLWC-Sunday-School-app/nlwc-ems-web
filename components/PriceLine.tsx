import { priceLine } from "@/lib/format";
import type { PriceState } from "@/lib/types";

/** The price exactly as the API states it. A missing price reads "pending", never free. */
export function PriceLine({ state, label = "Registration" }: { state: PriceState; label?: string }) {
  const p = priceLine(state);
  return (
    <div className="price">
      <span>{label}</span>
      <span className={p.className}>{p.label}</span>
    </div>
  );
}
