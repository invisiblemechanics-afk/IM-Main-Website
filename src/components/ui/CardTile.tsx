import * as React from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";

type CardTileProps = React.HTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  as?: "button" | "div"; // use "div" when parent handles click via Link
};

export function CardTile({
  icon,
  title,
  description,
  as = "button",
  className = "",
  children,
  ...rest
}: CardTileProps) {
  const Comp: any = as === "div" ? motion.div : motion.button;

  // Magnetic border hotspot (visual only)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [ -50, 50 ], [ 4, -4 ]);
  const rotateY = useTransform(x, [ -50, 50 ], [ -4, 4 ]);

  function onMove(e: React.MouseEvent) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const px = e.clientX - rect.left - rect.width / 2;
    const py = e.clientY - rect.top - rect.height / 2;
    x.set(Math.max(-50, Math.min(50, px / 6)));
    y.set(Math.max(-50, Math.min(50, py / 6)));
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <Comp
      whileHover={{ y: -2 }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={[
        "group relative w-full rounded-2xl border border-transparent bg-surface p-6 text-left shadow-card focus:outline-none",
        "hover:border-accent/30 hover:shadow-cardHover",
        "focus-ring",
        "h-full flex flex-col",
        className,
      ].join(" ")}
      {...rest}
    >
      {/* Magnetic ring */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-2xl ring-0 transition-all duration-200 group-hover:ring-4 group-hover:ring-accent/10"
      />
      {/* Icon pod */}
      {icon && (
        <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[rgba(124,92,255,0.12)] ring-1 ring-[rgba(124,92,255,0.25)]">
          {icon}
        </div>
      )}
      <div className="flex items-start justify-between gap-4 flex-1">
        <div className="flex-1">
          <h3 className="text-[17px] font-semibold tracking-tight2 text-text">{title}</h3>
          {description && (
            <p className="mt-1.5 text-[13.5px] leading-5 text-text-muted">{description}</p>
          )}
        </div>
        <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-text-muted">
          {/* keep existing chevron if you have one; else simple › */}
          &#8250;
        </span>
      </div>
      {children}
    </Comp>
  );
}



