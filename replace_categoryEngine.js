const fs = require('fs');
const file = 'backend/categoryEngine.js';
let content = fs.readFileSync(file, 'utf8');

// Insert normalizeProduct and scoreToAICitationProbability before detectCategory
const helpersEnd = content.indexOf('// ─────────────────────────────────────────\n// CATEGORY MAP');
const toInsert = `function normalizeProduct(product) {
  // Detect which format we have and normalize to a unified shape
  const bodyHtml = product.body_html || product.description || '';
  const tagsRaw = product.tags;
  
  // tags can be: comma-separated string (Shopify raw) OR array (mapped)
  let tagsString = '';
  let tagsArray = [];
  if (Array.isArray(tagsRaw)) {
    tagsArray = tagsRaw;
    tagsString = tagsRaw.join(', ');
  } else if (typeof tagsRaw === 'string') {
    tagsString = tagsRaw;
    tagsArray = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);
  }

  // images: raw Shopify has product.images array
  // mapped format has no images field — check if present
  const images = product.images || [];

  // variants: raw Shopify has product.variants
  // mapped format has no variants — use price directly
  const variants = product.variants || [];
  
  // Reconstruct a unified body text for keyword checks
  // Combine description + return_policy + shipping + ingredients
  // so rubric checks find these fields even if they're separate
  const combinedText = [
    bodyHtml,
    product.return_policy || '',
    product.shipping || '',
    product.ingredients || '',
  ].join(' ');

  return {
    ...product,
    // Normalized fields — use these in ALL rubric checks
    _body: combinedText,          // use for ALL keyword checks
    _bodyRaw: bodyHtml,           // use for word count checks
    _tagsString: tagsString,      // use for tag keyword checks
    _tagsArray: tagsArray,        // use for tag count checks
    _images: images,              // use for image count checks
    _variants: variants,          // use for variant checks
    _hasReturnPolicy: !!(
      product.return_policy ||
      /return|refund|money.?back/i.test(bodyHtml)
    ),
    _hasShipping: !!(
      product.shipping ||
      /shipping|delivery|dispatch/i.test(bodyHtml)
    ),
    _hasIngredients: !!(
      product.ingredients ||
      /ingredient/i.test(bodyHtml)
    ),
  };
}

function scoreToAICitationProbability(score) {
  // Map 0–100 score to citation probability %
  // Uses a non-linear curve — small improvements at the bottom
  // have less impact; improvements from 60–80 matter most
  
  let probability;
  
  if (score <= 10) {
    probability = Math.round(score * 0.5);           // 0–5%
  } else if (score <= 30) {
    probability = Math.round(5 + (score - 10) * 1); // 5–25%
  } else if (score <= 50) {
    probability = Math.round(25 + (score - 30) * 1.5); // 25–55%
  } else if (score <= 70) {
    probability = Math.round(55 + (score - 50) * 1.5); // 55–85%
  } else if (score <= 85) {
    probability = Math.round(85 + (score - 70) * 0.8); // 85–97%
  } else {
    probability = Math.round(97 + (score - 85) * 0.2); // 97–99%
  }
  
  probability = Math.min(99, Math.max(1, probability));
  
  // Label and tier
  let label, tier, color;
  
  if (probability >= 80) {
    label = 'Very likely to be cited';
    tier = 'high';
    color = '#008060';
  } else if (probability >= 55) {
    label = 'Likely to be cited';
    tier = 'medium-high';
    color = '#4CAF50';
  } else if (probability >= 30) {
    label = 'Unlikely to be cited';
    tier = 'medium-low';
    color = '#FFC453';
  } else if (probability >= 10) {
    label = 'Rarely cited by AI';
    tier = 'low';
    color = '#FF8C00';
  } else {
    label = 'Almost never cited';
    tier = 'critical';
    color = '#D72C0D';
  }
  
  return {
    probability,           // integer, e.g. 73
    display: \`\${probability}%\`,  // string, e.g. "73%"
    label,                 // human label
    tier,                  // machine tier
    color,                 // hex color for UI
    raw_score: score       // original 0–100 score preserved
  };
}

`;
content = content.slice(0, helpersEnd) + toInsert + content.slice(helpersEnd);

