/**
 * Prompt Builder Utility
 * Provides safe construction and validation of prompts for LLM queries.
 */

const { stripHtml } = require('./shopify');

/**
 * Validates that no prompt variables are empty, null, or undefined.
 * Logs a warning if any data is missing so it's visible during the demo.
 */
function validateVariables(variables) {
  for (const [key, value] of Object.entries(variables)) {
    if (
      value === null ||
      value === undefined ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0)
    ) {
      console.warn(`⚠️  [WARNING] Prompt variable '{{${key}}}' is missing, null, or empty.`);
    }
  }
}

/**
 * Safely builds a prompt by replacing {{variable}} placeholders.
 * Throws a fatal error if required data is missing.
 */
function buildPrompt(template, variables) {
  // 1. Run the validation warning logger
  validateVariables(variables);

  // Clone variables to avoid mutating the original object
  const vars = { ...variables };

  // 2. Normalize formats exactly as requested
  if (Array.isArray(vars.use_cases)) {
    vars.use_cases = vars.use_cases.join(', ');
  }
  
  if (Array.isArray(vars.not_for)) {
    vars.not_for = vars.not_for.join(', ');
  }
  
  if (vars.sophistication_level !== undefined && vars.sophistication_level !== null) {
    vars.sophistication_level = String(vars.sophistication_level);
  }
  
  if (vars.price !== undefined && vars.price !== null) {
    vars.price = String(vars.price);
  }

  // Ensure HTML is stripped from the description before LLM sees it
  if (vars.product_description) {
    vars.product_description = stripHtml(vars.product_description);
  }

  // 3. Replace all {{placeholders}} and enforce strict data presence
  let fullySubstitutedPrompt = template;
  
  for (const [key, value] of Object.entries(vars)) {
    // 4. Throw an explicit error to prevent silent LLM hallucinations
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      throw new Error(`CRITICAL ERROR: Prompt construction failed. Variable '{{${key}}}' is undefined or empty.`);
    }

    // Global replace for this specific placeholder
    const placeholderRegex = new RegExp(`{{${key}}}`, 'g');
    fullySubstitutedPrompt = fullySubstitutedPrompt.replace(placeholderRegex, value);
  }

  // 5. Return the clean, complete prompt
  return fullySubstitutedPrompt;
}

module.exports = {
  buildPrompt,
  validateVariables
};
