/**
 * DETERMINISTIC ISSUE DETECTION — No LLM Required
 *
 * Why each check is deterministic:
 *  - missing_return_policy:   Keyword search on structured text (return/refund/exchange)
 *  - missing_shipping_info:   Keyword search on structured text (shipping/delivery/dispatch)
 *  - weak_social_proof:       Numeric threshold check on review_count
 *  - weak_description:        Word-count threshold on body text
 *  - missing_specifications:  Keyword search for spec-related terms
 *  - price_issue:             Null/zero check on a numeric field
 *
 * None of these require reasoning, interpretation, or contextual judgement.
 * They are binary checks on structured product data. Using an LLM for this
 * wastes tokens, adds latency, and introduces non-determinism.
 */

// ── Helpers ──

// Strip all HTML tags, decode entities, collapse whitespace, and return plain text
function stripHtml(html) {
  if (!html) return '';

  // 1. Remove all HTML tags
  let text = String(html).replace(/<[^>]*>/g, ' ');

  // 2. Decode HTML entities
  const entities = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'"
  };
  text = text.replace(/&[#a-z0-9]+;/ig, (match) => {
    return entities[match.toLowerCase()] || ' ';
  });

  // 3. Collapse multiple whitespace/newlines into single spaces
  return text.replace(/\s+/g, ' ').trim();
}

function textContainsAny(text, keywords) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

// Get accurate word count after stripping HTML
function getWordCount(text) {
  if (!text) return 0;
  const cleanText = stripHtml(text);
  if (!cleanText) return 0;
  return cleanText.split(/\s+/).filter(Boolean).length;
}

// ── Main ──

/**
 * Detect product data issues using deterministic checks.
 *
 * @param {Object} product — Product object. Supports both internal format
 *   (description, return_policy, shipping, review_count, ingredients, price)
 *   and raw Shopify format (body_html, variants[0].price).
 *
 * @returns {Array<{type: string, detected: boolean, reason: string, severity: string}>}
 */
function detectIssues(product) {
  const issues = [];

  // Resolve text fields — support both internal and Shopify raw formats
  const bodyText = stripHtml(product.body_html || product.description || '');
  const price = product.price ?? parseFloat(product.variants?.[0]?.price || 0);
  const reviewCount = product.review_count ?? product.reviews_count ?? 0;

  // 1. missing_return_policy (HIGH)
  const hasReturnKeyword = textContainsAny(bodyText, ['return', 'refund', 'exchange']);
  const hasReturnField = !!(product.return_policy);
  if (!hasReturnKeyword && !hasReturnField) {
    issues.push({
      type: 'missing_return_policy',
      detected: true,
      reason: 'No return, refund, or exchange policy found in product description or dedicated field.',
      severity: 'high',
    });
  }

  // 2. missing_shipping_info (HIGH)
  const hasShippingKeyword = textContainsAny(bodyText, ['shipping', 'delivery', 'dispatch']);
  const hasShippingField = !!(product.shipping);
  if (!hasShippingKeyword && !hasShippingField) {
    issues.push({
      type: 'missing_shipping_info',
      detected: true,
      reason: 'No shipping, delivery, or dispatch information found in product data.',
      severity: 'high',
    });
  }

  // 3. weak_social_proof (LOW)
  if (!reviewCount || reviewCount < 3) {
    issues.push({
      type: 'weak_social_proof',
      detected: true,
      reason: `Product has ${reviewCount} review(s). Minimum 3 needed for credible social proof.`,
      severity: 'low',
    });
  }

  // 4. weak_description (MEDIUM)
  const descWords = getWordCount(bodyText);
  if (descWords < 80) {
    issues.push({
      type: 'weak_description',
      detected: true,
      reason: `Product description is ${descWords} words. Minimum 80 recommended for AI visibility.`,
      severity: 'medium',
    });
  }

  // 5. missing_specifications (MEDIUM)
  const specKeywords = ['dimensions', 'weight', 'size', 'material', 'compatibility', 'specs',
    'ingredients', 'ingredient'];
  const hasSpecs = textContainsAny(bodyText, specKeywords) || !!(product.ingredients);
  if (!hasSpecs) {
    issues.push({
      type: 'missing_specifications',
      detected: true,
      reason: 'No specifications (dimensions, weight, material, ingredients, etc.) found in product data.',
      severity: 'medium',
    });
  }

  // 6. price_issue (LOW)
  if (!price || price <= 0) {
    issues.push({
      type: 'price_issue',
      detected: true,
      reason: 'Product price is missing or zero.',
      severity: 'low',
    });
  }

  return issues;
}

module.exports = { detectIssues };
