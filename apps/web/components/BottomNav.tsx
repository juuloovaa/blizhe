'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/** Kit nav: soft frosted bar, glyph + lowercase label */
const items = [
  { href: '/', label: 'дом', glyph: '⌂' },
  { href: '/cards', label: 'карты', glyph: '✦' },
  { href: '/tests', label: 'тесты', glyph: '◌' },
  { href: '/assistant', label: 'рядом', glyph: '☺' },
  { href: '/profile', label: 'я', glyph: '♡' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 z-20 flex h-[calc(48px+env(safe-area-inset-bottom))] w-full max-w-[390px] -translate-x-1/2 items-center justify-around rounded-t-[18px] bg-white/78 px-1 pb-[env(safe-area-inset-bottom)] text-[10px] text-[var(--ink-soft)] backdrop-blur-[8px]"
      style={{ boxShadow: '0 -4px 20px rgba(25,61,50,0.06)' }}
    >
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-0 no-underline',
              active ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]',
            )}
          >
            <b
              className="block text-[15px] leading-[14px] font-normal"
              style={{ color: active ? 'var(--ink)' : 'var(--ink-soft)' }}
            >
              {item.glyph}
            </b>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
