'use client';

import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';

type DoodleScene = 'default' | 'onboarding' | 'home' | 'assistant';

const scenes: Record<DoodleScene, { className: string; style: CSSProperties }[]> = {
  default: [
    { className: 'doodle doodle-blob', style: { top: '-40px', right: '-50px' } },
    { className: 'doodle doodle-blob mustard', style: { bottom: '18%', left: '-60px' } },
    { className: 'doodle doodle-star', style: { top: '22%', left: '12%' } },
    { className: 'doodle doodle-squiggle', style: { top: '12%', right: '18%' } },
  ],
  onboarding: [
    { className: 'doodle doodle-blob', style: { top: '-50px', left: '-40px' } },
    { className: 'doodle doodle-blob mustard', style: { top: '8%', right: '-55px' } },
    { className: 'doodle doodle-blob sky', style: { bottom: '22%', right: '-30px', width: 120, height: 100 } },
    { className: 'doodle doodle-star', style: { top: '28%', right: '20%' } },
    { className: 'doodle doodle-star', style: { bottom: '30%', left: '10%', background: 'var(--pink)' } },
    { className: 'doodle doodle-squiggle', style: { bottom: '18%', left: '20%' } },
    { className: 'doodle doodle-dot', style: { top: '40%', left: '8%' } },
    { className: 'doodle doodle-dot', style: { top: '18%', left: '42%', background: 'var(--coral)' } },
  ],
  home: [
    { className: 'doodle doodle-blob forest', style: { top: '-30px', right: '-40px', width: 130, height: 110 } },
    { className: 'doodle doodle-blob mustard', style: { top: '35%', left: '-70px' } },
    { className: 'doodle doodle-star', style: { top: '14%', left: '8%' } },
    { className: 'doodle doodle-squiggle', style: { top: '8%', right: '14%' } },
  ],
  assistant: [
    { className: 'doodle doodle-blob', style: { top: '-20px', right: '-45px' } },
    { className: 'doodle doodle-blob sky', style: { bottom: '25%', left: '-50px' } },
    { className: 'doodle doodle-star', style: { top: '20%', left: '14%', background: 'var(--mustard)' } },
  ],
};

export function Doodles({ scene = 'default' }: { scene?: DoodleScene }) {
  return (
    <div className="doodles" aria-hidden>
      {scenes[scene].map((item, i) => (
        <motion.span
          key={i}
          className={item.className}
          style={item.style}
          animate={
            item.className.includes('star')
              ? { y: [0, -6, 0] }
              : item.className.includes('squiggle')
                ? { rotate: [-12, -4, -12] }
                : { scale: [1, 1.04, 1] }
          }
          transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
