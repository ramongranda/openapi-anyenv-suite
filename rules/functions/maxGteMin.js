// functions/maxGteMin.js
// Valida coherencia entre minimum/maximum y sus variantes exclusive*.
// Contempla OAS 3.0 (exclusive* booleano) y OAS 3.1 (exclusive* numérico).
export default function maxGteMin(targetVal, _opts, context) {
  const results = [];

  if (typeof targetVal !== 'object' || targetVal === null) return results;

  const has = (k) => Object.prototype.hasOwnProperty.call(targetVal, k);

  const min   = has('minimum')           ? targetVal.minimum           : undefined;
  const max   = has('maximum')           ? targetVal.maximum           : undefined;
  const exMin = has('exclusiveMinimum')  ? targetVal.exclusiveMinimum  : undefined;
  const exMax = has('exclusiveMaximum')  ? targetVal.exclusiveMaximum  : undefined;

  const pushError = (msg, pathProp = 'maximum') =>
    results.push({ message: msg, path: [...context.path, pathProp] });

  // 1) minimum (num) + maximum (num) => max >= min
  if (typeof min === 'number' && typeof max === 'number') {
    if (max < min) pushError(`'maximum' (${max}) no puede ser menor que 'minimum' (${min}).`);
  }

  // 2) exclusiveMinimum (num, OAS 3.1) + maximum (num) => max > exMin
  if (typeof exMin === 'number' && typeof max === 'number') {
    if (!(max > exMin)) pushError(`'maximum' (${max}) debe ser estrictamente mayor que 'exclusiveMinimum' (${exMin}).`);
  }

  // 3) minimum (num) + exclusiveMaximum (num, OAS 3.1) => exMax > min
  if (typeof min === 'number' && typeof exMax === 'number') {
    if (!(exMax > min)) pushError(`'exclusiveMaximum' (${exMax}) debe ser estrictamente mayor que 'minimum' (${min}).`, 'exclusiveMaximum');
  }

  // 4) exclusiveMinimum (num) + exclusiveMaximum (num) => exMax > exMin
  if (typeof exMin === 'number' && typeof exMax === 'number') {
    if (!(exMax > exMin)) pushError(`'exclusiveMaximum' (${exMax}) debe ser estrictamente mayor que 'exclusiveMinimum' (${exMin}).`, 'exclusiveMaximum');
  }

  // 5) OAS 3.0: exclusiveMinimum/exclusiveMaximum booleanos
  if (typeof min === 'number' && typeof max === 'number' && exMin === true) {
    if (!(max > min)) pushError(`Con 'exclusiveMinimum: true', 'maximum' (${max}) debe ser > 'minimum' (${min}).`);
  }
  if (typeof min === 'number' && typeof max === 'number' && exMax === true) {
    if (!(max > min)) pushError(`Con 'exclusiveMaximum: true', 'maximum' (${max}) debe ser > 'minimum' (${min}).`);
  }

  return results;
}
``