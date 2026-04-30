/**
 * Deduplicates fix recommendations by field.
 * If multiple fixes target the same field, they are merged into one.
 * 
 * Rules:
 * 1. Groups fixes by field name
 * 2. Combines the issue strings with " + "
 * 3. Uses suggested_improvement from the higher impact_estimate fix
 * 4. Sets impact_estimate to the highest of the group (high > medium > low)
 * 5. Adds "merged": true if combined
 */
function deduplicateFixes(fixes) {
  if (!fixes || !Array.isArray(fixes)) return [];
  
  const fieldMap = new Map();
  const impactScore = { low: 1, medium: 2, high: 3 };

  for (const fix of fixes) {
    const field = fix.field;
    if (!fieldMap.has(field)) {
      fieldMap.set(field, { ...fix }); // Clone to avoid mutating original
    } else {
      const existing = fieldMap.get(field);
      
      const existingScore = impactScore[existing.impact_estimate?.toLowerCase()] || 0;
      const currentScore = impactScore[fix.impact_estimate?.toLowerCase()] || 0;

      // Combine issue descriptions
      existing.issue = `${existing.issue} + ${fix.issue}`;
      
      // Use improvement and impact estimate of the higher-scoring fix
      if (currentScore > existingScore) {
        existing.suggested_improvement = fix.suggested_improvement;
        existing.impact_estimate = fix.impact_estimate;
      }
      
      existing.merged = true;
    }
  }

  return Array.from(fieldMap.values());
}

module.exports = { deduplicateFixes };
