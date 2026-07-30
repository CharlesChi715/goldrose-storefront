/**
 * Root template — remounts on every route change, so the dissolve animation
 * in globals.css replays on each navigation (the design team's prototype
 * transition, e.g. the ON_CLICK Dissolve on 1523:1992 → /story).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-dissolve">{children}</div>;
}
