# FitFood — Smart Fridge Tracker

**FitFood** is a web application for smart pantry management, personalised macronutrient tracking, and AI-powered meal planning. Users manage their fridge inventory, scan grocery receipts, log meals, and receive recipe recommendations based on what is actually available at home.

| | |
| --- | --- |
| **Live product** | <http://10.93.26.202:8000/> |
| **Hosted documentation** | <https://xqzme-otec.github.io/fitFood/> |
| **Customer handover** | [docs/customer-handover.md](docs/customer-handover.md) |
| **Contributor guide** | [CONTRIBUTING.md](CONTRIBUTING.md) |
| **Agent guide** | [AGENTS.md](AGENTS.md) |

---

Бэкенд на **FastAPI** для умного холодильника: аутентификация, расчёт КБЖУ,
дневник питания, каталог продуктов/блюд, холодильник с распознаванием чеков
(OCR + LLM, мок) и рекомендации рецептов.

Проект запускается **без внешних ключей**: LLM и OCR работают в детерминированном
мок-режиме, БД по умолчанию — SQLite. ML-классификатор категорий использует
готовую модель `notebooks/models/xgb_model.pkl`.

## Запуск в Docker (рекомендуется для деплоя)

Поднимает **API + PostgreSQL** одной командой. Нужен только установленный
Docker (Docker Desktop / Docker Engine с плагином Compose).

```bash
# 1. (опционально, но желательно для прода) задать свой секрет и ключи
export SECRET_KEY="$(openssl rand -hex 32)"
# export LLM_PROVIDER=openai OPENAI_API_KEY=sk-...   # иначе работает mock

# 2. собрать образ и запустить
docker compose up --build -d

# 3. проверить, что поднялось
curl http://127.0.0.1:8000/health
```

- **Веб-интерфейс (SPA):** <http://127.0.0.1:8000/>
- **Swagger UI (API):** <http://127.0.0.1:8000/docs>

Управление:
```bash
docker compose logs -f app     # логи приложения
docker compose down            # остановить (данные БД сохраняются в томе pgdata)
docker compose down -v         # остановить и удалить данные БД
docker compose up --build -d   # пересобрать после изменений в коде
```

Что происходит внутри Compose:
- сервис `db` — PostgreSQL 16 с healthcheck и постоянным томом `pgdata`;
- сервис `app` — образ из `Dockerfile`, стартует только после готовности БД,
  подключается к ней через `DATABASE_URL`;
- при первом старте автоматически создаются таблицы и наполняется каталог
  (30+ базовых продуктов, 8 блюд и ~350 позиций из CSV).

Конфигурация задаётся переменными окружения (см. `docker-compose.yml`):
`SECRET_KEY`, `POSTGRES_PASSWORD`, `LLM_PROVIDER`, `OPENAI_API_KEY`,
`ACCESS_TOKEN_EXPIRE_MINUTES`, `SEED_PRODUCTS_LIMIT` — все имеют дефолты.

> Один контейнер на SQLite (без PostgreSQL):
> ```bash
> docker build -t fitfood .
> docker run -p 8000:8000 -v fitfood_db:/app fitfood
> ```

## Локальный запуск без Docker

```bash
python -m venv venv
source venv/bin/activate           # Windows: venv\Scripts\activate
pip install -r requirements.txt

# (опционально) cp .env.example .env  и поправьте настройки
uvicorn app.main:app --reload
```

По умолчанию БД — **SQLite** (файл `fitfood.db` рядом с проектом), внешние ключи
не нужны. При первом запуске автоматически:
- создаются таблицы (`Base.metadata.create_all`);
- наполняется каталог: 30+ базовых продуктов, 8 блюд и ~350 позиций из
  `data/fitfood_products_full_augmented.csv`.

Сквозная проверка всех сценариев:
```bash
python smoke_test.py
```

## Тесты и контроль качества

Тесты изолированы (временная SQLite-БД, `LLM_PROVIDER=mock`), PostgreSQL и сеть не нужны.

```bash
pip install -r requirements.txt -r requirements-dev.txt

pytest                                    # все тесты (unit + integration + QRT)
pytest -m qrt                             # только Quality Requirement Tests
pytest --cov=app --cov-report=term-missing    # с покрытием
python scripts/check_critical_coverage.py     # порог ≥30% по каждому критическому модулю

bandit -r app -ll                         # доп. QA: статический анализ безопасности
pip-audit -r requirements.txt             # доп. QA: аудит зависимостей на CVE
```

