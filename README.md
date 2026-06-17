# Мешок Деняк

Онлайн-прототип настольной экономической игры про капитал, репутацию, проекты и большие цели. Текущая версия уже включает аккаунты, Postgres, WebSocket real-time, историю партий, профиль игрока и базовую production-инфраструктуру.

Игра вдохновлена идеями финансового образования из книги Роберта Кийосаки и настольной игры Cashflow. `Мешок Деняк` является самостоятельным учебно-развлекательным проектом: в нём используются собственные название, структура этапов, условия прогресса, терминология и игровые правила.

## Возможности текущей версии

- Регистрация, вход, сессии, подтверждение email и сброс пароля через токены.
- Создание комнаты и подключение по коду.
- Публичные и приватные комнаты, список комнат, ссылка-приглашение.
- До 4 игроков в комнате.
- Роль хоста, готовность игроков, рестарт, архивирование, spectator mode.
- Выбор стартовой профессии с разными доходами, расходами, наличными и долгами.
- Очередность ходов, бросок кубика и игровое поле.
- Первый круг: Денежный двор с зарплатой, сделками, расходами, рынком, благотворительностью и сокращением.
- Выбор малой или крупной сделки при попадании на клетку возможности.
- Покупка сделок за наличные или с кредитом.
- Рыночные предложения на продажу активов.
- Закрытие обязательств при наличии достаточных наличных.
- Репутация игрока: сделки и благотворительность помогают открыть следующий этап.
- Переход в Лигу проектов при достаточной репутации и денежном резерве.
- Большая цель игрока, отдельное поле Лиги проектов и победа через закрытие цели.
- Проектные возможности в Лиге проектов: игрок решает, вкладываться или пропускать.
- Портфельная победа через несколько проектов и целевой доход.
- Обслуживание проектных активов, чистый поток проектов и рыночные предложения на продажу проектов.
- Долговые guardrails: автоликвидация актива, реструктуризация и банкротство при глубоком минусе.
- Чат комнаты и real-time обновление через WebSocket с heartbeat, reconnect и HTTP-восстановлением состояния.
- Профиль игрока, публичный профиль, история партий и статистика.
- Сохранение аккаунтов, сессий, комнат и истории в Postgres.
- Единый серверный источник правил для поля и профессий (`/api/rules`).
- Unit/API/integration tests, включая тестовую Postgres в CI.

## Запуск

Требуется Node.js 18 или новее и Docker Desktop для локальной базы Postgres.

Сначала установи зависимости:

```bash
npm install
```

Подними локальную базу:

```bash
npm run db:up
```

По умолчанию сервер подключается к Postgres по адресу:

```text
postgres://cashflow:cashflow@localhost:15432/cashflow_online
```

При запуске сервер сам применяет миграции из `backend/migrations/`.

Проверить состояние сервера и базы можно через:

```text
http://localhost:3000/api/health
```

Для auth endpoints включён простой rate limit. Настройки по умолчанию:

```env
AUTH_RATE_WINDOW_MS=60000
AUTH_RATE_MAX=12
SESSION_MAX_AGE_MS=2592000000
SESSION_IDLE_MS=604800000
EMAIL_TOKEN_TTL_MS=86400000
PASSWORD_RESET_TTL_MS=3600000
EMAIL_DEV_MODE=true
WS_HEARTBEAT_MS=30000
LOG_LEVEL=debug
LOG_FORMAT=pretty
```

В dev-режиме ссылки подтверждения email и сброса пароля возвращаются в ответе API, чтобы их можно было тестировать без SMTP-провайдера. Для production нужно подключить отправку email и выставить `EMAIL_DEV_MODE=false`.

```bash
npm start
```

После запуска открой:

```text
http://localhost:3000
```

Для проверки мультиплеера создай комнату и открой второй браузер или вкладку в приватном режиме.

Чтобы остановить локальную базу:

```bash
npm run db:down
```

