# Product readiness audit

Дата аудита: 2026-06-17.

Цель документа: оценить `Мешок Деняк` не как MVP, а как будущий полноценный production-продукт: что уже готово, что является техническим долгом, что блокирует публичный запуск и какие этапы нужны до зрелого продакшена.

## Executive summary

Проект уже вышел за рамки простого MVP: есть аккаунты, Postgres, комнаты, WebSocket real-time, история партий, профиль игрока, правила, симулятор баланса, CI с тестовой Postgres, Docker/Render-конфиг, healthcheck, security headers, production logging и backup tooling.

Но до полноценного продукта для прода ещё нужно пройти несколько больших блоков:

- реальный deploy, домен, HTTPS, managed backups, log/error monitoring;
- production email для подтверждения аккаунта и сброса пароля;
- модульное разделение backend/frontend, потому что `backend/server.js`, `frontend/app.js`, `shared/gameRules.js` и `frontend/styles.css` уже слишком большие;
- браузерные e2e tests;
- администрирование, модерация, abuse protection и политика пользовательского контента;
- продуктовые функции удержания: нормальный onboarding, приглашения, восстановление партии, UX для ошибок, мобильная полировка;
- аналитика продукта и балансировки;
- документация эксплуатации, privacy/terms и правила публичного использования.

Текущая оценка зрелости: сильный MVP / early beta. Для закрытого тестирования с ограниченной аудиторией проект близок к готовности. Для публичного production-запуска пока рано.

## Current readiness by area

| Область | Статус | Комментарий |
| --- | --- | --- |
| Игровое ядро | Частично готово | Правила богаты, есть unit tests и симулятор, но логика монолитна и использует глобальный `Math.random`. |
| Комнаты и multiplayer | Частично готово | Есть комнаты, хост, spectator, WebSocket, reconnect; нет горизонтального масштабирования и внешнего pub/sub. |
| Аккаунты | Частично готово | Есть register/login/sessions/password reset tokens, но нет реальной отправки email и 2FA/social login. |
| История и профиль | Частично готово | Есть история, статистика, публичный профиль; нужны privacy controls, pagination, richer analytics. |
| Frontend UX | MVP+ | Интерфейс функциональный, но монолитный, без component system, без e2e и без полноценной accessibility QA. |
| Database | Частично готово | Postgres и миграции есть; `backend/schema.sql` отстаёт от миграций, нет lifecycle jobs/retention. |
| Security | Базово готово | Cookies, CSP, CORS, rate limit есть; нужны audit, stronger validation, bot/abuse controls, content moderation. |
| Testing | Хорошо для MVP | Unit/API/integration есть; e2e и visual/mobile regression ещё нет. |
| Observability | Частично готово | JSON logs есть; нет Sentry/log drain dashboards/alerts. |
| Production infra | Подготовлено локально | Docker/Render config есть; реального deploy/domain/HTTPS/backups/monitoring ещё нет. |
| Product/legal | Не готово | Нет terms/privacy, support process, moderation policy, analytics consent. |

## What is already solid

### Game and product surface

- Создание комнат, подключение по коду, публичные/приватные комнаты.
- Роль хоста, готовность игроков, старт/рестарт/архивация.
- Spectator flow.
- WebSocket real-time updates, heartbeat, reconnect fallback через HTTP polling.
- Игровой цикл: профессии, денежный круг, сделки, рынок, долги, репутация, Лига проектов, цели, портфельная победа.
- Финансовый стресс: ликвидация, реструктуризация, банкротство.
- Чат комнаты с ограничением истории.
- Профиль, история игр, статистика и публичный профиль.
- Документация правил в `docs/RULES.md`.

### Backend and data

- Node HTTP/WebSocket backend без лишних runtime dependencies.
- Postgres persistence.
- Версионированные SQL migrations.
- Healthcheck `/api/health`.
- Session cookies с `HttpOnly`, `SameSite=Lax`, `Secure` в production.
- Auth rate limit для register/login/password reset.
- Password hashing через `crypto.pbkdf2Sync`.
- Email verification/password reset tokens хранятся в виде digest.
- Production logging через `backend/logger.js`.
- Graceful shutdown для HTTP, WebSocket и DB pool.

### Testing

- Unit tests для ключевых правил.
- Balance simulator tests.
- API/integration tests с реальной Postgres при `TEST_DATABASE_URL`.
- CI поднимает Postgres service и запускает `npm test`.
- Тесты покрывают auth, rooms, private room access, WebSocket reconnect, завершение партии и запись истории.

