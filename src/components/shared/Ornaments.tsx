interface SvgProps {
  className?: string;
}

/** Sketched horizontal flourish — slightly irregular wave with a centered point. */
export function Flourish({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 120 14"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M 4 8 Q 18 3 32 8 Q 46 13 60 7" />
      <path d="M 60 7 Q 74 1 88 8 Q 102 14 116 8" />
      <circle cx="60" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <path d="M 56 7 L 51 5" />
      <path d="M 64 7 L 69 5" />
    </svg>
  );
}

/** Short centered rule with an ornament glyph mid-line. */
export function SectionDivider({ className, glyph = '❦' }: SvgProps & { glyph?: string }) {
  return (
    <div className={`flex items-center justify-center gap-4 text-rule ${className ?? ''}`}>
      <span className="block h-px w-16 bg-rule" />
      <span className="text-faded text-base" aria-hidden>{glyph}</span>
      <span className="block h-px w-16 bg-rule" />
    </div>
  );
}

/** Small leaf-shaped marker, used inline. */
export function Leaf({ className }: SvgProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.7"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M 2 10 Q 3 4 10 2" />
      <path d="M 2 10 Q 7 9 10 2" />
      <path d="M 5 7 L 7 6" />
      <path d="M 4 9 L 6 8" />
    </svg>
  );
}

/** Up arrow as small hand-drawn mark — replaces lucide ArrowUp. */
export function InkArrow({ className, direction = 'up' }: SvgProps & { direction?: 'up' | 'down' }) {
  const flip = direction === 'down' ? 'rotate-180' : '';
  return (
    <svg
      viewBox="0 0 10 12"
      className={`${className ?? ''} ${flip} transition-transform duration-200`}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M 5 11 L 5 2" />
      <path d="M 2 5 L 5 1.5 L 8 5" />
    </svg>
  );
}

/** Pair of short rules (above + below) framing a section heading without making it a "card". */
export function RuledBand({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="border-t border-rule" />
      <div className="border-t border-rule-soft mt-[2px]" />
      {children}
      <div className="border-t border-rule-soft" />
      <div className="border-t border-rule mt-[2px]" />
    </div>
  );
}