CI (GitHub Actions): `tests` (pytest + покрытие + порог по модулям), `qa`
(Bandit + pip-audit), `lychee` (проверка ссылок). Подробности —
[`docs/testing.md`](docs/testing.md) и
[`docs/quality-requirement-tests.md`](docs/quality-requirement-tests.md).



## Документация

- **Hosted documentation site:** <https://xqzme-otec.github.io/fitFood/> — browsable
  maintained docs (architecture, ADRs, quality, process), published from
  [`docs/`](docs/) by [`.github/workflows/docs.yml`](.github/workflows/docs.yml).
- [Architecture (views + ADRs)](docs/architecture/README.md)
- [Development Process & Configuration Management](docs/development-process.md)

## Фронтенд

SPA без сборки (vanilla JS, ES-модули), раздаётся самим FastAPI из `frontend/`.
Открывается на `/`. Дизайн-система сгенерирована скиллом
[ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill):

- **Палитра** (food/fitness): primary `#DC2626`, secondary `#F87171`, gold CTA `#CA8A04`,
  фон `#FEF2F2`, текст `#450A0A`.
- **Шрифты:** Barlow Condensed (заголовки) + Barlow (текст).
- **UX-чеклист скилла:** SVG-иконки (без эмодзи), `cursor-pointer`, переходы 150–300ms,
  видимый focus, контраст ≥4.5:1, `prefers-reduced-motion`, адаптив 375/768/1024/1440,
  `aria-label` на иконочных кнопках.

Экраны: вход/регистрация → анкета → **Сегодня** (кольцо калорий, бары БЖУ, приёмы пищи,
добавление еды поиском), **Холодильник** (по категориям, бейджи срока годности),
**Сканер чека** (текст/фото → подтверждение → холодильник), **Рецепты**
(рекомендации по остатку КБЖУ и холодильнику), **Профиль** (вес, ручной лимит,
план приёмов, история веса).

Структура:
```
frontend/
  index.html          # оболочка SPA, подключение шрифтов и модулей
  css/styles.css      # дизайн-токены и компоненты
  js/icons.js         # inline-SVG иконки
  js/api.js           # клиент к API (JWT в localStorage)
  js/ui.js            # тосты, модалки, компоненты (бары, кольцо, бейджи)
  js/app.js           # роутер (hash) + все экраны
```

## Стек

- **FastAPI** + Pydantic v2, **SQLAlchemy 2.0**, JWT (python-jose) + bcrypt.
- **Фронтенд:** vanilla JS SPA (без npm-сборки), раздаётся через `StaticFiles`.
- БД: **SQLite** по умолчанию, **PostgreSQL** через `DATABASE_URL` (см. `.env.example`).
- ML: **XGBoost** + TF-IDF (классификация категории продукта по названию).
- LLM/OCR: мок-реализации (`app/services/llm.py`, `app/services/ocr.py`).

## Структура проекта

```
app/
  config.py            # настройки (pydantic-settings, .env)
  database.py          # engine, Session, Base
  main.py              # сборка FastAPI + lifespan (создание таблиц, сидинг)
  core/
    security.py        # хеширование паролей, JWT
    deps.py            # get_current_user, require_profile
  models/              # SQLAlchemy-модели (user, product, meal, fridge, enums)
  schemas/             # Pydantic-схемы запросов/ответов
  services/
    nutrition.py       # формулы КБЖУ (Миффлин-Сан Жеор)
    targets.py         # пересчёт норм и лимитов приёмов в БД
    classifier.py      # обёртка над xgb_model.pkl
    llm.py             # мок LLM: срок годности, разбор чека
    ocr.py             # мок OCR
    fridge.py          # статусы срока, дедупликация
    receipt.py         # конвейер обработки чека
    recommendation.py  # подбор рецептов
  routers/             # эндпоинты по доменам
  data/seed.py         # импорт продуктов/блюд
data/                  # CSV-каталоги
notebooks/models/      # обученные ML-артефакты (xgb, tfidf, label encoder)
frontend/              # SPA (vanilla JS), раздаётся самим FastAPI
Dockerfile             # образ бэкенда (python:3.12-slim + libgomp1 для xgboost)
docker-compose.yml     # app + PostgreSQL (деплой одной командой)
.dockerignore          # что не попадает в образ
```

## Основные эндпоинты

