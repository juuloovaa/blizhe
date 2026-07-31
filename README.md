# Ближе — Telegram Mini App

MVP-приложение для отношений, эмоциональной близости и саморефлексии.

Документация:

- [UX-структура](./docs/UX.md)
- [Список экранов](./docs/SCREENS.md)
- [Схема БД](./docs/DATABASE.md)

## Стек

- Frontend: React + TypeScript + Vite (Telegram Mini App)
- Backend: NestJS + Prisma + PostgreSQL
- Bot: grammY (кнопка Web App, deep links, уведомления)
- Auth: проверка подписи Telegram `initData` на сервере

## Быстрый старт

### 1. Переменные окружения

```bash
cp .env.example .env
```

Заполните:

- `TELEGRAM_BOT_TOKEN` — токен от [@BotFather](https://t.me/BotFather)
- `TELEGRAM_BOT_USERNAME` — username бота без `@`
- `WEBAPP_URL` — публичный HTTPS URL фронтенда (для Telegram)

Для локальной разработки без Telegram оставьте `ALLOW_DEV_AUTH=true`.

### 2. База данных

```bash
docker compose up -d
npm install
npm run prisma:generate --workspace=@blizhe/api
npm run prisma:push --workspace=@blizhe/api
npm run db:seed
```

### 3. Запуск

```bash
npm run dev:api
npm run dev:web
```

- API: http://localhost:3000
- Web: http://localhost:5173?devUser=1001:Анна

Второй пользователь для проверки пары: `http://localhost:5173?devUser=1002:Максим`

### 4. Telegram

1. Создайте бота в BotFather.
2. Включите Mini App / укажите Web App URL (нужен HTTPS — используйте ngrok/cloudflare tunnel).
3. Запустите API с реальным `TELEGRAM_BOT_TOKEN`.
4. Откройте бота → «Открыть приложение».

Deep link приглашения:

```text
https://t.me/<BOT_USERNAME>?start=invite_<CODE>
```

## MVP-функции

- Авторизация через Telegram `initData` (с серверной проверкой HMAC)
- Онбординг и профиль
- Создание пары по invite-ссылке, отмена, отключение, блок, удаление данных
- Главная: вопрос дня (solo/couple), настроение и заметки
- Карточки: сближение / размышление / романтика, избранное, отправка партнёру
- Тесты: личные, совместные, игровые + результаты без диагнозов
- Приватный помощник-маскот с safety-ответами
- Настройки уведомлений и удаление аккаунта

## Приватность

- Чат с помощником доступен только владельцу
- Ответы на парный вопрос дня открываются только после ответов обоих
- Нет онлайн-статуса и геолокации
