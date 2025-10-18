/**
 * Valida que un response 200/2xx tenga example(s) salvo que use $ref.
 * @param {object} input - Nodo response OpenAPI
 * @param {object} context - Contexto de Spectral
 * @returns {Array|undefined} Array de errores o undefined si no hay errores
 */
module.exports = (input, context) => {
  // Ignorar si no es objeto
  if (!input || typeof input !== 'object') return;

  // Si el response tiene $ref, no exigir example
  if (input.$ref) return;

  // Buscar content -> application/json -> schema
  const content = input.content?.['application/json'];
  if (!content?.schema) return;

  // Si el schema tiene $ref, no exigir example
  if (content.schema.$ref) return;

  // Si ya tiene example o examples, está bien
  if ('example' in content || 'examples' in content) return;

  // Si no tiene example ni examples, error
  const pathStr = context.path?.join('.') || 'response';
  return [{
    message: `${pathStr}: El response debe tener example o examples en content.application/json, salvo que use $ref.`
  }];
};