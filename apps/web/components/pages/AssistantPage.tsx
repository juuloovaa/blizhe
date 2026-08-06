'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Doodles } from '@/components/Doodles';
import { Screen } from '@/components/Screen';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  safetyFlag: boolean;
};

const PROMPTS = [
  'Я не понимаю, почему злюсь',
  'Мне не хватает внимания, но я боюсь об этом говорить',
  'Помоги спокойно начать сложный разговор',
  'Чувствую тревогу — что сделать прямо сейчас?',
];

export function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api<Message[]>('/assistant')
      .then(setMessages)
      .catch((e) => toastError(e.message));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(content: string) {
    const value = content.trim();
    if (!value || busy) return;
    setBusy(true);
    setText('');
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: value,
      safetyFlag: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      await api<Message>('/assistant', {
        method: 'POST',
        body: JSON.stringify({ content: value }),
      });
      haptic('light');
      const history = await api<Message[]>('/assistant');
      setMessages(history);
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Doodles scene="assistant" />
      <div className="relative z-[1]">
        <div className="row" style={{ gap: 14 }}>
          <motion.div
            className="mascot"
            animate={{ scale: [1, 1.05, 1], rotate: [-2, 2, -2] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            б
          </motion.div>
          <div>
            <p className="eyebrow">только ваше</p>
            <h1 className="h2" style={{ margin: 0 }}>
              Помощник
            </h1>
            <p className="lead-hand" style={{ margin: '4px 0 0' }}>
              партнёр сюда не заглянет
            </p>
          </div>
        </div>

        <div className="section chat">
          {messages.length === 0 && (
            <motion.div
              className="bubble assistant"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              привет. я рядом — разобрать чувства, подготовиться к разговору или сделать мягкое
              упражнение. чем могу поддержать?
            </motion.div>
          )}
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bubble ${m.role === 'user' ? 'user' : 'assistant'} ${m.safetyFlag ? 'safety' : ''}`}
            >
              {m.content}
            </motion.div>
          ))}
          {busy && <div className="bubble assistant muted">думаю…</div>}
          <div ref={endRef} />
        </div>

        {messages.length < 2 && (
          <div className="prompt-row section">
            {PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)}>
                {p}
              </button>
            ))}
          </div>
        )}

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send(text);
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="напишите, что чувствуете…"
            maxLength={2000}
          />
          <button className="btn" disabled={busy || !text.trim()} type="submit" aria-label="Отправить">
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </Screen>
  );
}
