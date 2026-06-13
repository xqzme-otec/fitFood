"""End-to-end проверка основных сценариев через TestClient (без сети)."""
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.data.seed import run_seed
from app.main import app

# Готовим БД заранее (вне lifespan), чтобы использовать обычный TestClient.
Base.metadata.create_all(bind=engine)
run_seed()
c = TestClient(app)


def ok(label, resp, expect=(200, 201)):
    status = "OK " if resp.status_code in expect else "FAIL"
    print(f"[{status}] {label}: {resp.status_code}")
    if resp.status_code not in expect:
        print("   ->", resp.text[:300])
    return resp


# 1. Регистрация + логин
email = "demo@fitfood.com"
ok("register", c.post("/auth/register", json={"email": email, "password": "secret123"}))
r = ok("login", c.post("/auth/login", data={"username": email, "password": "secret123"}))
token = r.json()["access_token"]
H = {"Authorization": f"Bearer {token}"}

# 2. Анкета (похудение -> нужны target_weight/target_days)
r = ok("create profile", c.post("/profile", headers=H, json={
    "sex": "male", "height_cm": 180, "weight_kg": 85, "age": 30,
    "activity_level": "medium", "goal": "lose",
    "target_weight_kg": 78, "target_days": 90, "meals_per_day": 3,
}))
r = ok("targets", c.get("/profile/targets", headers=H))
t = r.json()
print(f"   КБЖУ: {t['calories']} ккал | Б{t['protein_g']} Ж{t['fat_g']} У{t['carb_g']} (BMR {t['bmr']}, TDEE {t['tdee']})")

# 3. Приёмы пищи
r = ok("meal slots", c.get("/profile/meals", headers=H))
slots = r.json()
breakfast = slots[0]["id"]
print(f"   приёмов: {len(slots)} | завтрак лимит {slots[0]['calorie_limit']} ккал")

# 4. Ручная корректировка калорий -> пропорциональный пересчёт БЖУ
r = ok("override calories", c.put("/profile/calories", headers=H, json={"calories": 2000}))
print(f"   после ручного лимита 2000: Б{r.json()['protein_g']} Ж{r.json()['fat_g']} У{r.json()['carb_g']}")
# вернём авто-расчёт через изменение веса
ok("update weight", c.put("/profile/weight", headers=H, json={"weight_kg": 84}))

# 5. Поиск продукта и запись съеденного
r = ok("search products", c.get("/products", headers=H, params={"q": "Куриное"}))
prod = r.json()[0]
r = ok("add food entry", c.post("/diary/entries", headers=H, json={
    "meal_slot_id": breakfast, "product_id": prod["id"], "amount": 200,
}))
print(f"   съедено: {r.json()['name']} 200г -> {r.json()['calories']} ккал")

# 6. Запись блюда
r = ok("search dishes", c.get("/dishes", headers=H, params={"q": "Овсянка"}))
dish = r.json()[0]
ok("add dish entry", c.post("/diary/entries", headers=H, json={
    "meal_slot_id": breakfast, "dish_id": dish["id"], "amount": 250,
}))

# 7. Сводка дня
r = ok("day summary", c.get("/diary/summary", headers=H))
s = r.json()
print(f"   день: цель {s['target']['calories']} | съедено {s['consumed']['calories']} | остаток {s['remaining']['calories']}")

# 8. Холодильник: ручное добавление (категория и срок определятся авто)
r = ok("fridge add (auto cat/expiry)", c.post("/fridge/items", headers=H, json={
    "name": "Творог 9%", "quantity": 200, "unit": "g",
}))
print(f"   {r.json()['name']} -> категория {r.json()['category']}, срок {r.json()['expiry_date']} ({r.json()['expiry_status']})")
ok("fridge add chicken", c.post("/fridge/items", headers=H, json={"name": "Куриное филе", "quantity": 500}))
ok("fridge add berries", c.post("/fridge/items", headers=H, json={"name": "Ягоды черника", "quantity": 150}))
ok("fridge add buckwheat", c.post("/fridge/items", headers=H, json={"name": "Гречка", "quantity": 400}))
ok("fridge add onion", c.post("/fridge/items", headers=H, json={"name": "Лук репчатый", "quantity": 200}))

# дедупликация: добавим творог ещё раз
r = c.post("/fridge/items", headers=H, json={"name": "Творог 9%", "quantity": 100})
print(f"   дедуп творога: количество стало {r.json()['quantity']} (ожидаем 300)")

# 9. Сканирование чека (мок OCR + LLM)
r = ok("scan receipt (mock)", c.post("/receipts/scan-text", headers=H, json={
    "text": "Молоко 930мл 89.90\nМыло Dove 100г 79.00\nБрокколи 400г 119.00\nКолбаса докторская 400г 199.00"
}))
receipt = r.json()
print("   распознано:")
for it in receipt["items"]:
    mark = it["category"] if it["is_food"] else "ОТБРОШЕНО"
    print(f"     - {it['parsed_name']} -> {mark}")

# подтверждение чека -> добавление в холодильник
conf = {"items": [{"item_id": it["id"], "accepted": it["is_food"]} for it in receipt["items"]]}
r = ok("confirm receipt", c.post(f"/receipts/{receipt['id']}/confirm", headers=H, json=conf))
print(f"   добавлено в холодильник из чека: {len(r.json())} позиций")

# 10. Холодильник по категориям
r = ok("fridge grouped", c.get("/fridge/grouped", headers=H))
for g in r.json():
    print(f"   [{g['category']}] {', '.join(i['name'] for i in g['items'])}")

# 11. Рекомендации рецептов "на сейчас"
r = ok("recommendations", c.get("/recommendations", headers=H))
print("   рекомендации:")
for rec in r.json()[:3]:
    miss = f" (нет: {', '.join(rec['missing_ingredients'])})" if rec["missing_ingredients"] else ""
    print(f"     - {rec['name']} [{rec['kind']}] score={rec['score']} ~{rec['suggested_grams']}г "
          f"Б{rec['protein']} | {rec['reason']}{miss}")

print("\nГОТОВО: сквозной сценарий отработал.")
