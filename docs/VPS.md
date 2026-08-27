# Развёртывание на VPS

Один сервер, три контейнера: приложение, Postgres и Caddy. Caddy сам получает и продлевает сертификат Let's Encrypt и проксирует как HTTP, так и WebSocket.

Минимум: 1 vCPU, 1 ГБ RAM, 10 ГБ диска. Debian 12 или Ubuntu 22.04+.

## 1. DNS

A-запись домена на IP сервера. Дождитесь распространения — Caddy не выпустит сертификат, пока домен не резолвится:

```bash
dig +short example.com
```

## 2. Подготовка сервера

```bash
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
```

Порты 80 и 443 должны быть открыты — оба нужны Let's Encrypt:

```bash
sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw allow OpenSSH && sudo ufw enable
```

## 3. Код и конфигурация

```bash
git clone https://github.com/d1m4a/cashflow-online.git && cd cashflow-online
```

```bash
cp .env.production.example .env.production
```

Заполните `.env.production`. Пароль базы сгенерируйте, не придумывайте:

```bash
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env.production
```

Обязательны `DOMAIN`, `ACME_EMAIL` и `POSTGRES_PASSWORD`. Compose не стартует без них — это намеренно.

Файл содержит пароль от базы. Ограничьте доступ:

```bash
chmod 600 .env.production
```

## 4. Запуск

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Миграции применяются автоматически при старте приложения. Первый запуск создаёт схему с нуля.

## 5. Проверка

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

Оба контейнера `app` и `postgres` должны быть `healthy`.

```bash
curl https://example.com/api/health
```

Ожидается `{"ok":true,"database":"ok"}`.

Дальше в браузере: регистрация, создание комнаты, ход. В DevTools на вкладке Network соединение с `/ws` должно идти по `wss://`, а не падать в polling.

## 6. Бэкапы

Скрипт уже есть в репозитории. Ежедневный дамп в 04:00:

```bash
crontab -e
```

```cron
0 4 * * * cd /home/USER/cashflow-online && docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres pg_dump -U cashflow -Fc cashflow_online > backups/cashflow-$(date +\%F).dump 2>> backups/backup.log
```

```cron
0 5 * * 0 find /home/USER/cashflow-online/backups -name '*.dump' -mtime +30 -delete
```

Создайте каталог заранее: `mkdir -p backups && chmod 700 backups`.

**Бэкап без проверенного восстановления бэкапом не является.** Раз в месяц:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres psql -U cashflow -c "CREATE DATABASE restore_drill"
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres pg_restore -U cashflow -d restore_drill < backups/cashflow-YYYY-MM-DD.dump
```

Затем сверьте количество строк и удалите `restore_drill`.

Дамп нужно увозить с сервера — бэкап на том же диске не спасает от потери диска. Например `rsync` на другую машину или в объектное хранилище.

## 7. Обновление

```bash
git pull && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Приложение корректно обрабатывает `SIGTERM`: закрывает WebSocket, HTTP и пул Postgres. Состояние комнат лежит в базе, поэтому активные партии переживают перезапуск. Игроки увидят разрыв связи и переподключатся автоматически.

Сделайте дамп **до** обновления, если в нём есть новая миграция.

## 8. Откат

```bash
git checkout <предыдущий-коммит> && docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Миграции вперёд-совместимы (только `ADD COLUMN IF NOT EXISTS` и `CREATE INDEX IF NOT EXISTS`), поэтому откат кода не требует отката схемы. Если миграция всё же несовместима — восстанавливайте из дампа.

## 9. Логи

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f app
```

Формат — построчный JSON, ротация настроена в compose (5 файлов по 10 МБ).

## Что осознанно не сделано

- **Отправка email.** Транспорта нет. Подтверждение email ни на что не влияет, форма сброса пароля скрыта в интерфейсе, а API отвечает `503`, а не делает вид, что письмо ушло. Точка расширения — `devTokenPayload` и константа `EMAIL_ENABLED` в `backend/server.js`.
- **Внешний мониторинг ошибок.** Есть только структурные логи. `ERROR_TRACKING_DSN` и `LOG_DRAIN_URL` из конфигурации удалены, потому что не были подключены ни к чему и создавали ложное впечатление.
- **Горизонтальное масштабирование.** Комнаты и presence живут в памяти одного процесса. Это один инстанс по построению; для нескольких понадобится Redis или внешний realtime-слой.