Если при запуске сервера Postgres отвечает ошибкой `28P01` или "password authentication failed", проверь, что запущен именно Docker Postgres проекта. Контейнер публикуется на внешнем порту `15432`, чтобы не конфликтовать с локальным Postgres на стандартном `5432`.

Если локальные данные в Docker-базе не нужны, можно пересоздать volume:

```bash
docker compose down -v
npm run db:up
```

## Проверка

```bash
npm test
```

Postgres-backed integration tests запускаются при заданном `TEST_DATABASE_URL`. В GitHub Actions тестовая Postgres поднимается автоматически. Подробности: `docs/TESTING.md`.

Быстрый прогон баланса с ботами. Он помогает видеть win rate профессий, средний капитал и причины завершения партий:

```bash
npm run simulate -- --games=80 --players=4 --seed=42 --length=quick --victory=classic
```

## Production

Минимальный production-контур подготовлен под Docker и Render:

- `Dockerfile` запускает Node.js сервер в `NODE_ENV=production`.
- `render.yaml` описывает web service, managed Postgres и healthcheck `/api/health`.
- `.env.production.example` содержит список production-переменных.
- `.github/workflows/ci.yml` запускает `npm ci` и `npm test` на push/PR в `main`.

Обязательные переменные для production:

```env
NODE_ENV=production
DATABASE_URL=postgres://user:password@host:5432/database
DATABASE_SSL=true
PUBLIC_ORIGIN=https://your-domain.example
CORS_ORIGINS=https://your-domain.example
SESSION_COOKIE_SECURE=true
EMAIL_DEV_MODE=false
LOG_LEVEL=info
LOG_FORMAT=json
```

В production сервер требует `DATABASE_URL`, выставляет `Secure` для session cookie, добавляет базовые security headers, проверяет origin для HTTP/WebSocket, пишет структурные JSON-логи и корректно закрывает HTTP, WebSocket и пул Postgres при `SIGTERM`/`SIGINT`.

Логи управляются переменными:

- `LOG_LEVEL` - `debug`, `info`, `warn` или `error`.
- `LOG_FORMAT` - `pretty` для локальной разработки или `json` для production/log drains.

После деплоя нужно отдельно настроить:

- домен и DNS на стороне хостинга;
- HTTPS на стороне Render/Railway/Fly/VPS;
- отправку email для подтверждения и сброса пароля;
- мониторинг ошибок, например Sentry, Better Stack, Axiom или Render log drain;
- backup Postgres: managed backups у провайдера или регулярный `pg_dump` для VPS.

Подробный production-чеклист и граница "что можно сделать локально / что требует внешнего сервиса" лежит в `docs/PRODUCTION.md`.

Локальный backup Postgres:

```bash
npm run db:backup
```

Восстановление backup:

```bash
npm run db:restore -- backups/cashflow-online-YYYY-MM-DD.dump
```

## Структура проекта

- `backend/server.js` - HTTP-сервер, API комнат и раздача frontend.
- `backend/db.js` - подключение к Postgres и запросы хранения.
- `backend/migrations/` - версионированные SQL-миграции Postgres.
- `backend/schema.sql` - снимок текущей схемы Postgres.
- `frontend/index.html` - разметка лобби и игрового экрана.
- `frontend/app.js` - клиентская логика и обновление интерфейса.
- `frontend/styles.css` - тёмная UI-тема.
- `shared/balanceSimulator.js` - симулятор партий для балансировки правил.
- `shared/gameRules.js` - правила, состояние игры и действия игроков.
- `tools/simulateBalance.js` - CLI-отчёт по симуляции баланса.
- `test/gameRules.test.js` - тесты ядра правил.
- `docs/MVP.md` - текущая граница продукта и ближайший план развития.
- `docs/PRODUCT_READINESS_AUDIT.md` - аудит готовности проекта до полноценного production-продукта.
- `docs/PRODUCTION.md` - production runbook, deploy checklist и backup policy.
- `docs/RULES.md` - текущие реализованные правила игры в текстовом виде.
- `docs/TESTING.md` - стратегия тестирования и запуск integration suite.
