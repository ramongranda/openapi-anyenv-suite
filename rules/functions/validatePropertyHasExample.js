/**
 * Validate that important properties include an example, ignoring those using $ref.
 */
module.exports = (input, context) => {
  // Skip if the property is a $ref
  if (input && typeof input === 'object' && input.$ref) {
    return;
  }
  // Apply only to schema objects
  if (!input || typeof input !== 'object') {
    return;
  }
  // If no example is present, warn
  if (typeof input.example === 'undefined') {
    const pathStr = context && context.path ? context.path.join('.') : 'property';
    return [{
      message: `${pathStr}: Important property should include an example.`
    }];
  }
  return;
};
