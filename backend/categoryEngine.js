/**
 * CATEGORY-AWARE SCORING ENGINE
 *
 * Replaces the generic scoring system with category-specific rubrics.
 * Each product is scored based on what actually matters for its category.
 *
 * Exports: detectCategory, getRubric, scoreProduct, CATEGORY_COLORS, CATEGORY_LABELS
 */

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(text) {
  if (!text) return 0;
  return stripHtml(text).split(/\s+/).filter(Boolean).length;
}

function textLower(val) {
  return stripHtml(val || '').toLowerCase();
}

function containsAny(text, keywords) {
  const t = textLower(text);
  return keywords.filter(k => t.includes(k.toLowerCase()));
}

// ─────────────────────────────────────────
// CATEGORY MAP
// ─────────────────────────────────────────
const CATEGORY_MAP = {
  health_food: {
    product_types: ['protein', 'supplement', 'nutrition', 'health food', 'snack', 'bar', 'powder', 'vitamin'],
    keywords: ['protein', 'whey', 'vegan', 'organic', 'calories', 'macros', 'keto', 'paleo', 'gluten-free', 'fiber', 'superfood'],
  },
  apparel: {
    product_types: ['shirt', 'pants', 'dress', 'jacket', 'hoodie', 'clothing', 'apparel', 'footwear', 'shoes', 'sneakers'],
    keywords: ['size', 'fit', 'fabric', 'cotton', 'polyester', 'machine wash', 'unisex', 'slim fit', 'oversized'],
  },
  electronics: {
    product_types: ['electronics', 'gadget', 'device', 'charger', 'cable', 'headphones', 'speaker', 'phone', 'laptop', 'accessory'],
    keywords: ['battery', 'watts', 'voltage', 'compatible', 'bluetooth', 'wireless', 'usb', 'charging', 'mhz', 'resolution'],
  },
  sports_equipment: {
    product_types: ['snowboard', 'ski', 'skateboard', 'bicycle', 'yoga', 'gym', 'fitness', 'outdoor', 'camping', 'sports'],
    keywords: ['flex', 'terrain', 'ability level', 'size guide', 'weight limit', 'waterproof', 'grip', 'durability', 'performance'],
  },
  beauty_skincare: {
    product_types: ['skincare', 'beauty', 'cosmetic', 'serum', 'moisturizer', 'cleanser', 'sunscreen', 'makeup', 'haircare'],
    keywords: ['spf', 'paraben-free', 'cruelty-free', 'dermatologist', 'skin type', 'fragrance-free', 'hypoallergenic', 'retinol'],
  },
  home_living: {
    product_types: ['furniture', 'decor', 'kitchen', 'bedding', 'lighting', 'storage', 'home', 'garden', 'tools'],
    keywords: ['dimensions', 'material', 'assembly', 'weight capacity', 'care instructions', 'indoor', 'outdoor', 'waterproof'],
  },
  food_beverage: {
    product_types: ['food', 'beverage', 'drink', 'coffee', 'tea', 'snack', 'sauce', 'condiment', 'grocery'],
    keywords: ['ingredients', 'calories', 'serving size', 'allergens', 'expiry', 'refrigerate', 'organic', 'non-gmo'],
  },
  baby_kids: {
    product_types: ['baby', 'kids', 'children', 'toy', 'educational', 'infant', 'toddler', 'nursery'],
    keywords: ['age range', 'safety certified', 'bpa-free', 'washable', 'non-toxic', 'astm', 'choking hazard'],
  },
};

// ─────────────────────────────────────────
// CATEGORY LABELS & COLORS
// ─────────────────────────────────────────
const CATEGORY_LABELS = {
  health_food: 'Health Food',
  apparel: 'Apparel',
  electronics: 'Electronics',
  sports_equipment: 'Sports Equipment',
  beauty_skincare: 'Beauty & Skincare',
  home_living: 'Home & Living',
  food_beverage: 'Food & Beverage',
  baby_kids: 'Baby & Kids',
  general: 'General',
};

