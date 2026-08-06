'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Screen({
  children,
  className,
  plain,
  gradient,
}: {
  children: ReactNode;
  className?: string;
  plain?: boolean;
  gradient?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        'app-shell',
        plain && 'app-shell-plain',
        gradient && 'gradient-screen',
        className,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
