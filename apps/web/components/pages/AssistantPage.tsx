'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { api } from '@/lib/api';
import { toastError } from '@/lib/toast';
import { haptic } from '@/lib/telegram';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/state/AuthContext';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  safetyFlag: boolean;
};

const PROMPTS = [
  'Помоги начать разговор',
  'Мне тревожно',
  'Я не понимаю, почему злюсь',
  'Чувствую, что устал(а) объяснять',
];

export function AssistantPage() {
  const { me } = useAuth();
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
      <div className="row space-between">
        <p className="h-md">Помощник</p>
        <span className="badge">только ваше</span>
      </div>
      <p className="copy">Партнёр сюда не заглянет.</p>

      <div className="section chat">
        {messages.length === 0 && (
          <motion.div
            className="bubble assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <b>Привет{me?.displayName ? `, ${me.displayName}` : ''}.</b>
            <br />
            Можно принести сюда то, что пока трудно сказать вслух. С чего начнём?
          </motion.div>
        )}
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bubble ${m.role === 'user' ? 'user' : 'assistant'} ${m.safetyFlag ? 'safe' : ''}`}
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
          placeholder="Напишите, как есть…"
          maxLength={2000}
        />
        <button className="btn" disabled={busy || !text.trim()} type="submit" aria-label="Отправить">
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </Screen>
  );
}
