import type { Recipe, GroceryItem } from '../types';

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
];

export class RecipeService {
  static getRecipes(): Recipe[] {
    return BUILTIN_RECIPES;
  }

  static generateGroceryItems(recipeIds: string[]): GroceryItem[] {
    const selected = BUILTIN_RECIPES.filter(r => recipeIds.includes(r.id));
    const items: GroceryItem[] = [];

    selected.forEach(r => {
      r.ingredients?.forEach(ing => {
        items.push({
          id: crypto.randomUUID(),
          user_id: 'guest',
          name: ing.name,
          quantity: `${ing.quantity} ${ing.unit}`,
          is_purchased: false,
          target_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    });

    return items;
  }
}
