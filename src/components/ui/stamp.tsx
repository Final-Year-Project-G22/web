import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * ማህተም — the rubber stamp. Decision states (approved / rejected) render as
 * rotated, serrated, double-bordered stamps (direction-spec §4.2). A registry
 * artifact used ONLY for decisions; pending/sent stay as pills. Consumes the
 * semantic tokens; the user's stamp-inside-data-rows call is the surfaces'.
 */
const stampVariants = cva(
  "relative inline-flex items-center gap-1.5 border border-current rounded-[3px] px-3.5 py-0.5 font-display text-[10.5px] font-bold tracking-[0.14em] uppercase select-none whitespace-nowrap",
  {
    variants: {
      variant: {
        good: "text-success-strong",
        bad: "text-destructive-strong",
      },
    },
    defaultVariants: {
      variant: "good",
    },
  }
)

const STAMP_CLIP =
  "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)"

function Stamp({
  className,
  variant = "good",
  rotate = true,
  style,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof stampVariants> & { rotate?: boolean }) {
  const rotation = rotate
    ? variant === "bad"
      ? "rotate-[1.1deg]"
      : "rotate-[-1.2deg]"
    : ""

  return (
    <span
      data-slot="stamp"
      data-variant={variant}
      className={cn(
        stampVariants({ variant }),
        rotation,
        // serrated edge + the inside dashed rule (the second border)
        "[clip-path:var(--stamp-clip)]",
        "[&::before]:absolute [&::before]:inset-[2px] [&::before]:border [&::before]:border-dashed [&::before]:border-current [&::before]:rounded-[2px] [&::before]:opacity-50 [&::before]:pointer-events-none",
        className
      )}
      style={{ "--stamp-clip": STAMP_CLIP, ...style } as React.CSSProperties}
      {...props}
    />
  )
}

export { Stamp, stampVariants }
