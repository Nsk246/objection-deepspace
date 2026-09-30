/** Logo mark: an ink tile with a flat line (the message) over an orange wave (the pushback). */
export function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden="true">
      <rect x="1" y="1" width="24" height="24" rx="7" className="fill-primary" />
      <path d="M7 15 q2 -3 4 0 t4 0 t4 0" fill="none" className="stroke-push" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 10 H19" className="stroke-primary-foreground" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
