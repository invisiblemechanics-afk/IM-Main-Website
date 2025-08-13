import * as React from "react";

export function SpotlightSection({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  return <section className={`spotlight-bg ${className}`}>{children}</section>;
}



