import type { Recipe, GroceryItem } from '../types';
import { addLocalDays, getLocalDateString } from './dateUtils';
import { createId } from './idUtils';

export const BUILTIN_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    user_id: 'system',
    title: '15-Min Quick One-Pot Veggie Pasta',
    category: 'Quick Healthy',
    instructions: '1. Boil pasta. 2. Sauté garlic, cherry tomatoes, and spinach. 3. Mix pasta with olive oil, herbs & parmesan.',
    created_at: new Date().toISOString(),
    ingredients: [
      { id: 'i1', recipe_id: 'rec-1', user_id: 'system', name: 'Whole Wheat Pasta', quantity: 200, unit: 'grams', created_at: '' },
      { id: 'i2', recipe_id: 'rec-1', user_id: 'system', name: 'Garlic & Olive Oil', quantity: 2, unit: 'tbsp', created_at: '' },
      { id: 'i3', recipe_id: 'rec-1', user_id: 'system', name: 'Fresh Spinach & Tomatoes', quantity: 150, unit: 'grams', created_at: '' },
    ],
  },
  {
    id: 'rec-2',
    user_id: 'system',
    title: 'High-Protein Paneer / Tofu Stir-Fry',
    category: 'High Protein',
    instructions: '1. Cubed paneer/tofu sautéed in coconut oil. 2. Toss with bell peppers, broccoli & soy sauce.',
    created_at: new Date().toISOString(),
    ingredients: [
      { id: 'i4', recipe_id: 'rec-2', user_id: 'system', name: 'Paneer / Tofu', quantity: 250, unit: 'grams', created_at: '' },
      { id: 'i5', recipe_id: 'rec-2', user_id: 'system', name: 'Bell Peppers & Broccoli', quantity: 200, unit: 'grams', created_at: '' },
    ],
  },
  {
    id: 'rec-3',
    user_id: 'system',
    title: 'Nutritious Quinoa / Rice & Lentil Bowl',
    category: 'Healthy Grain',
    instructions: '1. Pressure cook rice & yellow lentils with turmeric. 2. Temper with ghee, cumin seeds & green chilies.',
    created_at: new Date().toISOString(),
    ingredients: [
      { id: 'i6', recipe_id: 'rec-3', user_id: 'system', name: 'Rice / Quinoa', quantity: 1, unit: 'cup', created_at: '' },
      { id: 'i7', recipe_id: 'rec-3', user_id: 'system', name: 'Yellow Lentils (Dal)', quantity: 0.5, unit: 'cup', created_at: '' },
    ],
  },
  {
    id: 'rec-4',
    user_id: 'system',
    title: 'Energizing Egg / Sprouts Avocado Toast',
    category: 'Breakfast / Snack',
    instructions: '1. Toast whole grain bread. 2. Mash avocado with lemon & salt. 3. Top with boiled eggs or sprouted lentils.',
    created_at: new Date().toISOString(),
    ingredients: [
      { id: 'i8', recipe_id: 'rec-4', user_id: 'system', name: 'Whole Grain Bread', quantity: 2, unit: 'slices', created_at: '' },
      { id: 'i9', recipe_id: 'rec-4', user_id: 'system', name: 'Eggs / Moong Sprouts', quantity: 2, unit: 'items', created_at: '' },
    ],
  },
  {
    id: 'rec-5', user_id: 'system', title: 'Chickpea & Cucumber Chaat Bowl', category: 'Plant Protein',
    instructions: 'Toss cooked chickpeas with cucumber, tomato, onion, lemon, cumin and coriander. Serve chilled.', created_at: new Date().toISOString(),
    ingredients: [{ id: 'i10', recipe_id: 'rec-5', user_id: 'system', name: 'Cooked Chickpeas', quantity: 1, unit: 'cup', created_at: '' }, { id: 'i11', recipe_id: 'rec-5', user_id: 'system', name: 'Cucumber, Tomato & Lemon', quantity: 1, unit: 'set', created_at: '' }],
  },
  {
    id: 'rec-6', user_id: 'system', title: 'Overnight Oats with Banana & Seeds', category: 'Breakfast',
    instructions: 'Soak oats in milk or yogurt overnight. Top with banana, chia seeds and cinnamon before eating.', created_at: new Date().toISOString(),
    ingredients: [{ id: 'i12', recipe_id: 'rec-6', user_id: 'system', name: 'Rolled Oats', quantity: 0.5, unit: 'cup', created_at: '' }, { id: 'i13', recipe_id: 'rec-6', user_id: 'system', name: 'Milk / Yogurt, Banana & Chia Seeds', quantity: 1, unit: 'set', created_at: '' }],
  },
  {
    id: 'rec-7', user_id: 'system', title: 'Lemon Garlic Chicken / Soy Chunk Rice', category: 'High Protein',
    instructions: 'Pan-sear chicken or soy chunks with garlic and lemon. Serve with rice and a quick side salad.', created_at: new Date().toISOString(),
    ingredients: [{ id: 'i14', recipe_id: 'rec-7', user_id: 'system', name: 'Chicken / Soy Chunks', quantity: 200, unit: 'grams', created_at: '' }, { id: 'i15', recipe_id: 'rec-7', user_id: 'system', name: 'Rice, Lemon & Garlic', quantity: 1, unit: 'set', created_at: '' }],
  },
  {
    id: 'rec-8', user_id: 'system', title: 'Vegetable Moong Dal Khichdi', category: 'Comforting Healthy',
    instructions: 'Pressure cook rice, moong dal, mixed vegetables, turmeric and cumin. Finish with lemon or yogurt.', created_at: new Date().toISOString(),
    ingredients: [{ id: 'i16', recipe_id: 'rec-8', user_id: 'system', name: 'Moong Dal & Rice', quantity: 1, unit: 'cup', created_at: '' }, { id: 'i17', recipe_id: 'rec-8', user_id: 'system', name: 'Mixed Vegetables', quantity: 250, unit: 'grams', created_at: '' }],
  },
];

export class RecipeService {
  static getRecipes(): Recipe[] {
    return BUILTIN_RECIPES;
  }

  /** A deterministic daily rotation, with an optional manual refresh round. */
  static getDailySuggestions(date = new Date().toISOString().slice(0, 10), round = 0): Recipe[] {
    const dayNumber = Math.floor(new Date(`${date}T12:00:00`).getTime() / 86400000);
    const start = Math.abs(dayNumber + round * 3) % BUILTIN_RECIPES.length;
    return Array.from({ length: Math.min(3, BUILTIN_RECIPES.length) }, (_, index) => BUILTIN_RECIPES[(start + index) % BUILTIN_RECIPES.length]);
  }

  static generateGroceryItems(recipeIds: string[]): GroceryItem[] {
    const selected = BUILTIN_RECIPES.filter(r => recipeIds.includes(r.id));
    const items: GroceryItem[] = [];

    selected.forEach(r => {
      r.ingredients?.forEach(ing => {
        items.push({
          id: createId(),
          user_id: 'guest',
          name: ing.name,
          quantity: `${ing.quantity} ${ing.unit}`,
          is_purchased: false,
          target_date: addLocalDays(getLocalDateString(), 1),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    });

    return items;
  }
}
