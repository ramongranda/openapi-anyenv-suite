import { describe, it, expect } from '@jest/globals';
import { execAllowFail } from '../scripts/process.mjs';

describe('execAllowFail', () => {
  it('should execute a command and resolve with the output', async () => {
    const { code, out, err } = await execAllowFail('node', ['-v']);
    expect(code).toBe(0);
    expect(out).toMatch(/^v\d+\.\d+\.\d+/);
    expect(err).toBe('');
  });

  it('should handle a failing command', async () => {
    const { code, out, err } = await execAllowFail('node', ['-e', '"process.exit(1)"'
    ]);
    expect(code).toBeGreaterThan(0);
    expect(out).toBe('');
    expect(err).toBe('');
  });
});