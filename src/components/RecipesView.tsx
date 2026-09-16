import React, { useState } from 'react';
import { Utensils, ShoppingCart, Check, Bell } from 'lucide-react';
import { RecipeService } from '../services/recipeService';
import type { GroceryItem } from '../types';

export const RecipesView: React.FC = () => {
  const recipes = RecipeService.getRecipes();
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([recipes[0].id, recipes[1].id]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(
    RecipeService.generateGroceryItems([recipes[0].id, recipes[1].id])
  );

  const toggleRecipeSelection = (recipeId: string) => {
    const updated = selectedRecipes.includes(recipeId)
      ? selectedRecipes.filter(id => id !== recipeId)
      : [...selectedRecipes, recipeId];
    setSelectedRecipes(updated);
    setGroceryItems(RecipeService.generateGroceryItems(updated));
  };

  const toggleGroceryBought = (itemId: string) => {
    setGroceryItems(prev =>
      prev.map(i => (i.id === itemId ? { ...i, is_purchased: !i.is_purchased } : i))
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <Utensils size={22} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recipe Suggestions & Advance Grocery Planner</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Simple 4+ Healthy Recipes & Day-Before Shopping Alerts</span>
          </div>
        </div>
      </div>

      {/* Day-before Notification Alert */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-warning)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Bell size={24} color="var(--accent-warning)" />
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Day-Before Grocery Shopping Reminder</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Remember to buy ingredients today so you have everything ready for tomorrow's cooking schedule!
          </p>
        </div>
      </div>

      {/* Recipe Suggestions Grid */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Select Meals for Tomorrow</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {recipes.map(recipe => {
            const isSelected = selectedRecipes.includes(recipe.id);
            return (
              <div
                key={recipe.id}
                className="glass-card"
                style={{
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-glass)',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-glass-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{recipe.category}</span>
                  <button
                    onClick={() => toggleRecipeSelection(recipe.id)}
                    className={isSelected ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    {isSelected ? 'Planned ✓' : '+ Add Meal'}
                  </button>
                </div>

                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0.4rem 0' }}>{recipe.title}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>{recipe.instructions}</p>

                <div style={{ background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.75rem' }}>
                  <strong>Ingredients:</strong>
                  <ul style={{ paddingLeft: '1rem', marginTop: '0.2rem' }}>
                    {recipe.ingredients?.map(ing => (
                      <li key={ing.id}>{ing.name} ({ing.quantity} {ing.unit})</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Aggregated Grocery Shopping Checklist */}
      <div className="glass-panel" style={{ padding: '1.2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingCart size={18} color="var(--accent-primary)" />
          <span>Aggregated Ingredient Shopping Checklist ({groceryItems.length} items)</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem' }}>
          {groceryItems.map(item => (
            <div
              key={item.id}
              onClick={() => toggleGroceryBought(item.id)}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                cursor: 'pointer',
                opacity: item.is_purchased ? 0.5 : 1,
              }}
            >
              <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '1px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.is_purchased ? 'var(--accent-primary)' : 'transparent' }}>
                {item.is_purchased && <Check size={12} color="#fff" />}
              </div>
              <span className={item.is_purchased ? 'task-completed-text' : ''} style={{ fontSize: '0.85rem' }}>
                {item.name} ({item.quantity})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

