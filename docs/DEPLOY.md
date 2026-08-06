# Деплой «Ближе» (Vercel + Neon + Telegram)

## Что уже настроено в коде

- Фронт: Next.js (static export) → `apps/web/out`
- UI: Tailwind CSS, lucide-react, sonner, framer-motion
- API: NestJS как serverless функция `/api/*`
- Бот: на Vercel без polling, через webhook `/api/bot/webhook`

Опционально на фронте: `NEXT_PUBLIC_API_URL` (по умолчанию `/api`).

## Нужные переменные в Vercel

| Ключ | Значение |
|------|----------|
| `DATABASE_URL` | строка Neon Postgres |
| `TELEGRAM_BOT_TOKEN` | токен от BotFather |
| `TELEGRAM_BOT_USERNAME` | username бота без @ |
| `WEBAPP_URL` | `https://<ваш-домен>.vercel.app` |
| `CORS_ORIGIN` | тот же URL |
| `ALLOW_DEV_AUTH` | `false` |
| `TELEGRAM_WEBHOOK_SECRET` | любой длинный секрет (опционально) |
| `SETUP_SECRET` | секрет для `setup-webhook` |

## После первого деплоя

```bash
# схема + seed (локально, с DATABASE_URL из Neon)
cd apps/api && npx prisma db push && npx prisma db seed

# зарегистрировать webhook бота
curl -X POST https://<домен>/api/bot/setup-webhook \
  -H "x-setup-secret: $SETUP_SECRET"
```

В BotFather → Bot Settings → Menu Button → URL = `WEBAPP_URL`.
