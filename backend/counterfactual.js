/**
 * COUNTERFACTUAL ENGINE
 *
 * Real before/after comparison — no mocked data.
 *
 * Flow:
 *  1. Take original product + fix suggestions
 *  2. Apply fixes via string merge → patched_product
 *  3. Simulate both original and patched against the query
 *  4. Compare scores and return the delta
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const axios = require('axios');
const { scoreProduct, scoreToAICitationProbability } = require('./categoryEngine');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ── Single-product AI simulation with retry ──

async function simulateProduct(product, query) {
  const systemPrompt = `You are an AI shopping agent. A buyer searched: '${query}'.
Given this product: ${JSON.stringify(product)}
Would you recommend this product? Respond ONLY in JSON:
{ "would_include": true, "confidence": 0.0, "reason": "" }`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.post(OPENAI_URL, {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a strict AI shopping agent. Respond ONLY in valid JSON.' },
          { role: 'user', content: systemPrompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
      if (attempt === 1) {
        console.error('simulateProduct: both attempts failed', err.message);
        return { would_include: false, confidence: 0, reason: 'parse_error' };
      }
      console.warn('simulateProduct: retry after failure', err.message);
    }
  }
}

// ── Apply fixes to product (pure string manipulation) ──

function applyFixes(product, fixes) {
  const patched = JSON.parse(JSON.stringify(product)); // deep clone
  const appliedSummary = [];

  for (const fix of fixes) {
    const field = fix.field?.toLowerCase();
    const improvement = fix.suggested_improvement || fix.rewritten_description || '';
    if (!improvement) continue;

    switch (field) {
      case 'title':
        appliedSummary.push(`title: "${patched.name}" → "${improvement}"`);
        patched.name = improvement;
        break;
      case 'description':
        appliedSummary.push(`description: appended improvement text (${improvement.length} chars)`);
        patched.description = improvement;
        break;
      case 'specifications':
      case 'ingredients':
        appliedSummary.push(`specifications: added "${improvement.slice(0, 60)}..."`);
        patched.ingredients = improvement;
        break;
      case 'policies':
      case 'return_policy':
        appliedSummary.push(`return_policy: set to "${improvement.slice(0, 60)}..."`);
        patched.return_policy = improvement;
        break;
      case 'shipping':
        appliedSummary.push(`shipping: set to "${improvement.slice(0, 60)}..."`);
        patched.shipping = improvement;
        break;
      default:
        // For description-like fixes or rewritten_description
        if (improvement.length > 50) {
          appliedSummary.push(`description: replaced with rewritten version (${improvement.length} chars)`);
          patched.description = improvement;
        }
        break;
    }
  }

  return {
    patched,
    fix_applied: appliedSummary.length > 0
      ? appliedSummary.join('; ')
      : 'No applicable fixes found',
  };
}

// ── Main counterfactual runner ──

async function runCounterfactual(product, fixes, query) {
  // Step 1 — Apply fixes
  const { patched, fix_applied } = applyFixes(product, fixes);

  // Step 2 — Simulate BEFORE (original product)
  const before = await simulateProduct(product, query);

  // Step 3 — Simulate AFTER (patched product)
  const after = await simulateProduct(patched, query);

  // Step 4 — Compute delta
  const delta = (after.confidence || 0) - (before.confidence || 0);

  let verdict = 'no_change';
  if (after.would_include && !before.would_include) verdict = 'improved';
  else if (!after.would_include && before.would_include) verdict = 'degraded';
  else if (delta > 0.1) verdict = 'improved';
  else if (delta < -0.1) verdict = 'degraded';

  return {
    product_id: product.id,
    query_used: query,
    before: {
      would_include: before.would_include,
      confidence: before.confidence || 0,
      reason: before.reason || '',
    },
    after: {
      would_include: after.would_include,
      confidence: after.confidence || 0,
      reason: after.reason || '',
      after_score: scoreProduct(patched).score > scoreProduct(product).score 
        ? Math.max(scoreProduct(product).score, Math.min(85, scoreProduct(patched).score)) 
        : scoreProduct(patched).score,
      after_citation: scoreToAICitationProbability(
        scoreProduct(patched).score > scoreProduct(product).score 
          ? Math.max(scoreProduct(product).score, Math.min(85, scoreProduct(patched).score)) 
          : scoreProduct(patched).score, 
        true
      )
    },
    delta: parseFloat(delta.toFixed(3)),
    fix_applied,
    verdict,
    patched_product: patched,
    original_product: product,
  };
}

module.exports = { runCounterfactual, applyFixes, simulateProduct };
