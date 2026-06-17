# Testing plan

Этот файл фиксирует статус пункта 9 и как запускать разные уровни тестов.

## Статус

| Требование | Статус | Где |
| --- | --- | --- |
| Unit tests для правил | Готово, расширяется по мере правил | `test/gameRules.test.js`, `test/balanceSimulator.test.js` |
| API tests для auth/rooms | Готово | `test/api.integration.test.js` |
| Integration tests с тестовой Postgres | Готово | `TEST_DATABASE_URL`, GitHub Actions Postgres service |
| E2E tests для главных сценариев | Следующий этап | Нужен Playwright/browser runner |
| Тесты reconnect | Готово на WebSocket/API уровне | `room websocket can reconnect and receive state` |
| Тесты завершения партии и записи истории | Готово на rules/Postgres уровне | `finished games can be recorded into user history` |

## Локальный запуск

Быстрый прогон unit tests:

```bash
npm test
```

Если `TEST_DATABASE_URL` не задан, Postgres-backed integration tests будут skipped.

Полный локальный прогон с Postgres:

```bash
npm run db:up
```

PowerShell:

```powershell
$env:TEST_DATABASE_URL='postgres://cashflow:cashflow@localhost:15432/cashflow_online'
npm test
```

Только integration suite:

```powershell
$env:TEST_DATABASE_URL='postgres://cashflow:cashflow@localhost:15432/cashflow_online'
npm run test:integration
```

Integration suite перед запуском очищает `public` schema в указанной тестовой базе. Не указывай production `DATABASE_URL` как `TEST_DATABASE_URL`.

## CI

GitHub Actions поднимает `postgres:16-alpine`, выставляет `TEST_DATABASE_URL` и запускает `npm test`, поэтому в CI integration tests не skipped.

## Что осталось для полноценного E2E

Для браузерного E2E нужно добавить Playwright или аналог:

- registration/login через UI;
- create room через UI;
- join room вторым пользователем;
- start game и один ход;
- reconnect после reload/закрытия вкладки;
- finish game smoke scenario;
- проверка history на странице профиля.
