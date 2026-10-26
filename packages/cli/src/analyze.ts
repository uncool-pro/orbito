/**
 * Design-system analysis of a project: which components exist (by atomic level), who uses whom, which screens use what,
 * and every place that breaks the rules. Static (TypeScript AST), so it runs in CI, in the CLI and in the Vite plugin
 * without starting a browser. The rules are the house rules of the tool: values come from tokens, screens are built
 * only from design-system components, levels build only on lower levels, every component is documented.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

import ts from 'typescript';

import { contrastRatio, DS_LEVELS } from '../../core/src/ds.ts';
import type { DsComponent, DsIssue, DsLevel, DsReport, TokenFile } from '../../core/src/ds.ts';

const posix = (p: string) => p.split(sep).join('/');
/** `// ds-exception: <reason>` (or inside a JSX comment) marks a deliberate departure from the design system. */
const EXCEPTION = /ds-exception:\s*(.*?\S)\s*(?:\*\/\s*\}?)?\s*$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', '.orbito', '.git']);

const walk = (dir: string, out: string[] = []): string[] => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);

    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }

  return out;
};

const resolveImport = (fromFile: string, spec: string): string | null => {
  const base = resolve(dirname(fromFile), spec);

  for (const cand of [base, `${base}.tsx`, `${base}.ts`, join(base, 'index.ts'), join(base, 'index.tsx')]) {
    if (existsSync(cand) && statSync(cand).isFile()) return cand;
  }

  return null;
};

const SPACING_KEYS = /^(padding|margin|gap|rowGap|columnGap)(Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?$/;
const FONT_KEYS = /^(font|fontFamily|fontSize|fontWeight|lineHeight|letterSpacing)$/;
const RAW_COLOR = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|oklch|lab|lch)\(/i;
const TOKEN_REF = /var\(\s*--([A-Za-z0-9_-]+)/g;
const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'form']);
const HANDLERS = /^on[A-Z]/;
const ALLOWED_PACKAGES = /^(react|react-dom|@uncool-pro\/orbito-.+)(\/.*)?$/;

/** A spacing value with a hard-coded, non-zero length (`12`, `"8px 0"`); tokens, 0, auto and % are fine. */
const hasRawLength = (v: string | number) =>
  typeof v === 'number'
    ? v !== 0
    : v
        .replace(/var([^)]*)/g, '')
        .split(/s+/)
        .some((part) => /^-?d*.?d+(px|rem|em)?$/.test(part) && parseFloat(part) !== 0);

type FileFacts = {
  imports: { spec: string; resolved: string | null; names: string[]; line: number }[];
  jsxTags: { name: string; line: number }[];
};

export type AnalyzeOptions = { root: string };