### Production preparation

- `Dockerfile`.
- `render.yaml`.
- `.env.production.example`.
- `docs/PRODUCTION.md`.
- Backup/restore scripts через `pg_dump`/`pg_restore`.

## Main blockers before public production

### 1. Real production environment

Текущее состояние: конфиги готовы, но реальный production ещё не поднят.

Нужно:

- создать Render/Railway/Fly/VPS environment;
- подключить managed Postgres;
- выставить production env vars;
- подключить домен;
- проверить HTTPS и `wss://`;
- включить provider-managed backups;
- настроить log drain/error monitoring;
- провести smoke test по `docs/PRODUCTION.md`.

Критерий готовности:

- публичный URL работает по HTTPS;
- `/api/health` стабилен;
- регистрация, логин, создание комнаты, WebSocket и история работают на production;
- rollback/deploy process понятен и документирован.

### 2. Production email

Текущее состояние: `EMAIL_DEV_MODE=false` предусмотрен, но реальной отправки email нет. В production подтверждение email и reset password фактически не будут доставляться пользователю.

Нужно:

- выбрать provider: Resend, Postmark, SendGrid, Mailgun или SMTP;
- добавить email service module;
- отправлять verification и password reset links;
- добавить retry/error logging;
- добавить templates;
- добавить tests для email service с mock transport;
- убрать возврат dev tokens из production responses.

Критерий готовности:

- пользователь может подтвердить email и сбросить пароль без ручного доступа к API response;
- email failures логируются и видны в monitoring.

### 3. Error monitoring and alerts

Текущее состояние: структурные JSON-логи есть, но нет внешнего error tracking.

Нужно:

- подключить Sentry или аналог;
- отправлять uncaught exceptions, unhandled rejections, request errors;
- добавить release/environment tags;
- настроить alerts по 5xx, DB health, restart loops, WebSocket errors;
- настроить log retention.

Критерий готовности:

- ошибка в production попадает в dashboard;
- есть уведомления по критическим сбоям.

### 4. Database maturity

Текущее состояние: migrations есть, но `backend/schema.sql` отстаёт от миграций. Комнаты хранятся как JSONB state, что удобно для MVP, но сложнее для аналитики, миграций состояния и конкурентного доступа.

Нужно:

- обновить `backend/schema.sql` до актуальной схемы, включая `auth_tokens`, `email_verified_at`, `password_changed_at`, `expires_at`, `revoked_at`;
- добавить миграционный workflow: отдельная команда проверки/применения migrations;
- добавить backup restore drill;
- решить lifecycle policy для старых комнат, chat, debug logs, archived rooms;
- добавить optimistic locking/version для room state или транзакционное обновление с версией;
- оценить индексы для публичных комнат и истории;
- подумать о разделении JSONB state и queryable summary fields.

Критерий готовности:

- схема воспроизводится с нуля;
- restore проверен;
- устаревшие данные не растут бесконечно;
- одновременные действия игроков не приводят к silent overwrite.

### 5. Backend modularity

Текущее состояние: `backend/server.js` примерно 1500 строк и содержит HTTP routing, auth, WebSocket, cookies, security headers, room logic, history recording и test exports.

Нужно разделить:

- `backend/app.js` или `backend/httpServer.js` - wiring;
- `backend/routes/auth.js`;
- `backend/routes/rooms.js`;
- `backend/ws/rooms.js`;
- `backend/services/authService.js`;
- `backend/services/roomService.js`;
- `backend/services/historyService.js`;
- `backend/security/headers.js`;
- `backend/security/rateLimit.js`;
- `backend/config.js`;
- `backend/email/*`.

Критерий готовности:

- новые API endpoints добавляются без редактирования огромного файла;
- auth/room/history сервисы тестируются отдельно;
- test-only exports не смешаны с production wiring.

### 6. Frontend maintainability

Текущее состояние: `frontend/app.js` примерно 2360 строк, `frontend/styles.css` примерно 1500 строк, UI собирается вручную через `innerHTML`. Это нормально для MVP, но дорого для полноценного продукта.

Нужно:

