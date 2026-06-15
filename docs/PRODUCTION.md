# Production runbook

Этот файл фиксирует пункт 8 по production-инфраструктуре: что уже закрыто в репозитории, что проверяется локально, а что невозможно завершить без внешних аккаунтов, домена и выбранного хостинга.

## Статус пункта 8

| Требование | Статус | Где/что делать |
| --- | --- | --- |
| Deploy на Render/Railway/Fly/VPS | Частично, локально подготовлено | `Dockerfile`, `render.yaml`; фактический deploy делается во внешнем аккаунте Render/Railway/Fly/VPS |
| Postgres | Готово локально и подготовлено для managed DB | `backend/db.js`, `docker-compose.yml`, `render.yaml` |
| Домен | Внешняя задача | Купить/выбрать домен, настроить DNS у регистратора и хостинга |
| HTTPS | Внешняя задача | Включить у хостинга после подключения домена; локально можно только подготовить secure cookies/HSTS |
| Env vars | Готово | `.env.example`, `.env.production.example`, `render.yaml` |
| Логирование | Готово | `backend/logger.js`, `LOG_LEVEL`, `LOG_FORMAT=json` |
| Мониторинг ошибок | Частично | JSON-логи готовы; Sentry/log drain подключается во внешнем сервисе |
| Backup базы | Частично | `npm run db:backup`, `npm run db:restore`; managed backups включаются у провайдера |
| Healthcheck endpoint | Готово | `/api/health` |
| Graceful shutdown | Готово | `SIGTERM`/`SIGINT` закрывают HTTP, WebSocket и Postgres pool |
| Защита cookies | Готово | `HttpOnly`, `SameSite=Lax`, `Secure` в production |
| CORS/security headers | Готово | Origin checks, CSP, HSTS, frame/content headers |
| CI checks на GitHub | Готово в репозитории | `.github/workflows/ci.yml`; фактический запуск будет после push на GitHub |

## Что можно сделать локально

1. Запустить тесты:

```bash
npm test
```

2. Поднять локальную базу:

```bash
npm run db:up
```

3. Проверить healthcheck:

```text
http://localhost:3000/api/health
```

4. Сделать backup локальной или production-базы, если `DATABASE_URL` указывает на нужную БД:

```bash
npm run db:backup
```

5. Восстановить backup:

```bash
npm run db:restore -- backups/cashflow-online-YYYY-MM-DD.dump
```

Для backup/restore должны быть установлены PostgreSQL client tools: `pg_dump` и `pg_restore`.

## Что нельзя завершить локально

- Выполнить настоящий deploy без доступа к аккаунту Render/Railway/Fly/VPS.
- Подключить домен без доступа к DNS/регистратору.
- Выпустить production HTTPS-сертификат без домена и хостинга.
- Включить managed Postgres backups без доступа к панели провайдера.
- Подключить Sentry/log drain без DSN/API key внешнего сервиса.
- Убедиться, что GitHub Actions реально прошли, пока коммиты не запушены на GitHub.
- Проверить production cookies через HTTPS, пока нет production URL.

## Render deploy checklist

1. Запушить ветку в GitHub.
2. В Render создать Blueprint из `render.yaml`.
3. Проверить env vars:

```env
NODE_ENV=production
DATABASE_URL=<managed Postgres connection string>
DATABASE_SSL=true
PUBLIC_ORIGIN=https://your-domain.example
CORS_ORIGINS=https://your-domain.example
SESSION_COOKIE_SECURE=true
EMAIL_DEV_MODE=false
LOG_LEVEL=info
LOG_FORMAT=json
```

4. Дождаться успешного deploy.
5. Открыть `/api/health`, должен быть ответ:

```json
{"ok":true,"database":"ok"}
```

6. Проверить, что WebSocket работает через `wss://`.
7. Проверить, что cookie `meshok_session` имеет `HttpOnly`, `SameSite=Lax`, `Secure`.
8. Включить backups для managed Postgres на стороне Render.
9. Подключить домен и дождаться HTTPS.
10. Подключить log drain или error tracking.

## Backup policy

Минимальная политика для MVP:

- backup не реже 1 раза в день;
- хранить ежедневные backup за последние 7 дней;
- хранить недельные backup за последние 4 недели;
- раз в месяц проверять restore на отдельной базе.

Для managed Postgres лучше использовать встроенные backups провайдера. Для VPS можно запускать `npm run db:backup` по cron/systemd timer и отправлять dump во внешнее хранилище.

## Smoke test после deploy

Проверить:

- `/api/health` возвращает `200`;
- регистрация/логин работают;
- cookie защищена флагом `Secure`;
- создание комнаты работает;
- WebSocket real-time обновления работают;
- в логах видны request logs со статусами и duration;
- CI на GitHub зелёный;
- backup включён или вручную создан и сохранён вне сервера.