// Replace detectCategory top lines
content = content.replace(
  /function detectCategory\(product\) \{\n  const productType = textLower\(product\.product_type \|\| ''\);\n  const tags = textLower\(product\.tags \|\| ''\);\n  const title = textLower\(product\.title \|\| ''\);\n  const body = textLower\(product\.body_html \|\| ''\);/,
  \`function detectCategory(product) {
  const norm = product._body !== undefined ? product : normalizeProduct(product);
  const productType = textLower(norm.product_type || '');
  const tags = textLower(norm._tagsString || '');
  const title = textLower(norm.title || norm.name || '');
  const body = textLower(norm._body || '');\`
);

// Replace RUBRICS
content = content.replace(/const RUBRICS = \{[\s\S]*?\n\};\n\nfunction getRubric/, \`const RUBRICS = {
  health_food: [
    { key: 'has_ingredients_list', points: 20, label: 'Ingredients List',
      check: (p) => p._hasIngredients || containsAny(p._body || '', ['ingredient', 'whey', 'protein isolate', 'oats', 'fiber', 'vitamin', 'mineral']).length > 0,
      missing_msg: "No ingredients listed — AI assistants can't answer 'what's in this?' queries" },
    { key: 'has_macros', points: 15, label: 'Nutritional Macros',
      check: (p) => /\\d+\\s*(?:g|mg|kcal|cal|protein|carb|fat)/i.test(p._body || ''),
      missing_msg: 'No nutritional info — critical for health-conscious AI shopping queries' },
    { key: 'has_certifications', points: 15, label: 'Certifications',
      check: (p) => containsAny((p._body || '') + ' ' + (p._tagsString || ''), ['organic', 'vegan', 'keto', 'paleo', 'non-gmo', 'gluten-free']).length > 0,
      missing_msg: 'No certifications mentioned — shoppers filter by these in AI queries' },
    { key: 'has_allergens', points: 15, label: 'Allergen Info',
      check: (p) => containsAny(p._body || '', ['allergen', 'nut-free', 'dairy-free', 'soy-free', 'allergen-free', 'contains milk', 'contains soy', 'contains nuts']).length > 0,
      missing_msg: 'Missing allergen info — a top query for food products' },
    { key: 'has_flavor_variants', points: 10, label: 'Flavor Profile',
      check: (p) => containsAny((p._body || '') + ' ' + (p.title || p.name || ''), ['flavor', 'flavour', 'chocolate', 'vanilla', 'strawberry', 'berry', 'mango', 'mint']).length > 0,
      missing_msg: 'No flavor profile described' },
    { key: 'has_serving_info', points: 10, label: 'Serving Info',
      check: (p) => containsAny(p._body || '', ['serving size', 'per serving', 'servings per', 'scoop']).length > 0,
      missing_msg: 'No serving size — common AI shopper question' },
    { key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
    { key: 'has_images', points: 5, label: 'Multiple Images',
      check: (p) => (p._images.length > 1),
      missing_msg: 'Only one product image' },
  ],
  apparel: [
    { key: 'has_size_guide', points: 20, label: 'Size Guide',
      check: (p) => containsAny(p._body || '', ['size chart', 'size guide', 's/m/l', 'xs', 'xl', 'xxl', 'size:']).length > 0 || /\\b(small|medium|large)\\b/i.test(p._body || ''),
      missing_msg: 'No size guide — #1 reason shoppers abandon apparel' },
    { key: 'has_fabric_material', points: 20, label: 'Fabric & Material',
      check: (p) => /\\d+%\\s*\\w+/.test(p._body || '') || containsAny(p._body || '', ['cotton', 'polyester', 'linen', 'silk', 'wool', 'nylon', 'rayon', 'spandex', 'blend']).length > 0,
      missing_msg: "No material info — AI can't answer 'what's it made of?'" },
    { key: 'has_fit_description', points: 15, label: 'Fit Description',
      check: (p) => containsAny(p._body || '', ['slim fit', 'regular fit', 'oversized', 'relaxed fit', 'tailored', 'loose fit', 'fitted']).length > 0,
      missing_msg: 'No fit type described' },
    { key: 'has_care_instructions', points: 15, label: 'Care Instructions',
      check: (p) => containsAny(p._body || '', ['machine wash', 'hand wash', 'dry clean', 'iron', 'do not bleach', 'tumble dry', 'wash care']).length > 0,
      missing_msg: 'No care instructions' },
    { key: 'has_gender_age', points: 10, label: 'Gender/Age Targeting',
      check: (p) => containsAny((p._body || '') + ' ' + (p.title || p.name || '') + ' ' + (p._tagsString || ''), ['men', 'women', 'unisex', 'kids', "women's", "men's", 'boys', 'girls']).length > 0,
      missing_msg: 'No gender/age targeting' },
    { key: 'has_color_variants', points: 10, label: 'Color Variants',
      check: (p) => p._variants.length > 1 || containsAny(p._body || '', ['color', 'colour', 'black', 'white', 'blue', 'red', 'green', 'navy']).length > 0,
      missing_msg: 'Colors not described in listing' },
    { key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
  ],
  electronics: [
    { key: 'has_specs', points: 25, label: 'Technical Specifications',
      check: (p) => /\\d+\\s*(?:mhz|ghz|gb|tb|mb|watts?|volts?|mah|inch|cm|mm)/i.test(p._body || ''),
      missing_msg: 'No technical specifications — critical for electronics buyers' },
    { key: 'has_compatibility', points: 20, label: 'Compatibility Info',
      check: (p) => containsAny(p._body || '', ['compatible with', 'works with', 'supports', 'fits', 'for iphone', 'for android', 'for mac', 'for windows']).length > 0,
      missing_msg: 'No compatibility info — top electronics query' },
    { key: 'has_battery_power', points: 15, label: 'Battery/Power Info',
      check: (p) => containsAny(p._body || '', ['battery life', 'mah', 'watt', 'charging time', 'battery capacity', 'power supply']).length > 0,
      missing_msg: 'No power/battery info' },
    { key: 'has_connectivity', points: 15, label: 'Connectivity Details',
      check: (p) => containsAny(p._body || '', ['bluetooth', 'wifi', 'wi-fi', 'usb', 'wireless', 'wired', 'nfc', 'hdmi']).length > 0,
      missing_msg: 'No connectivity details' },
    { key: 'has_warranty', points: 15, label: 'Warranty',
      check: (p) => containsAny(p._body || '', ['warranty', 'guarantee', 'year warranty', 'month warranty', 'support']).length > 0,
      missing_msg: 'No warranty mentioned' },
    { key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
  ],
  sports_equipment: [
    { key: 'has_skill_level', points: 20, label: 'Skill/Ability Level',
      check: (p) => containsAny(p._body || '', ['beginner', 'intermediate', 'advanced', 'ability level', 'skill level', 'all levels', 'pro']).length > 0,
      missing_msg: 'No ability level — shoppers always filter by this' },
    { key: 'has_size_specs', points: 20, label: 'Size & Dimensions',
      check: (p) => /\\d+\\s*(?:cm|mm|inch|inches|lbs?|kg|feet|ft)/i.test(p._body || '') || containsAny(p._body || '', ['dimensions', 'size guide', 'length', 'width', 'weight']).length > 0,
      missing_msg: 'No size/dimension specs' },
    { key: 'has_terrain_use', points: 15, label: 'Terrain/Use Case',
      check: (p) => containsAny(p._body || '', ['terrain', 'surface', 'indoor', 'outdoor', 'all-mountain', 'powder', 'trail', 'road', 'gym', 'home use']).length > 0,
      missing_msg: 'No terrain or use-case described' },
    { key: 'has_material_construction', points: 15, label: 'Material & Construction',
      check: (p) => containsAny(p._body || '', ['material', 'construction', 'built with', 'made from', 'carbon', 'aluminum', 'steel', 'foam']).length > 0,
      missing_msg: 'No material or construction details' },
    { key: 'has_performance_features', points: 15, label: 'Performance Features',
      check: (p) => containsAny(p._body || '', ['flex', 'grip', 'speed', 'durability', 'waterproof', 'breathable', 'shock absorb', 'anti-slip']).length > 0,
      missing_msg: 'No performance features described' },
    { key: 'has_return_policy', points: 15, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
  ],
  beauty_skincare: [
    { key: 'has_skin_type', points: 20, label: 'Skin Type',
      check: (p) => containsAny(p._body || '', ['oily', 'dry', 'combination', 'sensitive', 'all skin types', 'normal skin', 'acne-prone']).length > 0,
      missing_msg: 'No skin type — top skincare AI query' },
    { key: 'has_key_ingredients', points: 20, label: 'Key Ingredients',
      check: (p) => containsAny(p._body || '', ['retinol', 'hyaluronic', 'vitamin c', 'niacinamide', 'salicylic', 'glycolic', 'peptide', 'ceramide', 'collagen']).length > 0,
      missing_msg: 'No key ingredients listed' },
    { key: 'has_certifications', points: 15, label: 'Certifications',
      check: (p) => containsAny((p._body || '') + ' ' + (p._tagsString || ''), ['cruelty-free', 'vegan', 'paraben-free', 'dermatologist tested', 'dermatologist approved', 'sulfate-free']).length > 0,
      missing_msg: 'No certifications — heavily filtered in AI searches' },
    { key: 'has_how_to_use', points: 15, label: 'Usage Instructions',
      check: (p) => containsAny(p._body || '', ['how to use', 'apply', 'directions', 'usage', 'step 1', 'apply to']).length > 0,
      missing_msg: 'No usage instructions' },
    { key: 'has_spf_info', points: 10, label: 'SPF Info',
      check: (p) => /spf\\s*\\d+/i.test(p._body || '') || containsAny((p._body || '') + ' ' + (p.title || p.name || ''), ['sunscreen', 'sun protection']).length === 0,
      missing_msg: 'No SPF info for sun protection product' },
    { key: 'has_size_volume', points: 10, label: 'Size/Volume',
      check: (p) => /\\d+\\s*(?:ml|oz|fl\\s*oz|g|gm)\\b/i.test((p._body || '') + ' ' + (p.title || p.name || '')),
      missing_msg: 'No size or volume listed' },
    { key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
  ],
  home_living: [
    { key: 'has_dimensions', points: 25, label: 'Dimensions',
      check: (p) => /\\d+\\s*(?:cm|mm|inch|inches|feet|ft|m)\\b/i.test(p._body || ''),
      missing_msg: 'No dimensions — critical for furniture/home products' },
    { key: 'has_material', points: 20, label: 'Material Info',
      check: (p) => containsAny(p._body || '', ['material', 'wood', 'metal', 'glass', 'fabric', 'ceramic', 'plastic', 'bamboo', 'finish']).length > 0,
      missing_msg: 'No material info' },
    { key: 'has_assembly_info', points: 15, label: 'Assembly Info',
      check: (p) => containsAny(p._body || '', ['assembly', 'installation', 'setup', 'easy to assemble', 'no assembly', 'tools required']).length > 0,
      missing_msg: 'No assembly info' },
    { key: 'has_care_instructions', points: 15, label: 'Care Instructions',
      check: (p) => containsAny(p._body || '', ['care', 'clean', 'maintain', 'wipe', 'dust', 'machine wash']).length > 0,
      missing_msg: 'No care instructions' },
    { key: 'has_weight_capacity', points: 15, label: 'Weight Capacity',
      check: (p) => containsAny(p._body || '', ['weight limit', 'capacity', 'load', 'supports up to', 'max weight']).length > 0,
      missing_msg: 'No weight capacity listed' },
    { key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
  ],
  food_beverage: [
    { key: 'has_ingredients', points: 25, label: 'Ingredients List',
      check: (p) => p._hasIngredients || containsAny(p._body || '', ['ingredient', 'contains', 'made with', 'brewed with']).length > 0,
      missing_msg: 'No ingredients — legally and commercially critical' },
    { key: 'has_allergens', points: 20, label: 'Allergen Info',
      check: (p) => containsAny(p._body || '', ['allergen', 'nut-free', 'dairy-free', 'gluten-free', 'soy-free', 'contains milk', 'contains soy']).length > 0,
      missing_msg: 'No allergen info — a top food AI query' },
    { key: 'has_nutritional_info', points: 20, label: 'Nutritional Info',
      check: (p) => /\\d+\\s*(?:cal|kcal|g|mg|protein|carb|fat)/i.test(p._body || ''),
      missing_msg: 'No nutritional information' },
    { key: 'has_storage_info', points: 15, label: 'Storage Instructions',
      check: (p) => containsAny(p._body || '', ['store', 'refrigerate', 'shelf life', 'keep cool', 'best before', 'expiry', 'room temperature']).length > 0,
      missing_msg: 'No storage instructions' },
    { key: 'has_certifications', points: 10, label: 'Certifications',
      check: (p) => containsAny((p._body || '') + ' ' + (p._tagsString || ''), ['organic', 'non-gmo', 'fair trade', 'kosher', 'halal', 'usda']).length > 0,
      missing_msg: 'No certifications' },
    { key: 'has_return_policy', points: 10, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
  ],
  baby_kids: [
    { key: 'has_age_range', points: 25, label: 'Age Range',
      check: (p) => /\\d+\\s*(?:months?|years?|yrs?|\\+)/i.test((p._body || '') + ' ' + (p.title || p.name || '')) || containsAny(p._body || '', ['age range', 'ages', 'suitable for']).length > 0,
      missing_msg: 'No age range — parents always filter by this' },
    { key: 'has_safety_certifications', points: 25, label: 'Safety Certifications',
      check: (p) => containsAny((p._body || '') + ' ' + (p._tagsString || ''), ['astm', 'ce', 'bpa-free', 'bpa free', 'non-toxic', 'safety certified', 'cpsc', 'en71']).length > 0,
      missing_msg: 'No safety certifications — critical for parents' },
    { key: 'has_material', points: 20, label: 'Material Info',
      check: (p) => containsAny(p._body || '', ['material', 'cotton', 'wood', 'plastic', 'silicone', 'fabric', 'soft']).length > 0,
      missing_msg: 'No material info' },
    { key: 'has_dimensions', points: 15, label: 'Size/Dimensions',
      check: (p) => /\\d+\\s*(?:cm|mm|inch|inches)/i.test(p._body || '') || containsAny(p._body || '', ['size', 'dimensions']).length > 0,
      missing_msg: 'No size info' },
    { key: 'has_care_instructions', points: 15, label: 'Care Instructions',
      check: (p) => containsAny(p._body || '', ['washable', 'machine wash', 'hand wash', 'wipe clean', 'easy to clean']).length > 0,
      missing_msg: 'No care instructions' },
  ],
  general: [
    { key: 'has_description', points: 25, label: 'Detailed Description',
      check: (p) => wordCount(p._bodyRaw || '') > 50,
      missing_msg: 'Description too short' },
    { key: 'has_return_policy', points: 20, label: 'Return Policy',
      check: (p) => p._hasReturnPolicy,
      missing_msg: 'No return policy' },
    { key: 'has_shipping_info', points: 20, label: 'Shipping Info',
      check: (p) => p._hasShipping,
      missing_msg: 'No shipping information' },
    { key: 'has_tags', points: 15, label: 'Product Tags',
      check: (p) => p._tagsArray.length > 3,
      missing_msg: 'Fewer than 3 product tags' },
    { key: 'has_images', points: 10, label: 'Multiple Images',
      check: (p) => p._images.length > 1,
      missing_msg: 'Only one product image' },
    { key: 'has_compare_price', points: 10, label: 'Compare-at Price',
      check: (p) => p._variants.some(v => v.compare_at_price > 0) || (p.compare_at_price > 0),
      missing_msg: 'No compare-at price set' },
  ],
};

function getRubric`);

// Replace scoreProduct
content = content.replace(
  /function scoreProduct\(product\) \{\n  const \{ category, confidence, matched_signals \} = detectCategory\(product\);\n  const rubric = getRubric\(category\);/,
  \`function scoreProduct(product) {
  const norm = normalizeProduct(product);
  const { category, confidence, matched_signals } = detectCategory(norm);
  const rubric = getRubric(category);\`
);

// In scoreProduct, replace `passed = !!criterion.check(product);` with `passed = !!criterion.check(norm);`
content = content.replace(
  /passed = !!criterion\.check\(product\);/,
  \`passed = !!criterion.check(norm);\`
);

// In scoreProduct, add citation probability to return object
content = content.replace(
  /return \{\n    score: Math\.min\(score, 100\),\n    issues,/,
  \`const finalScore = Math.min(score, 100);
  return {
    score: finalScore,
    citation: scoreToAICitationProbability(finalScore),
    issues,\`
);

// Add normalizeProduct and scoreToAICitationProbability to module.exports
content = content.replace(
  /module\.exports = \{\n  detectCategory,\n  getRubric,\n  scoreProduct,\n  CATEGORY_LABELS,\n  CATEGORY_COLORS,\n  RUBRICS,\n\};/,
  \`module.exports = {
  detectCategory,
  getRubric,
  scoreProduct,
  normalizeProduct,
  scoreToAICitationProbability,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  RUBRICS,
};\`)

fs.writeFileSync(file, content);
console.log('categoryEngine.js updated');
