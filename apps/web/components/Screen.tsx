'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Screen({
  children,
  className,
  plain,
}: {
  children: ReactNode;
  className?: string;
  plain?: boolean;
}) {
  return (
    <motion.div
      className={cn('app-shell overflow-hidden', plain && 'app-shell-plain', className)}
      initial={{ opacity: 0, y: 12, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