| Метод | Путь | Назначение |
|------|------|-----------|
| POST | `/auth/register` | регистрация |
| POST | `/auth/login` | логин, выдаёт JWT (`username`=email) |
| GET  | `/auth/me` | текущий пользователь |
| POST | `/profile` | заполнение анкеты → расчёт КБЖУ и приёмов |
| GET  | `/profile/targets` | текущая норма КБЖУ |
| PUT  | `/profile/weight` | изменить вес → пересчёт нормы + запись в историю |
| GET  | `/profile/weight/history` | история веса |
| PUT  | `/profile/calories` | ручной лимит калорий → пропорциональный пересчёт БЖУ |
| PUT  | `/profile/macros` | ручная установка БЖУ в граммах (калории считаются из них) |
| GET/PUT | `/profile/meals` | приёмы пищи и распределение калорий |
| GET  | `/products`, `/dishes` | поиск каталога (регистронезависимо, в т.ч. кириллица) |
| POST | `/dishes` | создать своё блюдо/рецепт (UI «Создать рецепт») |
| POST | `/diary/entries` | записать съеденный продукт/блюдо в приём |
| GET  | `/diary/summary?day=` | сводка КБЖУ за день и по приёмам |
| POST | `/fridge/items` | добавить продукт (авто-категория ML + авто-срок LLM) |
| GET  | `/fridge/grouped` | холодильник по категориям |
| PATCH/DELETE | `/fridge/items/{id}` | изменить количество / удалить |
| POST | `/receipts/scan` | загрузить фото чека (OCR мок) |
| POST | `/receipts/scan-text` | вставить текст чека |
| POST | `/receipts/{id}/confirm` | подтвердить позиции → добавить в холодильник |
| GET  | `/recommendations` | рекомендации рецептов на приём / «на сейчас» |

## Ключевые решения

**Расчёт КБЖУ.** BMR по Миффлину-Сан Жеору → TDEE (×коэффициент активности) →
поправка на цель. Для «набора»/«похудения» с заданными целевым весом и сроком
дефицит/профицит = `Δкг × 7700 / дней`, ограниченный безопасными 20–25 %.
Белок задаётся в г/кг по цели, жиры — 1 г/кг, углеводы — остаток калорий.

**Ручное изменение калорий.** В `NutritionTarget` хранятся доли калорий по
макронутриентам (`*_ratio`). При новом лимите БЖУ пересчитываются как
`калории × ratio / (4|9|4)`, сохраняя соотношение из расчёта по цели.

**Снимок КБЖУ.** Записи дневника (`FoodEntry`) хранят КБЖУ съеденной порции
снимком — правка каталога не искажает историю.

**Чеки.** `OCR → LLM-разбор → фильтр непродуктов → ML-категория → позиции на
подтверждение`. Пользователь видит, что отброшено (мыло) и куда отнесено
(брокколи → Овощи), правит и подтверждает — только тогда продукты попадают в
холодильник.

**Дубликаты холодильника.** Объединяются по нормализованному имени + единице;
количество суммируется, берётся ближайший срок годности. Сравнение регистра
делается в Python (SQLite `lower()` не понимает кириллицу).

**Рекомендации.** Для приёма берётся остаток лимита, по холодильнику строится
индекс токенов. Блюдо проходит, если все ключевые ингредиенты (≥50 г) в наличии;
неключевые могут отсутствовать (помечаются). Оценка = покрытие + плотность
дефицитного макронутриента − штраф за переедание. Если блюд нет — простые
комбинации продуктов (творог + ягоды и т.п.).

## Подключение реальных LLM/OCR

В `.env`: `LLM_PROVIDER=openai` и `OPENAI_API_KEY=...`. Реализуйте вызовы в
`app/services/llm.py` (`_openai_shelf_life`, `_openai_parse_receipt`) и реальный
OCR в `app/services/ocr.py:image_to_text` (например, `pytesseract`).

## PostgreSQL вне Docker

В Docker PostgreSQL поднимается автоматически (`docker compose up`). Если нужен
свой инстанс при локальном запуске:

1. `psycopg2-binary` уже есть в `requirements.txt`.
2. В `.env`: `DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/fitfood`
3. Таблицы создаются автоматически при старте (`Base.metadata.create_all`).
   Для версионируемых схем подключите Alembic: `alembic init alembic`, в `env.py`
   импортируйте `app.models` и `Base.metadata`, затем
   `alembic revision --autogenerate && alembic upgrade head`.
