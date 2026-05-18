# supermatism-opr-ui

UI для backend-проекта `suprematism-opr`.

Приложение позволяет:
- загрузить изображение (drag & drop или файловый выбор);
- отправить файл в `POST /api/analyze-art`;
- получить структурный AI-анализ изображения;
- увидеть список похожих произведений с процентом сходства и ссылками на источники.

## Стек

- React 19
- TypeScript
- Vite
- Чистый CSS (адаптив + визуальный стиль в духе супрематизма)

## Быстрый старт (Frontend)

```bash
npm install
cp .env.example .env
npm run dev
```

По умолчанию frontend ожидает backend по адресу `http://127.0.0.1:8000`.

## Переменные окружения (Frontend)

`.env.example`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ANALYZE_ENDPOINT=/api/analyze-art
VITE_MAX_UPLOAD_MB=10
```

## Ключи и backend

Твои API-ключи нужны на backend-стороне (не в браузере).

Для удобства в этом репозитории есть шаблон [`.env.backend.example`](./.env.backend.example) со всеми нужными полями:

```env
OPENROUTER_API_KEY=
SEARCH_API_KEY=
...
```

Использование:
1. Скопируй содержимое `.env.backend.example` в `suprematism-opr/.env`.
2. Подставь свои ключи `OPENROUTER_API_KEY` и `SEARCH_API_KEY`.
3. Убедись, что в `ALLOW_ORIGINS` указан `http://localhost:5173,http://127.0.0.1:5173`.

## Запуск backend (рядом)

Если backend лежит в соседней папке `../suprematism-opr`:

```bash
cd ../suprematism-opr
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -e '.[dev]'
uvicorn app.main:app --reload
```

Потом вернись в UI и подними dev-сервер:

```bash
cd ../supermatism-opr-ui
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```
