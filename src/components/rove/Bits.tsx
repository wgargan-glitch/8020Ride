import { Star } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TIERS, money, type Receipt, type TierId } from "@/lib/rove/model";

export function PrimaryButton({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "press inline-flex h-12 w-full items-center justify-center gap-2 bg-jade px-5 text-base font-medium text-paper disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function SoftButton({
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        "press inline-flex h-12 w-full items-center justify-center gap-2 border border-ink bg-paper px-5 text-base font-medium text-ink disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export function IconButton({
  label,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "press grid size-11 place-items-center text-ink hover:bg-linen",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SplitBar() {
  return (
    <div>
      <div className="flex h-2 gap-1" aria-hidden="true">
        <div className="h-full w-4/5 bg-jade" />
        <div className="h-full w-1/5 bg-ink" />
      </div>
      <div className="mt-2 flex justify-between text-sm">
        <span className="font-medium text-jade-deep">Driver keeps 80%</span>
        <span className="text-muted">Rove 20%</span>
      </div>
    </div>
  );
}

export function Stars({
  value,
  onChange,
}: {
  value: number;
  onChange?: (n: number) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= value;
        const Comp = onChange ? "button" : "span";
        return (
          <Comp
            key={n}
            {...(onChange
              ? {
                  type: "button" as const,
                  role: "radio",
                  "aria-checked": value === n,
                  onClick: () => onChange(n),
                }
              : { "aria-hidden": true })}
            className={cn(
              "grid size-11 place-items-center",
              onChange && "press hover:bg-linen",
            )}
          >
            <Star
              className={cn("size-6", on ? "fill-jade text-jade" : "text-line")}
              aria-hidden="true"
            />
            {onChange ? <span className="sr-only">{n} stars</span> : null}
          </Comp>
        );
      })}
    </div>
  );
}

export function TierMark({ tier }: { tier: TierId }) {
  return (
    <span className="border border-line bg-linen px-1.5 py-0.5 text-sm font-medium text-ink">
      {TIERS[tier].name}
    </span>
  );
}

export function FareLines({ ride, emphasis }: { ride: Receipt; emphasis: "paid" | "kept" }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Locked fare</dt>
        <dd className={cn("tabular-nums", emphasis === "paid" && "font-medium text-ink")}>
          {money(ride.total)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Driver keeps 80%</dt>
        <dd className={cn("tabular-nums text-jade-deep", emphasis === "kept" && "font-medium")}>
          {money(ride.driver)}
        </dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt className="text-muted">Rove collects 20% from the driver</dt>
        <dd className="tabular-nums text-gold-deep">{money(ride.platform)}</dd>
      </div>
    </dl>
  );
}
