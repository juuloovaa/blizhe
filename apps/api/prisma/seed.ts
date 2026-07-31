import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.dailyQuestion.deleteMany();
  await prisma.card.deleteMany();
  await prisma.testAnswer.deleteMany();
  await prisma.testParticipant.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.testQuestion.deleteMany();
  await prisma.test.deleteMany();

  await prisma.dailyQuestion.createMany({
    data: [
      { text: 'Что сегодня помогло тебе почувствовать опору в себе?', type: 'solo' },
      { text: 'Какое чувство сегодня было самым заметным — и что оно могло сказать?', type: 'solo' },
      { text: 'В чём тебе сегодня особенно нужна была мягкость к себе?', type: 'solo' },
      { text: 'Какую границу сегодня важно было уважить?', type: 'solo' },
      { text: 'За что из сегодняшнего дня ты можешь себя поблагодарить?', type: 'solo' },
      { text: 'Что помогло тебе сегодня почувствовать нашу близость?', type: 'couple' },
      { text: 'Какой жест партнёра сегодня согрел бы тебя больше всего?', type: 'couple' },
      { text: 'О чём тебе хочется спокойно поговорить с партнёром на этой неделе?', type: 'couple' },
      { text: 'В какие моменты вы сегодня были особенно командой?', type: 'couple' },
      { text: 'Как партнёр может поддержать тебя завтра?', type: 'couple' },
    ],
  });

  await prisma.card.createMany({
    data: [
      { category: 'closeness', text: 'Что в партнёре тебя впервые по-настоящему зацепило?' },
      { category: 'closeness', text: 'Какой обычный совместный момент кажется тебе особенным?' },
      { category: 'closeness', text: 'О каком детском воспоминании тебе хочется рассказать?' },
      { category: 'closeness', text: 'Что помогает тебе чувствовать себя в безопасности рядом с человеком?' },
      { category: 'closeness', text: 'Какой комплимент ты принимаешь с трудом — и почему?' },
      { category: 'closeness', text: 'Чему ты хотел(а) бы научиться у партнёра?' },
      { category: 'reflection', text: 'Какая потребность сейчас просит больше внимания?' },
      { category: 'reflection', text: 'Где тебе сейчас важно больше пространства, а где — близости?' },
      { category: 'reflection', text: 'Какую эмоцию тебе сложнее всего показывать другим?' },
      { category: 'reflection', text: 'Что для тебя значит «быть услышанным»?' },
      { category: 'reflection', text: 'Какую границу ты хочешь обозначить мягче и яснее?' },
      { category: 'reflection', text: 'Что ты обычно делаешь, когда устаёшь от отношений — и что могло бы помочь иначе?' },
      { category: 'romance', text: 'Идея: 20 минут без телефонов — только вы и тёплый разговор.' },
      { category: 'romance', text: 'Идея: напишите друг другу по одной благодарности за сегодня.' },
      { category: 'romance', text: 'Идея: маленькое свидание дома — чай, плед и вопрос из карточек.' },
      { category: 'romance', text: 'Идея: сюрприз «забота дня» — одно полезное дело для партнёра.' },
      { category: 'romance', text: 'Идея: прогулка без цели и один честный разговор о мечте.' },
      { category: 'romance', text: 'Идея: вспомните вашу любимую совместную песню и послушайте её вместе.' },
    ],
  });

  const loveLanguages = await prisma.test.create({
    data: {
      slug: 'love-languages',
      title: 'Языки любви',
      description: 'Что помогает вам чувствовать заботу и тепло.',
      type: 'personal',
      topic: 'языки любви',
      questions: {
        create: [
          {
            order: 1,
            text: 'Что обычно сильнее согревает вас?',
            options: [
              { id: 'a', label: 'Тёплые слова и поддержка', scoreKey: 'words' },
              { id: 'b', label: 'Время наедине', scoreKey: 'time' },
              { id: 'c', label: 'Маленький подарок или знак внимания', scoreKey: 'gifts' },
              { id: 'd', label: 'Помощь по делу', scoreKey: 'service' },
              { id: 'e', label: 'Объятия и тактильная близость', scoreKey: 'touch' },
            ],
          },
          {
            order: 2,
            text: 'В трудный день вам важнее всего…',
            options: [
              { id: 'a', label: 'Услышать: «Я с тобой»', scoreKey: 'words' },
              { id: 'b', label: 'Просто побыть рядом', scoreKey: 'time' },
              { id: 'c', label: 'Получить маленький жест заботы', scoreKey: 'gifts' },
              { id: 'd', label: 'Чтобы сняли часть дел с плеч', scoreKey: 'service' },
              { id: 'e', label: 'Чтобы обняли', scoreKey: 'touch' },
            ],
          },
          {
            order: 3,
            text: 'Как вы чаще показываете любовь сами?',
            options: [
              { id: 'a', label: 'Говорю тёплые слова', scoreKey: 'words' },
              { id: 'b', label: 'Выделяю время', scoreKey: 'time' },
              { id: 'c', label: 'Делаю приятные сюрпризы', scoreKey: 'gifts' },
              { id: 'd', label: 'Помогаю практически', scoreKey: 'service' },
              { id: 'e', label: 'Через прикосновения', scoreKey: 'touch' },
            ],
          },
          {
            order: 4,
            text: 'Что сильнее всего ранит, если этого долго нет?',
            options: [
              { id: 'a', label: 'Молчание и отсутствие поддержки', scoreKey: 'words' },
              { id: 'b', label: 'Ощущение, что мы редко вместе', scoreKey: 'time' },
              { id: 'c', label: 'Отсутствие знаков внимания', scoreKey: 'gifts' },
              { id: 'd', label: 'Когда просьбы о помощи игнорируют', scoreKey: 'service' },
              { id: 'e', label: 'Нехватка телесной близости', scoreKey: 'touch' },
            ],
          },
        ],
      },
    },
  });

  await prisma.test.create({
    data: {
      slug: 'attachment-style',
      title: 'Стили привязанности',
      description: 'Как вы обычно реагируете на близость и дистанцию.',
      type: 'personal',
      topic: 'привязанность',
      questions: {
        create: [
          {
            order: 1,
            text: 'Когда партнёр отвечает не сразу, вы чаще…',
            options: [
              { id: 'a', label: 'Спокойно жду и занимаюсь своим', scoreKey: 'secure' },
              { id: 'b', label: 'Начинаю тревожиться', scoreKey: 'anxious' },
              { id: 'c', label: 'Отстраняюсь, чтобы не зависеть', scoreKey: 'avoidant' },
            ],
          },
          {
            order: 2,
            text: 'В близости вам обычно…',
            options: [
              { id: 'a', label: 'Комфортно открываться постепенно', scoreKey: 'secure' },
              { id: 'b', label: 'Хочется больше подтверждений', scoreKey: 'anxious' },
              { id: 'c', label: 'Нужно больше личного пространства', scoreKey: 'avoidant' },
            ],
          },
          {
            order: 3,
            text: 'После ссоры вам легче…',
            options: [
              { id: 'a', label: 'Вернуться к разговору и восстановить контакт', scoreKey: 'secure' },
              { id: 'b', label: 'Искать быстрое примирение, чтобы ушла тревога', scoreKey: 'anxious' },
              { id: 'c', label: 'Взять длинную паузу наедине', scoreKey: 'avoidant' },
            ],
          },
        ],
      },
    },
  });

  await prisma.test.create({
    data: {
      slug: 'know-each-other',
      title: 'Насколько вы знаете друг друга',
      description: 'Совместный тест про внимание к деталям и предпочтениям.',
      type: 'couple',
      topic: 'знание друг друга',
      questions: {
        create: [
          {
            order: 1,
            text: 'Как партнёр обычно восстанавливает силы?',
            options: [
              { id: 'a', label: 'В тишине и одиночестве', scoreKey: 'knowledge' },
              { id: 'b', label: 'В разговоре и объятиях', scoreKey: 'knowledge' },
              { id: 'c', label: 'В движении / прогулке', scoreKey: 'knowledge' },
              { id: 'd', label: 'Во сне и полном отдыхе', scoreKey: 'knowledge' },
            ],
          },
          {
            order: 2,
            text: 'Что партнёру приятнее услышать после тяжёлого дня?',
            options: [
              { id: 'a', label: '«Расскажи, если хочешь»', scoreKey: 'knowledge' },
              { id: 'b', label: '«Я рядом, можно помолчать»', scoreKey: 'knowledge' },
              { id: 'c', label: '«Давай решим, что делать»', scoreKey: 'knowledge' },
              { id: 'd', label: '«Ты справляешься»', scoreKey: 'knowledge' },
            ],
          },
          {
            order: 3,
            text: 'Какой формат совместного времени партнёр любит чаще?',
            options: [
              { id: 'a', label: 'Домашний уют', scoreKey: 'evening_home' },
              { id: 'b', label: 'Выход в кафе / город', scoreKey: 'evening_out' },
              { id: 'c', label: 'Активность и приключения', scoreKey: 'evening_out' },
              { id: 'd', label: 'Творчество вместе', scoreKey: 'evening_home' },
            ],
          },
          {
            order: 4,
            text: 'Что для партнёра важнее в поддержке?',
            options: [
              { id: 'a', label: 'Эмпатия', scoreKey: 'needs' },
              { id: 'b', label: 'Практическая помощь', scoreKey: 'service' },
              { id: 'c', label: 'Честная обратная связь', scoreKey: 'words' },
              { id: 'd', label: 'Пространство без советов', scoreKey: 'boundaries' },
            ],
          },
        ],
      },
    },
  });

  await prisma.test.create({
    data: {
      slug: 'emotional-closeness',
      title: 'Эмоциональная близость',
      description: 'Как вы проживаете близость, доверие и открытость.',
      type: 'couple',
      topic: 'близость',
      questions: {
        create: [
          {
            order: 1,
            text: 'Насколько легко вам делиться уязвимыми чувствами?',
            options: [
              { id: 'a', label: 'Довольно легко', scoreKey: 'secure' },
              { id: 'b', label: 'Иногда получается', scoreKey: 'needs' },
              { id: 'c', label: 'Сложно, даже с близкими', scoreKey: 'boundaries' },
            ],
          },
          {
            order: 2,
            text: 'Что сильнее всего укрепляет вашу близость?',
            options: [
              { id: 'a', label: 'Честные разговоры', scoreKey: 'words' },
              { id: 'b', label: 'Совместные ритуалы', scoreKey: 'time' },
              { id: 'c', label: 'Поддержка в кризисе', scoreKey: 'needs' },
              { id: 'd', label: 'Юмор и лёгкость', scoreKey: 'time' },
            ],
          },
          {
            order: 3,
            text: 'Как вы обычно реагируете, когда партнёр расстроен?',
            options: [
              { id: 'a', label: 'Слушаю и обнимаю', scoreKey: 'touch' },
              { id: 'b', label: 'Ищу решение', scoreKey: 'service' },
              { id: 'c', label: 'Даю пространство', scoreKey: 'boundaries' },
              { id: 'd', label: 'Тревожусь и пытаюсь «починить» всё сразу', scoreKey: 'anxious' },
            ],
          },
        ],
      },
    },
  });

  await prisma.test.create({
    data: {
      slug: 'perfect-evening',
      title: 'Ваш идеальный вечер',
      description: 'Лёгкий игровой тест про совместный отдых.',
      type: 'game',
      topic: 'досуг',
      questions: {
        create: [
          {
            order: 1,
            text: 'Идеальный вечер начинается с…',
            options: [
              { id: 'a', label: 'Вкусной еды дома', scoreKey: 'evening_home' },
              { id: 'b', label: 'Прогулки', scoreKey: 'evening_out' },
              { id: 'c', label: 'Фильма под пледом', scoreKey: 'evening_home' },
              { id: 'd', label: 'Встречи с друзьями', scoreKey: 'evening_out' },
            ],
          },
          {
            order: 2,
            text: 'Главный ингредиент вечера:',
            options: [
              { id: 'a', label: 'Тишина и уют', scoreKey: 'evening_home' },
              { id: 'b', label: 'Разговоры по душам', scoreKey: 'words' },
              { id: 'c', label: 'Приключение', scoreKey: 'evening_out' },
              { id: 'd', label: 'Смех и лёгкость', scoreKey: 'time' },
            ],
          },
          {
            order: 3,
            text: 'Чем вечер должен закончиться?',
            options: [
              { id: 'a', label: 'Объятиями', scoreKey: 'touch' },
              { id: 'b', label: 'Планами на завтра', scoreKey: 'time' },
              { id: 'c', label: 'Благодарностью друг другу', scoreKey: 'words' },
              { id: 'd', label: 'Спокойным сном', scoreKey: 'evening_home' },
            ],
          },
        ],
      },
    },
  });

  console.log('Seed complete. Sample personal test:', loveLanguages.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
