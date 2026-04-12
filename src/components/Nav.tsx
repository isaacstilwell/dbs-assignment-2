'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'

const links = [
  { href: '/', label: 'TASKS' },
  { href: '/calendar', label: 'CALENDAR' },
  { href: '/today', label: 'TODAY' },
  { href: '/archive', label: 'ARCHIVE' },
]

export default function Nav() {
  const pathname = usePathname()
  const { isSignedIn, isLoaded } = useUser()

  function isActive(href: string) {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/new') || pathname.startsWith('/edit')
    }
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex items-center justify-between border-b-2 border-[var(--border)] px-6 py-4">
      <span className="hidden md:inline text-sm tracking-[0.3em]">TASK LIST</span>
      <div className="flex items-center gap-4 md:gap-6">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`text-[10px] tracking-widest cursor-pointer ${
              isActive(href)
                ? 'text-[var(--accent)] underline'
                : 'text-[var(--text-dim)] hover:text-[var(--accent)]'
            }`}
          >
            {label}
          </Link>
        ))}
        {isLoaded && (
          isSignedIn ? (
            <UserButton />
          ) : (
            <Link
              href="/sign-in"
              className="text-[10px] tracking-widest text-[var(--text-dim)] hover:text-[var(--accent)] cursor-pointer"
            >
              SIGN IN
            </Link>
          )
        )}
      </div>
    </nav>
  )
}
