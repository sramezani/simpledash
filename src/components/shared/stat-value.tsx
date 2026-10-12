import type { ReactNode } from "react";

/** A card's big number with its change underneath. */
export function StatValue({ value, children }: { value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-3xl font-semibold tracking-tight tabular-nums @[16rem]:text-4xl">
        {value}
      </p>
      {children}
    </div>
  );
}