- разделить frontend на модули: api client, state, router, auth views, rooms views, game views, profile/history views, realtime client;
- стандартизировать render helpers;
- уменьшить `innerHTML` там, где есть пользовательский контент, или ввести строгий safe-template layer;
- добавить UI state machine для pending decisions;
- добавить browser e2e smoke tests;
- добавить accessibility pass: focus trap в modal, keyboard navigation, aria для live updates, visible focus, screen-reader-friendly errors;
- добавить mobile QA и viewport tests.

Критерий готовности:

- ключевые UI flows покрыты e2e;
- frontend можно менять без риска сломать весь файл;
- пользовательские данные безопасно экранируются централизованно.

### 7. Game integrity and reproducibility

Текущее состояние: правила используют `Math.random`; симулятор временно monkey-patches `Math.random` для seed. Для публичной игры это неудобно для аудита, replay, античит и расследования багов.

Нужно:

- ввести game-level seeded RNG;
- хранить seed и event log;
- сделать действия игроков командными событиями;
- строить replay/debug из event log;
- логировать dice/card draws как deterministic events;
- добавить idempotency keys для player actions;
- добавить защёлки против double-click/double-submit на уровне backend.

Критерий готовности:

- партию можно воспроизвести по seed + event log;
- спорные исходы можно проверить;
- повторный POST из-за сети не делает двойную покупку/ход.

### 8. Multiplayer scale

Текущее состояние: rooms и sockets живут в памяти одного Node process, а state сохраняется в Postgres. Это ограничивает горизонтальное масштабирование.

Нужно:

- принять решение: single-instance production или horizontal scale;
- для horizontal scale добавить Redis/pub-sub или managed realtime layer;
- отделить presence от room state;
- добавить server instance id в logs;
- добавить sticky sessions или external WebSocket coordination;
- добавить нагрузочные smoke tests для N комнат и N подключений.

Критерий готовности:

- понятна максимальная вместимость одной инстанции;
- reconnect и broadcast работают после restart/deploy;
- нет потери state при нескольких Node instances.

### 9. Security and abuse protection

Текущее состояние: есть хороший базовый слой, но публичный продукт требует больше.

Нужно:

- real email verification enforcement для публичных функций;
- stricter password policy или password strength hints;
- CSRF threat review для cookie-auth same-origin API;
- более устойчивый rate limit: сейчас in-memory, при restart сбрасывается и не работает между инстансами;
- rate limit на chat, room creation, join attempts, resend verification;
- moderation для chat/user names/room titles;
- report/block controls;
- audit log для admin-sensitive actions;
- secrets scanning и dependency audit в CI;
- security review CSP с учётом будущих внешних assets;
- privacy controls для публичного профиля.

Критерий готовности:

- злоумышленник не может спамить комнаты/чат/login reset без ограничений;
- пользователь может пожаловаться/скрыть неприемлемый контент;
- публичные профили управляются настройками приватности.

### 10. Testing to production level

Текущее состояние: unit + integration уже хороши для MVP.

Нужно:

- browser e2e: register/login, create room, join second player, ready/start, one turn, reconnect reload, finish/history;
- tests для email flow с mock transport;
- tests для rate limits и security headers;
- tests для migrations from empty DB and existing DB;
- concurrency tests: two fast actions, double click, stale player action;
- WebSocket auth failure and permission tests;
- mobile viewport e2e;
- coverage reporting;
- lint/static checks.

Критерий готовности:

- CI ловит поломки frontend flows, backend API, migrations и realtime;
- flaky tests не блокируют работу.

### 11. Product completeness

Текущее состояние: игра функциональна, но полноценный продукт требует больше неигровой оболочки.

Нужно:

- landing/about или clear product entry screen;
- onboarding для новых игроков: tutorial, tooltips, demo room, quick rules;
- улучшенный invite flow;
- lobby discovery для публичных игр;
- reconnect/resume UX после долгого отсутствия;
- empty states и recoverable errors;
- support/contact channel;
- release notes/changelog;
- account deletion/export;
- notification strategy;
- analytics funnel: registration, room created, game started, game finished, churn points.

Критерий готовности:

- новый пользователь понимает, что делать без подсказок разработчика;
- можно собирать обратную связь и видеть, где пользователи застревают.

### 12. Legal, privacy, and operations

Текущее состояние: отсутствует как слой.

Нужно:

- Terms of Service;
- Privacy Policy;
- cookie/session notice if required;
- data retention policy;
- account deletion process;
- content moderation policy;
- incident response checklist;
- backup restore checklist;
- operational ownership: кто отвечает за deploy, monitoring, support.

