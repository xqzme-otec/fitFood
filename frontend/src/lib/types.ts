/* Типы данных, зеркалят Pydantic-схемы бэкенда FitFood. */

export type Sex = "male" | "female";
export type ActivityLevel = "minimal" | "low" | "medium" | "high" | "very_high";
export type Goal = "gain" | "maintain" | "lose";
export type Unit = "g" | "ml" | "pcs";
export type ExpiryStatus = "ok" | "soon" | "expired" | "unknown";
export type ReceiptStatus = "pending" | "confirmed" | "cancelled";

export interface User {
  id: number;
  email: string;
  is_profile_complete: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ProfileCreate {
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  age: number;
  activity_level: ActivityLevel;
  goal: Goal;
  target_weight_kg?: number | null;
  target_days?: number | null;
  meals_per_day: number;
}

export interface Profile {
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  age: number;
  activity_level: ActivityLevel;
  goal: Goal;
  target_weight_kg: number | null;
  target_days: number | null;
  meals_per_day: number;
  updated_at: string;
}

export interface NutritionTarget {
  bmr: number;
  tdee: number;
  calories: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  is_manual: boolean;
}

export interface WeightRecord {
  weight_kg: number;
  recorded_at: string;
}

export interface MealSlot {
  id: number;
  name: string;
  order: number;
  calorie_share: number;
  calorie_limit: number;
  protein_limit: number;
  fat_limit: number;
  carb_limit: number;
}

export interface MealShareIn {
  name: string;
  share: number;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Ingredient {
  product_id: number;
  name: string;
  grams: number;
}

export interface Dish {
  id: number;
  name: string;
  emoji: string;
  description: string;
  category: string;
  total_grams: number;
  per_100g: Record<string, number>;
  ingredients: Ingredient[];
}

export interface IngredientIn {
  product_id: number;
  grams: number;
}

export interface DishCreate {
  name: string;
  description?: string;
  category?: string;
  ingredients: IngredientIn[];
}

export interface FoodEntryCreate {
  meal_slot_id: number;
  amount: number;
  product_id?: number | null;
  dish_id?: number | null;
  entry_date?: string | null;
}

export interface FoodEntry {
  id: number;
  meal_slot_id: number;
  entry_date: string;
  name: string;
  amount: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MacroSummary {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MealSlotSummary {
  meal_slot_id: number;
  name: string;
  limit: MacroSummary;
  consumed: MacroSummary;
  remaining: MacroSummary;
  entries: FoodEntry[];
}

export interface DaySummary {
  date: string;
  target: MacroSummary;
  consumed: MacroSummary;
  remaining: MacroSummary;
  meals: MealSlotSummary[];
}

export interface FridgeItemCreate {
  name: string;
  quantity: number;
  unit?: Unit;
  expiry_date?: string | null;
  category?: string | null;
  price?: number | null;
  product_id?: number | null;
}

export interface FridgeItemUpdate {
  quantity?: number;
  expiry_date?: string | null;
  category?: string | null;
}

export interface FridgeItem {
  id: number;
  product_id: number | null;
  name: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  price: number | null;
  expiry_status: ExpiryStatus;
  days_left: number | null;
  kbju_100g: Record<string, number> | null;
  kbju_total: Record<string, number> | null;
}

export interface FridgeCategoryGroup {
  category: string;
  items: FridgeItem[];
}

export interface ReceiptItem {
  id: number;
  raw_name: string;
  parsed_name: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  price: number | null;
  expiry_date: string | null;
  is_food: boolean;
  accepted: boolean;
}

export interface Receipt {
  id: number;
  status: ReceiptStatus;
  raw_text: string;
  items: ReceiptItem[];
}

export interface ReceiptItemConfirm {
  item_id: number;
  accepted: boolean;
  parsed_name?: string | null;
  category?: string | null;
  quantity?: number | null;
  expiry_date?: string | null;
}

export interface IngredientAvailability {
  product_id: number;
  name: string;
  grams_needed: number;
  available: boolean;
  note: string;
}

export interface Recommendation {
  dish_id: number | null;
  name: string;
  kind: string;
  score: number;
  reason: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  suggested_grams: number;
  missing_ingredients: string[];
  ingredients: IngredientAvailability[];
}

// --- Каталог рецептов (food.ru, см. app/routers/recipes.py) ---
export interface RecipeMenu {
  key: string;
  label: string;
  count: number;
}

export interface RecipeCard {
  id: number;
  menu: string;
  name: string;
  photo_url: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  category: string;
  cuisine: string;
  cook_time_min: number | null;
  servings: number | null;
  match_count: number;
  total_ingredients: number;
}

export interface RecipeIngredient {
  text: string;
  available: boolean;
}

export interface RecipeDetail extends RecipeCard {
  source_url: string;
  prep_time_min: number | null;
  method_text: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeList {
  total: number;
  items: RecipeCard[];
}

export interface RecipeQuery {
  menu?: string;
  q?: string;
  cal_min?: number;
  cal_max?: number;
  protein_min?: number;
  protein_max?: number;
  fat_min?: number;
  fat_max?: number;
  carbs_min?: number;
  carbs_max?: number;
  time_max?: number;
  sort?: string;
  limit?: number;
  offset?: number;
}