const CATEGORY_COLORS = {
  health_food: { bg: '#E3F5E1', text: '#2D6A4F' },
  apparel: { bg: '#EEF2FF', text: '#3730A3' },
  electronics: { bg: '#FFF7ED', text: '#9A3412' },
  sports_equipment: { bg: '#F0F9FF', text: '#0369A1' },
  beauty_skincare: { bg: '#FDF2F8', text: '#86198F' },
  home_living: { bg: '#FEFCE8', text: '#854D0E' },
  food_beverage: { bg: '#FFF1F2', text: '#9F1239' },
  baby_kids: { bg: '#F0FDF4', text: '#166534' },
  general: { bg: '#F3F4F6', text: '#374151' },
};

// ─────────────────────────────────────────
// 1. CATEGORY DETECTION
// ─────────────────────────────────────────
function detectCategory(product) {
  const productType = textLower(product.product_type || '');
  const tags = textLower(product.tags || '');
  const title = textLower(product.title || '');
  const body = textLower(product.body_html || '');

  let bestCategory = 'general';
  let bestConfidence = 'low';
  let bestSignals = [];
  let bestScore = 0;

  for (const [cat, map] of Object.entries(CATEGORY_MAP)) {
    let score = 0;
    const signals = [];

    // Step 1: product_type match (highest priority)
    const ptMatches = map.product_types.filter(pt => productType.includes(pt));
    if (ptMatches.length > 0) {
      score += 10;
      signals.push(...ptMatches.map(m => `product_type:${m}`));
    }

    // Step 1b: product_type terms in title/tags (fallback when Shopify product_type is generic)
    const titlePtMatches = map.product_types.filter(pt => title.includes(pt));
    if (titlePtMatches.length > 0) {
      score += titlePtMatches.length * 4;
      signals.push(...titlePtMatches.map(m => `title_pt:${m}`));
    }
    const tagPtMatches = map.product_types.filter(pt => tags.includes(pt));
    if (tagPtMatches.length > 0) {
      score += tagPtMatches.length * 3;
      signals.push(...tagPtMatches.map(m => `tag_pt:${m}`));
    }

    // Step 2: tags match
    const tagMatches = map.keywords.filter(kw => tags.includes(kw));
    if (tagMatches.length > 0) {
      score += tagMatches.length * 2;
      signals.push(...tagMatches.map(m => `tag:${m}`));
    }

    // Step 3: title match
    const titleMatches = map.keywords.filter(kw => title.includes(kw));
    if (titleMatches.length > 0) {
      score += titleMatches.length;
      signals.push(...titleMatches.map(m => `title:${m}`));
    }

    // Step 4: body match
    const bodyMatches = map.keywords.filter(kw => body.includes(kw));
    if (bodyMatches.length > 0) {
      score += bodyMatches.length;
      signals.push(...bodyMatches.map(m => `body:${m}`));
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
      bestSignals = signals;
    }
  }

  // Confidence scoring
  if (bestScore === 0) {
    bestConfidence = 'low';
    bestCategory = 'general';
  } else if (bestSignals.some(s => s.startsWith('product_type:')) || bestSignals.length >= 3) {
    bestConfidence = 'high';
  } else if (bestSignals.length >= 1) {
    bestConfidence = 'medium';
  } else {
    bestConfidence = 'low';
  }

  return {
    category: bestCategory,
    confidence: bestConfidence,
    matched_signals: bestSignals,
  };
}

