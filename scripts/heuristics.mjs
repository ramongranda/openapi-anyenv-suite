function flattenOps(spec) {
  const paths = spec.paths || {};
  const methods = ['get','put','post','delete','patch','head','options','trace'];
  const ops = [];
  for (const p of Object.keys(paths)) {
    const item = paths[p] || {};
    for (const m of methods) {
      if (item[m]) ops.push({ path: p, method: m, op: item[m] });
    }
  }
  return ops;
}

function unique(arr) { return Array.from(new Set(arr)); }

export function computeHeuristics(spec) {
  const ops = flattenOps(spec);
  const total = ops.length || 1;
  const hasTitle = !!spec.info?.title;
  const hasVersion = !!spec.info?.version;
  const hasServers = Array.isArray(spec.servers) && spec.servers.length > 0;
  const withSummary = ops.filter(o => !!o.op.summary).length / total;
  const withDesc = ops.filter(o => !!o.op.description).length / total;
  const opIds = ops.map(o => o.op.operationId).filter(Boolean);
  const uniqueOpIds = unique(opIds).length;
  const opIdUniqueRatio = opIds.length ? (uniqueOpIds / opIds.length) : 1;
  const with4xx = ops.filter(o => {
    const resps = (o.op.responses) ? Object.keys(o.op.responses) : [];
    return resps.some(code => /^4\\d\\d$/.test(code));
  }).length / total;
  const hasSecSchemes = !!Object.keys(spec.components?.securitySchemes ?? {}).length;

  let bonus = 0;
  if (hasTitle) bonus += 2;
  if (hasVersion) bonus += 2;
  if (hasServers) bonus += 1;
  if (withSummary >= 0.8) bonus += 5;
  if (withDesc >= 0.8) bonus += 5;
  if (with4xx >= 0.7) bonus += 5;
  if (hasSecSchemes) bonus += 3;
  if (bonus > 20) bonus = 20;

  return {
    totals: { operations: ops.length },
    ratios: { withSummary, withDesc, with4xx, opIdUniqueRatio },
    presence: { hasTitle, hasVersion, hasServers, hasSecSchemes },
    bonus
  };
}
