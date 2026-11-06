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
  'screens/spacing.screen.tsx': `export default function Spacing() { return <div style={{ padding: '8px 0', margin: '0 auto', gap: 'var(--space-2)' }} />; }`,
  'screens/promo.screen.tsx': `export default function Promo() {
  return (
    // ds-exception: campaign colour agreed with marketing, until the token exists
    <div style={{ background: '#00ff00' }} />
  );
}`,
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

  it('keeps a deliberate exception visible with its reason instead of failing', () => {
    const ex = report.issues.filter((i) => i.rule === 'ds-exception');

    expect(ex).toHaveLength(1);
    expect(ex[0]).toMatchObject({ severity: 'info', file: 'screens/promo.screen.tsx' });
    expect(ex[0]!.message.startsWith('exception (campaign colour agreed with marketing, until the token exists): raw colour')).toBe(true);
  });

  it('flags a hard-coded spacing written as text, and only that one', () => {
    const inFile = report.issues.filter((i) => i.rule === 'raw-spacing' && i.file === 'screens/spacing.screen.tsx');

    expect(inFile.map((i) => i.message)).toEqual(['padding: "8px 0" is not a spacing token']);
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

/** Thin screen files that render a view from screens/<area>/views/ (one view, several states as screens). */
const withViews: Record<string, string> = {
  'design-system/tokens.json': JSON.stringify({ color: [{ name: 'color-ink', value: '#111111', usage: 'Text.' }], space: [{ name: 'space-2', value: '8px', usage: 'Gaps.' }] }),
  'design-system/atoms/Text.tsx': `export const Text = ({ children }: { children: string }) => <span>{children}</span>;`,
  'design-system/atoms/Lonely.tsx': `export const Lonely = () => <span />;`,
  'design-system/molecules/Badge.tsx': `export const Badge = () => <span />;`,
  'design-system/index.ts': `export { Text } from './atoms/Text';\nexport { Lonely } from './atoms/Lonely';\nexport { Badge } from './molecules/Badge';`,
  'screens/invest/accounts.screen.tsx': `import { AccountsView } from './views/AccountsView';\nexport default function Accounts() { return <AccountsView variant="new" />; }`,
  'screens/invest/accounts-empty.screen.tsx': `import { AccountsView } from './views/AccountsView';\nexport default function AccountsEmpty() { return <AccountsView variant="empty" />; }`,
  'screens/invest/views/AccountsView.tsx': `import { Badge } from '../../../design-system';\nimport { Row } from './parts/Row';\nexport const AccountsView = ({ variant }: { variant: string }) => (\n  <div style={{ background: '#123456' }}>\n    <Badge />\n    <Row />\n    <button onClick={() => 0}>{variant}</button>\n    {/* ds-exception: chart colour from the brand guide, until the token exists */}\n    <i style={{ color: '#abcdef' }} />\n  </div>\n);`,
  'screens/invest/views/parts/Row.tsx': `import { Text } from '../../../../design-system';\nimport Accounts from '../../accounts.screen';\nexport const Row = () => <div style={{ padding: 12 }}><Text>row</Text><Accounts /></div>;`,
};

describe('analyzeProject, screens built from views', () => {
  let viewRoot = '';
  let r: DsReport;

  beforeAll(() => {
    viewRoot = mkdtempSync(join(tmpdir(), 'pd-analyze-views-'));
    Object.entries(withViews).forEach(([p, text]) => {
      mkdirSync(dirname(join(viewRoot, p)), { recursive: true });
      writeFileSync(join(viewRoot, p), text);
    });
    r = analyzeProject({ root: viewRoot });
  });

  afterAll(() => rmSync(viewRoot, { recursive: true, force: true }));

  it('counts a component used in a view, and in a part of it, as used by every screen that shows the view', () => {
    expect([...r.components.find((c) => c.name === 'Badge')!.screens].sort()).toEqual(['accounts', 'accounts-empty']);
    expect([...r.components.find((c) => c.name === 'Text')!.screens].sort()).toEqual(['accounts', 'accounts-empty']);
    expect(r.screens['accounts']).toEqual(['Badge', 'Text']);
    expect(r.issues.filter((i) => i.rule === 'unused').map((i) => i.component)).toEqual(['Lonely']);
  });

  it('checks the code of a view with the rules of a screen, once per file', () => {
    const inView = r.issues.filter((i) => i.file === 'screens/invest/views/AccountsView.tsx');

    expect(inView.filter((i) => i.rule === 'raw-color')).toHaveLength(1);
    expect(inView.map((i) => i.rule)).toContain('raw-interactive');
    expect(r.issues.filter((i) => i.rule === 'raw-spacing').map((i) => i.file)).toEqual(['screens/invest/views/parts/Row.tsx']);
    expect(r.issues.some((i) => i.file === 'screens/invest/views/parts/Row.tsx' && i.rule === 'import-boundary' && /another screen/.test(i.message))).toBe(true);
  });

  it('keeps a deliberate exception in a view visible with its reason', () => {
    const ex = r.issues.filter((i) => i.rule === 'ds-exception');

    expect(ex).toHaveLength(1);
    expect(ex[0]).toMatchObject({ severity: 'info', file: 'screens/invest/views/AccountsView.tsx' });
  });
});