export const analyzeProject = ({ root }: AnalyzeOptions): DsReport => {
  const issues: DsIssue[] = [];
  const rel = (f: string) => posix(relative(root, f));
  const dsDir = join(root, 'design-system');
  const screensDir = join(root, 'screens');
  const add = (i: DsIssue) => issues.push(i);

  // ---- tokens
  const tokenPath = join(dsDir, 'tokens.json');
  let tokens: TokenFile = {};

  if (existsSync(tokenPath)) {
    try {
      tokens = JSON.parse(readFileSync(tokenPath, 'utf8')) as TokenFile;
    } catch (e) {
      add({ rule: 'unknown-token', severity: 'error', file: rel(tokenPath), message: `tokens.json is not valid JSON: ${String(e)}` });
    }
  } else add({ rule: 'unknown-token', severity: 'warning', message: 'no design-system/tokens.json: every value is hard-coded', hint: 'Create tokens.json with colour, type, space and radius tokens.' });
  const tokenByName = new Map(Object.values(tokens).flat().map((t) => [t.name, t]));

  Object.entries(tokens).forEach(([group, list]) =>
    list.forEach((t) => {
      if (!t.usage?.trim()) add({ rule: 'token-usage', severity: 'warning', file: rel(tokenPath), message: `token ${t.name} (${group}) has no usage note`, hint: 'Say in one sentence where it goes, e.g. "Text on color-bg".' });
      (t.on ?? []).forEach((bgName) => {
        const bg = tokenByName.get(bgName);

        if (!bg) return add({ rule: 'unknown-token', severity: 'error', file: rel(tokenPath), message: `token ${t.name} lists an unknown background "${bgName}"` });
        const ratio = contrastRatio(t.value, bg.value);
        const min = t.large ? 3 : 4.5;

        if (ratio !== null && ratio < min)
          add({ rule: 'contrast', severity: 'error', file: rel(tokenPath), message: `${t.name} on ${bgName}: contrast ${ratio.toFixed(2)}:1, needs ${min}:1`, hint: 'Darken the text colour or lighten the background (change lightness, not hue).' });
      });
    }),
  );

  // ---- parse files
  const facts = new Map<string, FileFacts>();
  const scan = (file: string, kind: 'screen' | 'component') => {
    const text = readFileSync(file, 'utf8');
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const f: FileFacts = { imports: [], jsxTags: [] };
    const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
    const where = (n: ts.Node) => ({ file: rel(file), line: lineOf(n) });

    const checkString = (n: ts.Node, value: string) => {
      if (RAW_COLOR.test(value))
        add({ rule: 'raw-color', severity: 'error', ...where(n), message: `raw colour ${JSON.stringify(value.length > 40 ? `${value.slice(0, 40)}…` : value)}`, hint: 'Use a colour token: var(--color-…). Missing one? Add it to tokens.json with a usage note.' });
      for (const m of value.matchAll(TOKEN_REF)) {
        const name = m[1]!;

        // `var(--text-${variant})`: the name is built at runtime, only its prefix is known
        if (!tokenByName.size || name.endsWith('-')) continue;
        if (!tokenByName.has(name) && !name.startsWith('pd-'))
          add({ rule: 'unknown-token', severity: 'error', ...where(n), message: `var(--${name}) is not a token`, hint: 'Use an existing token or add it to tokens.json.' });
      }
    };

    const visit = (n: ts.Node) => {
      if (ts.isImportDeclaration(n) && ts.isStringLiteral(n.moduleSpecifier)) {
        const spec = n.moduleSpecifier.text;
        const names: string[] = [];
        const b = n.importClause?.namedBindings;

        if (n.importClause?.name) names.push(n.importClause.name.text);
        if (b && ts.isNamedImports(b)) b.elements.forEach((e) => names.push(e.name.text));
        f.imports.push({ spec, resolved: spec.startsWith('.') ? resolveImport(file, spec) : null, names, line: lineOf(n) });

        return; // import paths are not values
      }
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) checkString(n, n.text);
      else if (ts.isTemplateExpression(n)) checkString(n, n.getText(sf));
      if (ts.isPropertyAssignment(n) && (ts.isIdentifier(n.name) || ts.isStringLiteral(n.name))) {
        const key = n.name.text;
        const init = n.initializer;
        const literal = ts.isNumericLiteral(init) ? Number(init.text) : ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init) ? init.text : null;

        if (literal !== null && SPACING_KEYS.test(key) && hasRawLength(literal))
          add({ rule: 'raw-spacing', severity: 'warning', ...where(init), message: `${key}: ${JSON.stringify(literal)} is not a spacing token`, hint: 'Use var(--space-…).' });
        if (literal !== null && FONT_KEYS.test(key) && !/var\(/.test(String(literal)) && !/^(inherit|normal)$/.test(String(literal)))
          add({ rule: 'raw-font', severity: 'warning', ...where(init), message: `${key}: ${JSON.stringify(literal)} bypasses the type tokens`, hint: 'Use a type token (font: var(--text-…)) or the Text component.' });
      }
      if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
        const tag = n.tagName.getText(sf);

        f.jsxTags.push({ name: tag, line: lineOf(n) });
        if (kind === 'screen') {
          if (INTERACTIVE_TAGS.has(tag))
            add({ rule: 'raw-interactive', severity: 'error', ...where(n), message: `<${tag}> in a screen`, hint: 'Interactive elements come from the design system (Button, ListItem …) so they look and behave the same everywhere.' });
          n.attributes.properties.forEach((a) => {
            if (ts.isJsxAttribute(a) && HANDLERS.test(a.name.getText(sf)))
              add({ rule: 'raw-interactive', severity: 'error', ...where(a), message: `${a.name.getText(sf)} handler in a screen`, hint: 'Screens do not handle events: use a design-system component with `to` / `back`.' });
          });
        }
      }
      ts.forEachChild(n, visit);
    };

    visit(sf);
    facts.set(file, f);

    return { sf, f };
  };

  // ---- components (exported PascalCase names in level folders)
  const levelOf = (file: string): DsLevel | null => {
    const top = posix(relative(dsDir, file)).split('/')[0];

    return (DS_LEVELS as readonly string[]).includes(top ?? '') ? (top as DsLevel) : null;
  };
  const dsFiles = walk(dsDir).filter((f) => /\.tsx?$/.test(f) && !/\.docs\.tsx?$/.test(f) && levelOf(f));
  const components: DsComponent[] = [];
  const fileOfName = new Map<string, string>();

  dsFiles.forEach((file) => {
    const { sf } = scan(file, 'component');
    const level = levelOf(file)!;

    sf.statements.forEach((s) => {
      const exported = ts.canHaveModifiers(s) && ts.getModifiers(s)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const names: string[] = [];

      if (!exported) return;
      if (ts.isVariableStatement(s)) s.declarationList.declarations.forEach((d) => ts.isIdentifier(d.name) && names.push(d.name.text));
      if ((ts.isFunctionDeclaration(s) || ts.isClassDeclaration(s)) && s.name) names.push(s.name.text);
      names
        .filter((n) => /^[A-Z](?=[A-Za-z0-9]*[a-z])[A-Za-z0-9]*$/.test(n)) // PascalCase; CONSTANTS are not components
        .forEach((name) => {
          if (fileOfName.has(name))
            add({ rule: 'duplicate-name', severity: 'warning', file: rel(file), component: name, message: `component name ${name} is also exported by ${rel(fileOfName.get(name)!)}`, hint: 'Component names are unique across the design system.' });
          fileOfName.set(name, file);
          components.push({ name, level, file: rel(file), documented: false, variants: 0, uses: [], usedBy: [], screens: [] });
        });
    });
  });
  const byName = new Map(components.map((c) => [c.name, c]));
  const compOfFile = (file: string) => components.filter((c) => c.file === rel(file));

  // composition and level order
  dsFiles.forEach((file) => {
    const f = facts.get(file)!;
    const level = levelOf(file)!;

    f.imports.forEach((imp) => {
      if (!imp.resolved || !imp.resolved.startsWith(dsDir)) return;
      const target = levelOf(imp.resolved);

      if (target && DS_LEVELS.indexOf(target) > DS_LEVELS.indexOf(level))
        add({ rule: 'level-order', severity: 'error', file: rel(file), line: imp.line, message: `${level.slice(0, -1)} imports from ${target} (${imp.spec})`, hint: `A ${level.slice(0, -1)} may only build on ${DS_LEVELS.slice(0, DS_LEVELS.indexOf(level) + 1).join(', ')}. Move the piece down a level or this component up.` });
    });
    const imported = new Set(f.imports.flatMap((i) => (i.resolved?.startsWith(dsDir) ? i.names : [])));

    compOfFile(file).forEach((c) => {
      c.uses = [...new Set(f.jsxTags.map((t) => t.name).filter((n) => imported.has(n) && byName.has(n) && n !== c.name))];
    });
  });
  components.forEach((c) => c.uses.forEach((u) => byName.get(u)?.usedBy.push(c.name)));

  // docs
  walk(dsDir)
    .filter((f) => /\.docs\.tsx?$/.test(f))
    .forEach((file) => {
      const text = readFileSync(file, 'utf8');
      const name = /component:\s*['"]([A-Za-z0-9_]+)['"]/.exec(text)?.[1];
      const c = name ? byName.get(name) : undefined;

      if (!c) return add({ rule: 'undocumented', severity: 'warning', file: rel(file), message: `docs file for an unknown component${name ? ` "${name}"` : ''}` });
      c.documented = true;
      c.variants = (text.match(/\brender:\s*\(/g) ?? []).length;
    });

  // ---- screens
  const screens: Record<string, string[]> = {};

  // screen lines, for deliberate exceptions (`// ds-exception: <reason>` on the line above or at the end of the line)
  const screenLines = new Map<string, string[]>();

  walk(screensDir)
    .filter((f) => /\.screen\.[jt]sx$/.test(f))
    .forEach((file) => {
      const id = /([^/\\]+)\.screen\.[jt]sx$/.exec(file)![1]!;
      const { f } = scan(file, 'screen');
      const fromDs = new Set<string>();

      screenLines.set(rel(file), readFileSync(file, 'utf8').split(/\r?\n/));

      f.imports.forEach((imp) => {
        const at = { file: rel(file), line: imp.line, screen: id };

        if (!imp.spec.startsWith('.')) {
          if (!ALLOWED_PACKAGES.test(imp.spec))
            add({ rule: 'import-boundary', severity: 'warning', ...at, message: `screen imports the package "${imp.spec}"`, hint: 'Screens are built from the design system; wrap what you need in a design-system component.' });

          return;
        }
        if (!imp.resolved) return add({ rule: 'import-boundary', severity: 'error', ...at, message: `cannot resolve "${imp.spec}"` });
        if (imp.resolved.startsWith(dsDir + sep) || imp.resolved === join(dsDir, 'index.ts')) {
          if (!/^index\.tsx?$/.test(posix(relative(dsDir, imp.resolved))))
            add({ rule: 'deep-import', severity: 'warning', ...at, message: `imports design-system internals (${imp.spec})`, hint: 'Import from the design system entry point (design-system/index.ts).' });
          imp.names.forEach((n) => fromDs.add(n));
        } else if (/\.screen\.[jt]sx$/.test(imp.resolved)) add({ rule: 'import-boundary', severity: 'error', ...at, message: `screen imports another screen (${imp.spec})`, hint: 'Shared parts belong in the design system (organisms or templates).' });
        else if (!imp.resolved.startsWith(screensDir)) add({ rule: 'import-boundary', severity: 'warning', ...at, message: `screen imports from outside screens/ and design-system/ (${imp.spec})` });
      });
      screens[id] = [...new Set(f.jsxTags.map((t) => t.name).filter((n) => fromDs.has(n) && byName.has(n)))].sort();
      screens[id]!.forEach((n) => byName.get(n)!.screens.push(id));
    });

  // ---- per-component findings
  components.forEach((c) => {
    if (!c.documented)
      add({ rule: 'undocumented', severity: 'warning', file: c.file, component: c.name, message: `${c.name} has no docs`, hint: `Add ${c.name}.docs.tsx next to it: description, do/don't and variants.` });
    else if (!c.variants) add({ rule: 'no-variants', severity: 'warning', file: c.file, component: c.name, message: `${c.name} docs show no variants`, hint: 'Show every variant and state the component has.' });
    if (!c.screens.length && !c.usedBy.length) add({ rule: 'unused', severity: 'info', file: c.file, component: c.name, message: `${c.name} is not used by any screen or component` });
  });
  // a deliberate exception in a screen stays visible (info, with its reason) instead of failing the check; one without
  // a reason is not an exception
  issues.forEach((i) => {
    const lines = i.file && i.line && i.severity !== 'info' ? screenLines.get(i.file) : undefined;

    if (!lines) return;
    const reason = [lines[i.line! - 1], lines[i.line! - 2]].map((l) => (l ? EXCEPTION.exec(l)?.[1] : undefined)).find(Boolean);

    if (!reason) return;
    i.message = `exception (${reason}): ${i.message}`;
    i.severity = 'info';
    i.rule = 'ds-exception';
    delete i.hint;
  });
  // tag issues with the component of their file
  issues.forEach((i) => {
    if (!i.component && i.file) {
      const owners = components.filter((c) => c.file === i.file);

      if (owners.length === 1) i.component = owners[0]!.name;
    }
  });

  const order = { error: 0, warning: 1, info: 2 };

  issues.sort((a, b) => order[a.severity] - order[b.severity] || (a.file ?? '').localeCompare(b.file ?? '') || (a.line ?? 0) - (b.line ?? 0));

  return {
    tokens,
    components: components.sort((a, b) => DS_LEVELS.indexOf(a.level) - DS_LEVELS.indexOf(b.level) || a.name.localeCompare(b.name)),
    screens,
    issues,
    counts: { error: issues.filter((i) => i.severity === 'error').length, warning: issues.filter((i) => i.severity === 'warning').length, info: issues.filter((i) => i.severity === 'info').length },
  };
};
