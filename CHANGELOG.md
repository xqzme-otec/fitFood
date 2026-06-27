# Changelog

## [Unreleased]

### Added
- **Генератор рациона на главной**: кнопка «Сгенерировать рацион» открывает
  Tinder-подобный свайп блюд по приёмам пищи. Подбор учитывает дневной остаток
  КБЖУ (после углеводного завтрака на обед предлагается бельково-жировое блюдо) и
  наличие продуктов в холодильнике, помечая нехватающие ингредиенты. Лайк
  записывает блюдо в дневник как съеденное, дизлайк показывает следующий вариант.
- Новый эндпоинт `GET /rations/next` — следующий кандидат блюда для приёма с
  учётом дневного дефицита и списка отвергнутых блюд.
- Интеграция с LLM через **OpenRouter** (гибридный режим): модель пишет
  объяснение «почему это блюдо» и придумывает блюдо из холодильника, когда каталог
  исчерпан. Работает и без ключа — детерминированный фолбэк. Настройки
  `LLM_PROVIDER=openrouter`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` в `.env`.

## [1.0.0] - 2026-06-20
### Added
- User Registration and Authentication logic.
- Smart Recipe Recommendations based on fridge inventory.
- Daily Macronutrient Tracking dashboard.
- Automatic inventory deduction when meals are logged.
- Full test suite with 62 isolated SQLite tests.

### Technical
- Configured GitHub Actions CI/CD workflow.
- Added extended Pull Request and Issue templates.
