/**
 * Valida que las propiedades importantes tengan ejemplo, ignorando las que usan $ref.
 */
module.exports = (input, context) => {
  // Ignorar si la propiedad es un $ref
  if (input && typeof input === 'object' && input.$ref) {
    return;
  }
  // Solo aplicar a propiedades que sean tipo primitivo o boolean/number/string/object/array
  if (!input || typeof input !== 'object') {
    return;
  }
  // Si no tiene ejemplo, advertir
  if (typeof input.example === 'undefined') {
    const pathStr = context && context.path ? context.path.join('.') : 'property';
    return [{
      message: `${pathStr}: Important property should include example.`
    }];
  }
  return;
};