'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Flower2, Heart, Home, Smile, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { href: '/', label: 'Дом', icon: Home },
  { href: '/cards', label: 'Карты', icon: Heart },
  { href: '/tests', label: 'Тесты', icon: Sparkles },
  { href: '/assistant', label: 'Рядом', icon: Smile },
  { href: '/profile', label: 'Я', icon: Flower2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 grid h-[calc(68px+env(safe-area-inset-bottom))] w-full max-w-[480px] -translate-x-1/2 grid-cols-5 gap-1 border-t-2 border-ink/5 bg-paper/92 px-2.5 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {items.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-2xl font-[family-name:var(--font-display)] text-[0.68rem] font-extrabold no-underline transition-colors',
              active ? 'bg-coral/12 text-coral-deep' : 'text-ink-soft',
            )}
          >
            <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
