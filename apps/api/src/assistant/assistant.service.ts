import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const SAFETY_PATTERNS = [
  /самоубий/i,
  /суицид/i,
  /убью себя/i,
  /хочу умереть/i,
  /не хочу жить/i,
  /порезать/i,
  /самоповрежд/i,
  /насили/i,
  /избива/i,
  /угрожает? убить/i,
  /kill myself/i,
  /suicide/i,
];

const CRISIS_REPLY = `Мне важно, что вы об этом говорите. Я не могу заменить экстренную помощь или терапию.

Если вам сейчас опасно или очень тяжело:
• обратитесь к близкому человеку, которому доверяете;
• свяжитесь со специалистом или службой поддержки;
• в угрожающей жизни ситуации позвоните в местные экстренные службы.

В России можно обратиться на телефон доверия: 8-800-2000-122.

Я рядом, чтобы мягко поддержать рефлексию — но безопасность важнее всего. Хотите вместе сформулировать, к кому можно обратиться прямо сейчас?`;

@Injectable()
export class AssistantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async history(userId: string) {
    return this.prisma.assistantMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async send(userId: string, content: string) {
    const text = content.trim();
    const safety = SAFETY_PATTERNS.some((re) => re.test(text));

    await this.prisma.assistantMessage.create({
      data: { userId, role: 'user', content: text, safetyFlag: safety },
    });

    const reply = safety
      ? CRISIS_REPLY
      : await this.generateReply(userId, text);

    const assistant = await this.prisma.assistantMessage.create({
      data: {
        userId,
        role: 'assistant',
        content: reply,
        safetyFlag: safety,
      },
    });

    return assistant;
  }

  private async generateReply(userId: string, text: string): Promise<string> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      try {
        return await this.openAiReply(apiKey, userId, text);
      } catch {
        // fall through to scripted
      }
    }
    return this.scriptedReply(text);
  }

  private async openAiReply(apiKey: string, userId: string, text: string) {
    const history = await this.prisma.assistantMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
    const messages = [
      {
        role: 'system',
        content: `Ты мягкий маскот-помощник приложения «Ближе». Помогаешь с эмоциями, саморефлексией, подготовкой к разговору, КПТ-упражнениями и ненасильственным общением.
Не ставь диагнозы, не заменяй психотерапию, не давай опасных советов.
При признаках суицида, насилия или угрозы жизни — направляй к экстренной помощи.
Отвечай коротко, тепло, на русском, по делу. Задавай 1 уточняющий вопрос.`,
      },
      ...history
        .reverse()
        .map((m) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })),
      { role: 'user', content: text },
    ];

    const model = this.config.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 500 }),
    });
    if (!res.ok) throw new Error('OpenAI error');
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return json.choices?.[0]?.message?.content?.trim() || this.scriptedReply(text);
  }

  private scriptedReply(text: string): string {
    const lower = text.toLowerCase();

    if (/зл[ои]|раздраж|бесит/.test(lower)) {
      return `Злость часто сигналит о важной потребности или границе. Давайте мягко разберём:

1) Что произошло прямо перед чувством?
2) Какая потребность задета: уважение, отдых, близость, справедливость?
3) Как можно сказать об этом без обвинения: «Я чувствую… когда… Мне важно…»

Что из этого откликается сильнее всего прямо сейчас?`;
    }

    if (/вниман|игнор|не замеча/.test(lower)) {
      return `Нехватка внимания — очень человечная потребность. Страх сказать об этом тоже понятен.

Можно начать так:
«Мне важно чувствовать, что мы рядом. В последнее время мне немного не хватает тепла/времени. Можем ли мы найти формат, который подойдёт нам обоим?»

Хотите адаптировать фразу под вашу ситуацию?`;
    }

    if (/разговор|сказ|поговорить|конфликт/.test(lower)) {
      return `Подготовим спокойное начало разговора:

• Выберите время, когда оба не на пределе.
• Начните с намерения: «Хочу сблизиться, а не спорить».
• Опишите факт → чувство → просьбу.
• Оставьте пространство для ответа партнёра.

О какой теме хочется поговорить бережно?`;
    }

    if (/тревог|страх|волную/.test(lower)) {
      return `Давайте заземлим тревогу на минуту:

1) Назовите 5 вещей, которые видите вокруг.
2) Сделайте 4 медленных выдоха длиннее вдоха.
3) Отделите факт от катастрофической мысли: «Что я точно знаю сейчас?»

Какая мысль сильнее всего крутится в голове?`;
    }

    return `Я рядом. Можно говорить о чувствах без оценок — это безопасное личное пространство.

Чтобы помочь точнее, выберите или опишите:
• разобраться в эмоции;
• подготовиться к сложному разговору;
• понять свою потребность;
• сделать короткое упражнение на поддержку.

Что сейчас нужнее всего?`;
  }
}
