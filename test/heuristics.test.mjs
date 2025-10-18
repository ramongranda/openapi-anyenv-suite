import { describe, it, expect } from '@jest/globals';
import { computeHeuristics } from '../scripts/heuristics.mjs';

describe('computeHeuristics', () => {
  it('should return default values for an empty spec', () => {
    const spec = {};
    const result = computeHeuristics(spec);
    expect(result.totals.operations).toBe(0);
    expect(result.ratios.withSummary).toBe(0);
    expect(result.ratios.withDesc).toBe(0);
    expect(result.ratios.with4xx).toBe(0);
    expect(result.ratios.opIdUniqueRatio).toBe(1);
    expect(result.presence.hasTitle).toBe(false);
    expect(result.presence.hasVersion).toBe(false);
    expect(result.presence.hasServers).toBe(false);
    expect(result.presence.hasSecSchemes).toBe(false);
    expect(result.bonus).toBe(0);
  });

  it('should detect presence of title, version, servers, and security schemes', () => {
    const spec = {
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      servers: [{ url: 'https://example.com' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
    };
    const result = computeHeuristics(spec);
    expect(result.presence.hasTitle).toBe(true);
    expect(result.presence.hasVersion).toBe(true);
    expect(result.presence.hasServers).toBe(true);
    expect(result.presence.hasSecSchemes).toBe(true);
  });

  it('should calculate bonus points correctly', () => {
    const spec = {
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
      servers: [{ url: 'https://example.com' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer' },
        },
      },
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            description: 'A test endpoint',
            responses: {
              '200': { description: 'OK' },
              '404': { description: 'Not Found' },
            },
          },
        },
      },
    };
    const result = computeHeuristics(spec);
    // 2+2+1+5+5+3 = 18
    expect(result.bonus).toBe(18);
  });
});