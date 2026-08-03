import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { Doodles } from '../components/Doodles';
import { haptic } from '../telegram/webapp';

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
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api<Message[]>('/assistant')
      .then(setMessages)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(content: string) {
    const value = content.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    setText('');
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: value,
      safetyFlag: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const reply = await api<Message>('/assistant', {
        method: 'POST',
        body: JSON.stringify({ content: value }),
      });
      haptic('light');
      const history = await api<Message[]>('/assistant');
      setMessages(history);
      void reply;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell screen" style={{ overflow: 'hidden' }}>
      <Doodles scene="assistant" />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div className="row" style={{ gap: 14 }}>
        <div className="mascot">б</div>
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

      {error && <div className="section error-box">{error}</div>}

      <div className="section chat">
        {messages.length === 0 && (
          <div className="bubble assistant">
            привет. я рядом — разобрать чувства, подготовиться к разговору или сделать мягкое
            упражнение. чем могу поддержать?
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.role === 'user' ? 'user' : 'assistant'} ${m.safetyFlag ? 'safety' : ''}`}
          >
            {m.content}
          </div>
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
        <button className="btn" disabled={busy || !text.trim()} type="submit">
          →
        </button>
      </form>
      </div>
    </div>
  );
}