// ─────────────────────────────────────────
// 2. CATEGORY RUBRICS
// ─────────────────────────────────────────
const RUBRICS = {
  health_food: [
    {
      key: 'has_ingredients_list', points: 20, label: 'Ingredients List',
      check: (p) => containsAny(p.body_html || '', ['ingredient', 'whey', 'protein isolate', 'oats', 'fiber', 'vitamin', 'mineral']).length > 0,
      missing_msg: "No ingredients listed — AI assistants can't answer 'what's in this?' queries"
    },
    {
      key: 'has_macros', points: 15, label: 'Nutritional Macros',
      check: (p) => /\d+\s*(?:g|mg|kcal|cal|protein|carb|fat)/i.test(stripHtml(p.body_html || '')),
      missing_msg: 'No nutritional info — critical for health-conscious AI shopping queries'
    },
    {
      key: 'has_certifications', points: 15, label: 'Certifications',
      check: (p) => containsAny(p.body_html + ' ' + (p.tags || ''), ['organic', 'vegan', 'keto', 'paleo', 'non-gmo', 'gluten-free']).length > 0,
      missing_msg: 'No certifications mentioned — shoppers filter by these in AI queries'
    },
    {
      key: 'has_allergens', points: 15, label: 'Allergen Info',
      check: (p) => containsAny(p.body_html || '', ['allergen', 'nut-free', 'dairy-free', 'soy-free', 'allergen-free', 'contains milk', 'contains soy', 'contains nuts']).length > 0,
      missing_msg: 'Missing allergen info — a top query for food products'
    },
    {
      key: 'has_flavor_variants', points: 10, label: 'Flavor Profile',
      check: (p) => containsAny(p.body_html + ' ' + (p.title || ''), ['flavor', 'flavour', 'chocolate', 'vanilla', 'strawberry', 'berry', 'mango', 'mint']).length > 0,
      missing_msg: 'No flavor profile described'
    },
    {
      key: 'has_serving_info', points: 10, label: 'Serving Info',
      check: (p) => containsAny(p.body_html || '', ['serving size', 'per serving', 'servings per', 'scoop']).length > 0,
      missing_msg: 'No serving size — common AI shopper question'
    },
    {
      key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
    {
      key: 'has_images', points: 5, label: 'Multiple Images',
      check: (p) => (p.images && p.images.length > 1),
      missing_msg: 'Only one product image'
    },
  ],
  apparel: [
    {
      key: 'has_size_guide', points: 20, label: 'Size Guide',
      check: (p) => containsAny(p.body_html || '', ['size chart', 'size guide', 's/m/l', 'xs', 'xl', 'xxl', 'size:']).length > 0 || /\b(small|medium|large)\b/i.test(stripHtml(p.body_html || '')),
      missing_msg: 'No size guide — #1 reason shoppers abandon apparel'
    },
    {
      key: 'has_fabric_material', points: 20, label: 'Fabric & Material',
      check: (p) => /\d+%\s*\w+/.test(stripHtml(p.body_html || '')) || containsAny(p.body_html || '', ['cotton', 'polyester', 'linen', 'silk', 'wool', 'nylon', 'rayon', 'spandex', 'blend']).length > 0,
      missing_msg: "No material info — AI can't answer 'what's it made of?'"
    },
    {
      key: 'has_fit_description', points: 15, label: 'Fit Description',
      check: (p) => containsAny(p.body_html || '', ['slim fit', 'regular fit', 'oversized', 'relaxed fit', 'tailored', 'loose fit', 'fitted']).length > 0,
      missing_msg: 'No fit type described'
    },
    {
      key: 'has_care_instructions', points: 15, label: 'Care Instructions',
      check: (p) => containsAny(p.body_html || '', ['machine wash', 'hand wash', 'dry clean', 'iron', 'do not bleach', 'tumble dry', 'wash care']).length > 0,
      missing_msg: 'No care instructions'
    },
    {
      key: 'has_gender_age', points: 10, label: 'Gender/Age Targeting',
      check: (p) => containsAny(p.body_html + ' ' + (p.title || '') + ' ' + (p.tags || ''), ['men', 'women', 'unisex', 'kids', "women's", "men's", 'boys', 'girls']).length > 0,
      missing_msg: 'No gender/age targeting'
    },
    {
      key: 'has_color_variants', points: 10, label: 'Color Variants',
      check: (p) => (p.variants && p.variants.length > 1) || containsAny(p.body_html || '', ['color', 'colour', 'black', 'white', 'blue', 'red', 'green', 'navy']).length > 0,
      missing_msg: 'Colors not described in listing'
    },
    {
      key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'exchange', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
  ],
  electronics: [
    {
      key: 'has_specs', points: 25, label: 'Technical Specifications',
      check: (p) => /\d+\s*(?:mhz|ghz|gb|tb|mb|watts?|volts?|mah|inch|cm|mm)/i.test(stripHtml(p.body_html || '')),
      missing_msg: 'No technical specifications — critical for electronics buyers'
    },
    {
      key: 'has_compatibility', points: 20, label: 'Compatibility Info',
      check: (p) => containsAny(p.body_html || '', ['compatible with', 'works with', 'supports', 'fits', 'for iphone', 'for android', 'for mac', 'for windows']).length > 0,
      missing_msg: 'No compatibility info — top electronics query'
    },
    {
      key: 'has_battery_power', points: 15, label: 'Battery/Power Info',
      check: (p) => containsAny(p.body_html || '', ['battery life', 'mah', 'watt', 'charging time', 'battery capacity', 'power supply']).length > 0,
      missing_msg: 'No power/battery info'
    },
    {
      key: 'has_connectivity', points: 15, label: 'Connectivity Details',
      check: (p) => containsAny(p.body_html || '', ['bluetooth', 'wifi', 'wi-fi', 'usb', 'wireless', 'wired', 'nfc', 'hdmi']).length > 0,
      missing_msg: 'No connectivity details'
    },
    {
      key: 'has_warranty', points: 15, label: 'Warranty',
      check: (p) => containsAny(p.body_html || '', ['warranty', 'guarantee', 'year warranty', 'month warranty', 'support']).length > 0,
      missing_msg: 'No warranty mentioned'
    },
    {
      key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
  ],
  sports_equipment: [
    {
      key: 'has_skill_level', points: 20, label: 'Skill/Ability Level',
      check: (p) => containsAny(p.body_html || '', ['beginner', 'intermediate', 'advanced', 'ability level', 'skill level', 'all levels', 'pro']).length > 0,
      missing_msg: 'No ability level — shoppers always filter by this'
    },
    {
      key: 'has_size_specs', points: 20, label: 'Size & Dimensions',
      check: (p) => /\d+\s*(?:cm|mm|inch|inches|lbs?|kg|feet|ft)/i.test(stripHtml(p.body_html || '')) || containsAny(p.body_html || '', ['dimensions', 'size guide', 'length', 'width', 'weight']).length > 0,
      missing_msg: 'No size/dimension specs'
    },
    {
      key: 'has_terrain_use', points: 15, label: 'Terrain/Use Case',
      check: (p) => containsAny(p.body_html || '', ['terrain', 'surface', 'indoor', 'outdoor', 'all-mountain', 'powder', 'trail', 'road', 'gym', 'home use']).length > 0,
      missing_msg: 'No terrain or use-case described'
    },
    {
      key: 'has_material_construction', points: 15, label: 'Material & Construction',
      check: (p) => containsAny(p.body_html || '', ['material', 'construction', 'built with', 'made from', 'carbon', 'aluminum', 'steel', 'foam']).length > 0,
      missing_msg: 'No material or construction details'
    },
    {
      key: 'has_performance_features', points: 15, label: 'Performance Features',
      check: (p) => containsAny(p.body_html || '', ['flex', 'grip', 'speed', 'durability', 'waterproof', 'breathable', 'shock absorb', 'anti-slip']).length > 0,
      missing_msg: 'No performance features described'
    },
    {
      key: 'has_return_policy', points: 15, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
  ],
  beauty_skincare: [
    {
      key: 'has_skin_type', points: 20, label: 'Skin Type',
      check: (p) => containsAny(p.body_html || '', ['oily', 'dry', 'combination', 'sensitive', 'all skin types', 'normal skin', 'acne-prone']).length > 0,
      missing_msg: 'No skin type — top skincare AI query'
    },
    {
      key: 'has_key_ingredients', points: 20, label: 'Key Ingredients',
      check: (p) => containsAny(p.body_html || '', ['retinol', 'hyaluronic', 'vitamin c', 'niacinamide', 'salicylic', 'glycolic', 'peptide', 'ceramide', 'collagen']).length > 0,
      missing_msg: 'No key ingredients listed'
    },
    {
      key: 'has_certifications', points: 15, label: 'Certifications',
      check: (p) => containsAny(p.body_html + ' ' + (p.tags || ''), ['cruelty-free', 'vegan', 'paraben-free', 'dermatologist tested', 'dermatologist approved', 'sulfate-free']).length > 0,
      missing_msg: 'No certifications — heavily filtered in AI searches'
    },
    {
      key: 'has_how_to_use', points: 15, label: 'Usage Instructions',
      check: (p) => containsAny(p.body_html || '', ['how to use', 'apply', 'directions', 'usage', 'step 1', 'apply to']).length > 0,
      missing_msg: 'No usage instructions'
    },
    {
      key: 'has_spf_info', points: 10, label: 'SPF Info',
      check: (p) => /spf\s*\d+/i.test(stripHtml(p.body_html || '')) || containsAny(p.body_html + ' ' + (p.title || ''), ['sunscreen', 'sun protection']).length === 0,
      missing_msg: 'No SPF info for sun protection product'
    },
    {
      key: 'has_size_volume', points: 10, label: 'Size/Volume',
      check: (p) => /\d+\s*(?:ml|oz|fl\s*oz|g|gm)\b/i.test(stripHtml(p.body_html || '') + ' ' + (p.title || '')),
      missing_msg: 'No size or volume listed'
    },
    {
      key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
  ],
  home_living: [
    {
      key: 'has_dimensions', points: 25, label: 'Dimensions',
      check: (p) => /\d+\s*(?:cm|mm|inch|inches|feet|ft|m)\b/i.test(stripHtml(p.body_html || '')),
      missing_msg: 'No dimensions — critical for furniture/home products'
    },
    {
      key: 'has_material', points: 20, label: 'Material Info',
      check: (p) => containsAny(p.body_html || '', ['material', 'wood', 'metal', 'glass', 'fabric', 'ceramic', 'plastic', 'bamboo', 'finish']).length > 0,
      missing_msg: 'No material info'
    },
    {
      key: 'has_assembly_info', points: 15, label: 'Assembly Info',
      check: (p) => containsAny(p.body_html || '', ['assembly', 'installation', 'setup', 'easy to assemble', 'no assembly', 'tools required']).length > 0,
      missing_msg: 'No assembly info'
    },
    {
      key: 'has_care_instructions', points: 15, label: 'Care Instructions',
      check: (p) => containsAny(p.body_html || '', ['care', 'clean', 'maintain', 'wipe', 'dust', 'machine wash']).length > 0,
      missing_msg: 'No care instructions'
    },
    {
      key: 'has_weight_capacity', points: 15, label: 'Weight Capacity',
      check: (p) => containsAny(p.body_html || '', ['weight limit', 'capacity', 'load', 'supports up to', 'max weight']).length > 0,
      missing_msg: 'No weight capacity listed'
    },
    {
      key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
  ],
  food_beverage: [
    {
      key: 'has_ingredients', points: 25, label: 'Ingredients List',
      check: (p) => containsAny(p.body_html || '', ['ingredient', 'contains', 'made with', 'brewed with']).length > 0,
      missing_msg: 'No ingredients — legally and commercially critical'
    },
    {
      key: 'has_allergens', points: 20, label: 'Allergen Info',
      check: (p) => containsAny(p.body_html || '', ['allergen', 'nut-free', 'dairy-free', 'gluten-free', 'soy-free', 'contains milk', 'contains soy']).length > 0,
      missing_msg: 'No allergen info — a top food AI query'
    },
    {
      key: 'has_nutritional_info', points: 20, label: 'Nutritional Info',
      check: (p) => /\d+\s*(?:cal|kcal|g|mg|protein|carb|fat)/i.test(stripHtml(p.body_html || '')),
      missing_msg: 'No nutritional information'
    },
    {
      key: 'has_storage_info', points: 15, label: 'Storage Instructions',
      check: (p) => containsAny(p.body_html || '', ['store', 'refrigerate', 'shelf life', 'keep cool', 'best before', 'expiry', 'room temperature']).length > 0,
      missing_msg: 'No storage instructions'
    },
    {
      key: 'has_certifications', points: 10, label: 'Certifications',
      check: (p) => containsAny(p.body_html + ' ' + (p.tags || ''), ['organic', 'non-gmo', 'fair trade', 'kosher', 'halal', 'usda']).length > 0,
      missing_msg: 'No certifications'
    },
    {
      key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
  ],
  baby_kids: [
    {
      key: 'has_age_range', points: 25, label: 'Age Range',
      check: (p) => /\d+\s*(?:months?|years?|yrs?|\+)/i.test(stripHtml(p.body_html || '') + ' ' + (p.title || '')) || containsAny(p.body_html || '', ['age range', 'ages', 'suitable for']).length > 0,
      missing_msg: 'No age range — parents always filter by this'
    },
    {
      key: 'has_safety_certifications', points: 25, label: 'Safety Certifications',
      check: (p) => containsAny(p.body_html + ' ' + (p.tags || ''), ['astm', 'ce', 'bpa-free', 'bpa free', 'non-toxic', 'safety certified', 'cpsc', 'en71']).length > 0,
      missing_msg: 'No safety certifications — critical for parents'
    },
    {
      key: 'has_material', points: 20, label: 'Material Info',
      check: (p) => containsAny(p.body_html || '', ['material', 'cotton', 'wood', 'plastic', 'silicone', 'fabric', 'soft']).length > 0,
      missing_msg: 'No material info'
    },
    {
      key: 'has_dimensions', points: 15, label: 'Size/Dimensions',
      check: (p) => /\d+\s*(?:cm|mm|inch|inches)/i.test(stripHtml(p.body_html || '')) || containsAny(p.body_html || '', ['size', 'dimensions']).length > 0,
      missing_msg: 'No size info'
    },
    {
      key: 'has_care_instructions', points: 15, label: 'Care Instructions',
      check: (p) => containsAny(p.body_html || '', ['washable', 'machine wash', 'hand wash', 'wipe clean', 'easy to clean']).length > 0,
      missing_msg: 'No care instructions'
    },
  ],
  general: [
    {
      key: 'has_description', points: 25, label: 'Detailed Description',
      check: (p) => wordCount(p.body_html || '') > 50,
      missing_msg: 'Description too short'
    },
    {
      key: 'has_return_policy', points: 20, label: 'Return Policy',
      check: (p) => containsAny(p.body_html || '', ['return', 'refund', 'money back']).length > 0,
      missing_msg: 'No return policy'
    },
    {
      key: 'has_shipping_info', points: 20, label: 'Shipping Info',
      check: (p) => containsAny(p.body_html || '', ['shipping', 'delivery', 'free delivery', 'ships within']).length > 0,
      missing_msg: 'No shipping information'
    },
    {
      key: 'has_tags', points: 15, label: 'Product Tags',
      check: (p) => { const tags = p.tags ? p.tags.split(',').filter(Boolean) : []; return tags.length > 3; },
      missing_msg: 'Fewer than 3 product tags'
    },
    {
      key: 'has_images', points: 10, label: 'Multiple Images',
      check: (p) => (p.images && p.images.length > 1),
      missing_msg: 'Only one product image'
    },
    {
      key: 'has_compare_price', points: 10, label: 'Compare-at Price',
      check: (p) => p.variants?.some(v => v.compare_at_price),
      missing_msg: 'No compare-at price set'
    },
  ],
};

function getRubric(category) {
  return RUBRICS[category] || RUBRICS.general;
}

// ─────────────────────────────────────────
// 3. SCORING FUNCTION
// ─────────────────────────────────────────
function scoreProduct(product) {
  const { category, confidence, matched_signals } = detectCategory(product);
  const rubric = getRubric(category);

  let score = 0;
  const issues = [];
  const criteria_results = {};

  for (const criterion of rubric) {
    let passed = false;
    try {
      passed = !!criterion.check(product);
    } catch (e) {
      passed = false;
    }

    criteria_results[criterion.key] = { passed, points: passed ? criterion.points : 0, max_points: criterion.points };

    if (passed) {
      score += criterion.points;
    } else {
      issues.push({
        field: criterion.key,
        label: criterion.label,
        severity: criterion.points >= 15 ? 'critical' : 'warning',
        message: criterion.missing_msg,
        points_available: criterion.points,
      });
    }
  }

  return {
    score: Math.min(score, 100),
    issues,
    issues_count: issues.length,
    category,
    category_confidence: confidence,
    matched_signals,
    criteria_results,
  };
}

module.exports = {
  detectCategory,
  getRubric,
  scoreProduct,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  RUBRICS,
};
