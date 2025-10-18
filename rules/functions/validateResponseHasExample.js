/**
 * Validates that 2xx responses include example(s) unless they use $ref.
 * @param {object} input - OpenAPI response node
 * @param {object} context - Spectral context
 * @returns {Array|undefined} Array of issues or undefined when OK
 */
module.exports = (input, context) => {
  // Skip non-objects
  if (!input || typeof input !== 'object') return;

  // If the response has $ref, do not require example
  if (input.$ref) return;

  // Look for content -> application/json -> schema
  const content = input.content?.['application/json'];
  if (!content?.schema) return;

  // If the schema has $ref, do not require example
  if (content.schema.$ref) return;

  // If it already has example or examples, it's fine
  if ('example' in content || 'examples' in content) return;

  // If neither example nor examples is present, issue an error
  const pathStr = context.path?.join('.') || 'response';
  return [{
    message: `${pathStr}: Response must include example or examples under content.application/json unless using $ref.`
  }];
};

