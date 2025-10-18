/**
 * Validates that string properties with date/time semantics declare proper format.
 * Only applies to properties that appear to be date/time fields based on:
 * - Property name patterns (date, time, timestamp, etc.)
 * - Description content mentioning dates/times
 * This avoids false positives on URI fields and other non-temporal strings.
 */
module.exports = (input, context, opts = {}) => {
  // Skip if not an object (property schema)
  if (!input || typeof input !== "object") {
    return;
  }

  // Only apply to string type properties
  if (input.type !== "string") {
    return;
  }

  // Get property name from the JSONPath context - handle null context.path
  const propertyName = context?.path?.length > 0 ? context.path.at(-1) : "";

  // Check if this looks like a date/time field based on name
  const dateTimeNamePatterns = [
    /^.*date.*$/i,
    /^.*time.*$/i,
    /^.*timestamp.*$/i,
    /^.*created.*$/i,
    /^.*updated.*$/i,
    /^.*modified.*$/i,
    /^.*expires?.*$/i,
    /^.*valid.*$/i,
  ];

  // Exclude common non-date fields that might contain date-related words
  const excludePatterns = [
    /^.*currency.*$/i,
    /^.*type.*$/i,
    /^.*status.*$/i,
    /^.*code.*$/i,
    /^.*id.*$/i,
    /^.*url.*$/i,
    /^.*uri.*$/i,
    /^.*link.*$/i,
  ];

  const isExcludedField = propertyName && 
    excludePatterns.some((pattern) => pattern.test(propertyName));

  const hasDateTimeName =
    propertyName &&
    !isExcludedField &&
    dateTimeNamePatterns.some((pattern) => pattern.test(propertyName));

  // Check if description mentions date/time concepts, but be more specific
  const hasDateTimeDescription =
    input.description &&
    !isExcludedField &&
    /\b(date|time|timestamp|datetime|when|created|updated|modified|expires?|utc|iso.*date|rfc.*date)/i.test(
      input.description
    );

  // Only validate if this appears to be a date/time field
  if (!hasDateTimeName && !hasDateTimeDescription) {
    return;
  }

  // Check if format is properly declared
  const validFormats = ["date", "date-time"];
  const issues = [];
  const pathStr = context?.path ? context.path.join(".") : "property";

  if (!input.format) {
    issues.push({
      message: `${pathStr}: String property '${propertyName}' appears to be a date/time field but lacks format declaration. Use format: 'date' or 'date-time'.`,
    });
  } else if (!validFormats.includes(input.format)) {
    issues.push({
      message: `${pathStr}: String property '${propertyName}' appears to be a date/time field but has invalid format '${input.format}'. Use format: 'date' or 'date-time'.`,
    });
  }

  return issues.length ? issues : undefined;
};
