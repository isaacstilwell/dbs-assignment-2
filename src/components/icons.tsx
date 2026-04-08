// Custom SVG icons for the brutalist/authoritarian HUD aesthetic.
// All icons use currentColor and scale via the size prop.

interface IconProps {
  size?: number
  className?: string
}

// Sharp geometric X — close, delete, remove.
// Two diagonal lines with square linecaps for a hard military edge.
export function XIcon({ size = 10, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <line x1="1.5" y1="1.5" x2="8.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      <line x1="8.5" y1="1.5" x2="1.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}

// Right-pointing arrow — move / promote actions.
// Horizontal shaft + mitered arrowhead, square linecaps throughout.
export function ArrowRightIcon({ size = 10, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Shaft */}
      <line x1="1" y1="5" x2="7.5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
      {/* Arrowhead */}
      <polyline points="5,2 8.5,5 5,8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
    </svg>
  )
}

// Angular pen icon — edit actions.
// Diagonal barrel (outlined parallelogram) + filled nib point, no curves.
export function EditIcon({ size = 10, className = '' }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Pen barrel — tilted parallelogram */}
      <path
        d="M 7.5 0.5 L 9.5 2.5 L 3.5 8.5 L 1.5 6.5 Z"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinejoin="miter"
      />
      {/* Nib tip — sharp filled triangle */}
      <path
        d="M 3.5 8.5 L 1.5 6.5 L 0.5 9.5 Z"
        fill="currentColor"
      />
    </svg>
  )
}
