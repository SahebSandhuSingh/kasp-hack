/**
 * Category labels and colors used across all frontend components.
 * Must stay in sync with backend/categoryEngine.js.
 */

export const CATEGORY_LABELS = {
  health_food: 'Health Food',
  apparel: 'Apparel',
  electronics: 'Electronics',
  sports_equipment: 'Sports Equipment',
  beauty_skincare: 'Beauty & Skincare',
  home_living: 'Home & Living',
  food_beverage: 'Food & Beverage',
  baby_kids: 'Baby & Kids',
  general: 'General',
}

export const CATEGORY_COLORS = {
  health_food:       { bg: '#E3F5E1', text: '#2D6A4F' },
  apparel:           { bg: '#EEF2FF', text: '#3730A3' },
  electronics:       { bg: '#FFF7ED', text: '#9A3412' },
  sports_equipment:  { bg: '#F0F9FF', text: '#0369A1' },
  beauty_skincare:   { bg: '#FDF2F8', text: '#86198F' },
  home_living:       { bg: '#FEFCE8', text: '#854D0E' },
  food_beverage:     { bg: '#FFF1F2', text: '#9F1239' },
  baby_kids:         { bg: '#F0FDF4', text: '#166534' },
  general:           { bg: '#F3F4F6', text: '#374151' },
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS)