Критерий готовности:

- продукт можно публично показать пользователям без правового и операционного вакуума.

## Recommended roadmap

### Phase 1: Closed beta hardening

Цель: безопасно дать проект ограниченной группе тестеров.

1. Реальный deploy на Render/Railway/Fly/VPS.
2. Домен + HTTPS + `wss://`.
3. Production email.
4. Sentry/log drain + alerts.
5. Managed Postgres backups + restore drill.
6. Обновить `backend/schema.sql`.
7. Browser e2e smoke tests.
8. Fix docs drift: `docs/MVP.md` уже устарел по аккаунтам/WebSocket/Postgres.

### Phase 2: Public beta

Цель: выдержать публичный трафик и поведение незнакомых пользователей.

1. Rate limits вынести из memory в Postgres/Redis или provider layer.
2. Moderation для chat/name/room title.
3. Privacy settings для профиля.
4. Admin/support tools: поиск пользователя/комнаты, архивирование, просмотр ошибок.
5. Frontend split на модули.
6. Backend split на routes/services.
7. Seeded RNG + event log.
8. Analytics dashboard.

### Phase 3: Mature production

Цель: продукт можно развивать системно.

1. Horizontal scaling strategy для WebSocket/presence.
2. Load tests.
3. Full replay/debug tooling.
4. Advanced game balance tooling.
5. Mobile polish and accessibility audit.
6. Legal/privacy package.
7. Product onboarding and retention loops.
8. Release process: staging, migrations, rollback, changelog.

## Priority backlog

### P0 - блокеры публичного production

- Real deploy + domain + HTTPS.
- Production email.
- Error monitoring + alerts.
- Managed backups + restore test.
- Browser e2e smoke tests.
- Update stale schema/docs.
- Basic moderation/rate limit expansion.

### P1 - важно для public beta

- Backend modularization.
- Frontend modularization.
- Seeded RNG and event log.
- Privacy settings.
- Admin/support tooling.
- Migrations/check scripts.
- Dependency/security checks in CI.

### P2 - зрелость продукта

- Horizontal scaling.
- Full replay system.
- Product analytics.
- Accessibility audit.
- Mobile regression tests.
- Terms/privacy/account deletion.
- Load testing.
- Release management.

## Specific technical findings

1. `backend/schema.sql` is stale compared to migrations.
   It does not include all auth hardening fields and `auth_tokens`. This can mislead future setup/debugging.

2. `backend/server.js` is too broad.
   It mixes routing, auth, realtime, persistence orchestration, security headers, session cookies, and history recording.

3. `frontend/app.js` is too broad.
   It owns routing, state, API calls, realtime, all views, all DOM rendering and all event handlers.

4. `shared/gameRules.js` is doing both data definition and game engine work.
   Cards, constants, state normalization, commands, validation, serialization and RNG are all in one file.

5. RNG is global.
   `Math.random` makes production replays hard. The simulator monkey-patches it, which is useful but fragile.

6. Production email is not implemented.
   Auth flows exist, but delivery does not.

7. In-memory rate limits and room presence are single-instance only.
   Good for MVP, insufficient for multi-instance production.

8. E2E tests are intentionally not in CI yet.
   API/integration tests cover critical backend behavior; browser confidence is still missing.

9. Documentation has drift.
   `docs/MVP.md` still says registration, persistent accounts, WebSocket and DB persistence are out of MVP, but they now exist.

10. Product/legal layer is absent.
    Needed before public launch.

## Definition of done for "full production"

Проект можно считать полноценным production-продуктом, когда выполнено:

- public HTTPS URL работает стабильно;
- production email работает;
- monitoring/alerts подключены;
- backups включены и restore проверен;
- CI гоняет unit, integration and browser smoke tests;
- основные abuse сценарии ограничены rate limits/moderation;
- есть privacy/terms/account deletion policy;
- frontend/backend разделены достаточно, чтобы не тормозить разработку;
- game outcomes воспроизводимы через seed/event log или иной replay mechanism;
- есть админский способ расследовать проблемы пользователей;
- есть documented deploy/rollback/migration process.

## Suggested next action

Самый рациональный следующий шаг: закрыть Phase 1. Начать стоит с real deploy + production email + Sentry/log drain. После этого добавить browser e2e smoke tests уже против стабильного тестового окружения, а затем заняться модульностью backend/frontend.
