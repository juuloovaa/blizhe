# Ближе — схема базы данных (PostgreSQL / Prisma)

## ER (упрощённо)

```
User 1───* CoupleMember *───1 Couple
User 1───* MoodNote
User 1───* DailyAnswer
User 1───* FavoriteCard
User 1───* AssistantMessage
User 1───1 NotificationSettings
Couple 1───* CoupleInvite
Couple 1───* TestSession
Test 1───* TestQuestion
TestSession 1───* TestAnswer
DailyQuestion (catalog)
Card (catalog)
```

## Таблицы

### users
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| telegram_id | bigint UNIQUE | Telegram user id |
| username | text? | |
| first_name | text? | из Telegram |
| last_name | text? | |
| photo_url | text? | |
| display_name | text | редактируемое |
| pronouns | text? | |
| mode | enum `solo` \| `couple` | выбранный режим |
| onboarding_completed | bool | |
| created_at / updated_at | timestamptz | |

### couples
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| status | enum `active` \| `dissolved` | |
| created_at / dissolved_at | timestamptz | |

### couple_members
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| couple_id | uuid FK | |
| user_id | uuid FK UNIQUE among active | |
| role | enum `inviter` \| `invitee` | |
| joined_at | timestamptz | |
| left_at | timestamptz? | |

### couple_invites
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| code | text UNIQUE | для `start=invite_CODE` |
| inviter_id | uuid FK | |
| couple_id | uuid? FK | создаётся при accept |
| status | enum `pending` \| `accepted` \| `cancelled` \| `expired` | |
| created_at / expires_at | timestamptz | |

### blocks
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| blocker_id | uuid FK | |
| blocked_id | uuid FK | |
| created_at | timestamptz | |
| UNIQUE(blocker_id, blocked_id) | | |

### notification_settings
| Поле | Тип | Описание |
|------|-----|----------|
| user_id | uuid PK/FK | |
| mood_notes | bool default true | |
| test_invites | bool default true | |
| test_partner_done | bool default true | |
| daily_question | bool default true | |
| partner_card | bool default true | |

### daily_questions
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| text | text | |
| type | enum `solo` \| `couple` | |
| active | bool | |

### daily_answers
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| question_id | uuid FK | |
| user_id | uuid FK | |
| couple_id | uuid? FK | для парных |
| answer_text | text | |
| answer_date | date | день вопроса |
| created_at | timestamptz | |
| UNIQUE(question_id, user_id, answer_date) | | |

### mood_notes
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| author_id | uuid FK | |
| couple_id | uuid FK | |
| mood | enum | см. ниже |
| note | text? | |
| created_at | timestamptz | |
| read_at | timestamptz? | |

Mood enum: `need_support`, `want_talk`, `want_close`, `tired`, `anxious`, `grateful`, `feeling_good`

### cards
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| category | enum `closeness` \| `reflection` \| `romance` \| `intimate` | |
| text | text | |
| is_adult | bool default false | intimate скрыт в MVP |
| active | bool | |

### favorite_cards
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| user_id | uuid FK | |
| card_id | uuid FK | |
| created_at | timestamptz | |
| UNIQUE(user_id, card_id) | | |

### card_shares
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| card_id | uuid FK | |
| from_user_id | uuid FK | |
| to_user_id | uuid FK | |
| couple_id | uuid FK | |
| created_at | timestamptz | |
| read_at | timestamptz? | |

### tests
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| slug | text UNIQUE | |
| title | text | |
| description | text | |
| type | enum `personal` \| `couple` \| `game` | |
| topic | text | |
| active | bool | |

### test_questions
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| test_id | uuid FK | |
| order | int | |
| text | text | |
| options | jsonb | `[{id, label, scoreKey?}]` |

### test_sessions
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| test_id | uuid FK | |
| couple_id | uuid? FK | |
| initiator_id | uuid FK | |
| status | enum `in_progress` \| `waiting_partner` \| `completed` \| `cancelled` | |
| result_json | jsonb? | |
| created_at / completed_at | timestamptz | |

### test_participants
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| session_id | uuid FK | |
| user_id | uuid FK | |
| status | enum `pending` \| `in_progress` \| `done` | |
| completed_at | timestamptz? | |
| UNIQUE(session_id, user_id) | | |

### test_answers
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| session_id | uuid FK | |
| user_id | uuid FK | |
| question_id | uuid FK | |
| option_id | text | |
| created_at | timestamptz | |
| UNIQUE(session_id, user_id, question_id) | | |

### assistant_messages
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| user_id | uuid FK | только владелец |
| role | enum `user` \| `assistant` \| `system` | |
| content | text | |
| safety_flag | bool default false | |
| created_at | timestamptz | |

## Приватность на уровне данных

- `assistant_messages` всегда фильтруются по `user_id = current_user`.
- Парные ответы (`daily_answers` couple) отдаются партнёру только если оба ответили за день.
- Личные тесты не пишутся в couple scope.
- Удаление аккаунта: cascade / anonymize + dissolve couple + delete private data.
- Блок: нельзя принять invite / создать пару с blocked user.

## Индексы (ключевые)

- `users.telegram_id`
- `couple_invites.code`
- `daily_answers (user_id, answer_date)`
- `mood_notes (couple_id, created_at desc)`
- `test_sessions (couple_id, status)`
- `assistant_messages (user_id, created_at)`
