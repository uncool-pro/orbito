import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { analyzeProject } from '../src/analyze';
import type { DsReport } from '../../core/src/ds';

/** A small project that breaks every rule once. */
const files: Record<string, string> = {
  'design-system/tokens.json': JSON.stringify({
    color: [
      { name: 'color-bg', value: '#ffffff', usage: 'Background.' },
      { name: 'color-ink', value: '#111111', usage: 'Text.', on: ['color-bg'] },
      { name: 'color-faint', value: '#bbbbbb', usage: 'Too light for text.', on: ['color-bg'] },
    ],
    space: [{ name: 'space-2', value: '8px' }],
  }),
  'design-system/atoms/Text.tsx': `export const Text = ({ children }: { children: string }) => <span style={{ color: 'var(--color-ink)' }}>{children}</span>;`,
  'design-system/atoms/Text.docs.tsx': `export default { component: 'Text', description: 'x', variants: [{ name: 'a', render: () => null }] };`,
  'design-system/atoms/Badge.tsx': `import { Card } from '../organisms/Card';\nexport const Badge = () => <Card />;`,
  'design-system/molecules/Row.tsx': `import { Text } from '../atoms/Text';\nexport const Row = () => <div style={{ padding: 12, color: 'var(--color-nope)' }}><Text>row</Text></div>;`,
  'design-system/molecules/Row.docs.tsx': `export default { component: 'Row', description: 'x', variants: [] };`,
  'design-system/organisms/Card.tsx': `import { Row } from '../molecules/Row';\nexport const Card = () => <section style={{ fontSize: 14 }}><Row /></section>;`,
  'design-system/index.ts': `export { Text } from './atoms/Text';\nexport { Row } from './molecules/Row';\nexport { Card } from './organisms/Card';\nexport { Badge } from './atoms/Badge';`,
  'screens/home.screen.tsx': `import { Card, Text } from '../design-system';\nimport { Row } from '../design-system/molecules/Row';\nimport Other from './other.screen';\nimport { motion } from 'framer-motion';\nexport default function Home() { return <div style={{ background: '#ff0000', gap: '0 auto' }}><Card /><Text>hi</Text><Row /><button onClick={() => 0}>x</button><Other /></div>; }`,
  'screens/other.screen.tsx': `export default function Other() { return <div style={{ margin: '0 auto', padding: 'var(--space-2)' }} />; }`,
};

let root = '';
let report: DsReport;
const rules = () => report.issues.map((i) => `${i.rule}${i.component ? `:${i.component}` : ''}`);

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'pd-analyze-'));
  Object.entries(files).forEach(([p, text]) => {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), text);
  });
  report = analyzeProject({ root });
});

afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('analyzeProject', () => {
  it('finds components by level and how they compose', () => {
    expect(report.components.map((c) => `${c.level}/${c.name}`)).toEqual(['atoms/Badge', 'atoms/Text', 'molecules/Row', 'organisms/Card']);
    const card = report.components.find((c) => c.name === 'Card')!;

    expect(card.uses).toEqual(['Row']);
    expect(card.screens).toEqual(['home']);
    expect(report.components.find((c) => c.name === 'Row')!.usedBy).toEqual(['Card']);
  });

  it('flags tokens: missing usage note, failing contrast, unknown token', () => {
    expect(rules()).toContain('token-usage');
    expect(report.issues.find((i) => i.rule === 'contrast')?.message).toMatch(/color-faint on color-bg/);
    expect(rules()).not.toContain('contrast:color-ink');
    expect(rules()).toContain('unknown-token:Row');
  });

  it('flags hard-coded values', () => {
    expect(report.issues.filter((i) => i.rule === 'raw-color').map((i) => i.file)).toEqual(['screens/home.screen.tsx']);
    expect(rules()).toContain('raw-spacing:Row');
    expect(rules()).toContain('raw-font:Card');
    // 0, auto and tokens are fine
    expect(report.issues.filter((i) => i.rule === 'raw-spacing' && i.file?.includes('other'))).toHaveLength(0);
  });

  it('enforces the atomic level order', () => {
    const lo = report.issues.find((i) => i.rule === 'level-order');

    expect(lo?.component).toBe('Badge');
    expect(lo?.severity).toBe('error');
  });

  it('keeps screens on the design system', () => {
    const msgs = report.issues.filter((i) => i.screen === 'home' || i.file === 'screens/home.screen.tsx').map((i) => i.rule);

    expect(msgs).toEqual(expect.arrayContaining(['raw-interactive', 'deep-import', 'import-boundary']));
    expect(report.issues.some((i) => i.rule === 'import-boundary' && /framer-motion/.test(i.message))).toBe(true);
    expect(report.issues.some((i) => i.rule === 'import-boundary' && /another screen/.test(i.message))).toBe(true);
  });

  it('asks for docs and variants', () => {
    expect(rules()).toEqual(expect.arrayContaining(['undocumented:Card', 'undocumented:Badge', 'no-variants:Row']));
    expect(rules()).not.toContain('undocumented:Text');
  });

  it('counts by severity', () => {
    expect(report.counts.error).toBe(report.issues.filter((i) => i.severity === 'error').length);
    expect(report.counts.error).toBeGreaterThan(0);
  });
});
