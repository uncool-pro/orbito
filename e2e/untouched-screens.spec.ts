// Orbito shows people's screens; it never changes how they look. An update of the tool must not restyle a design.
// These tests fail when a style of Orbito can reach an element inside a screen (or a component in the catalog), and
// when a screen on the board is drawn differently from the same screen in the prototype.
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Puts one element of every common kind into each place that holds a project's own content (`data-pd-content`), then
 * asks every rule of Orbito's styles whether it matches one of them. States (`:hover`, `:focus-visible`) count as on.
 */
const reached = (page: Page) =>
  page.evaluate(() => {
    const TAGS =
      'div span p h1 h2 h3 h4 h5 h6 a button input select textarea label ul ol li dl dt dd section article header footer nav main aside figure figcaption small b i em strong code pre kbd summary details img table tr td th form hr'.split(
        ' ',
      );
    const SVG = 'g path text circle rect line'.split(' ');
    // what a rule like `figcaption small` or `li b` needs: every element also holds one of each of these
    const INSIDE = 'span small b i a p li code button'.split(' ');
    // the cards of a board sit under the same panels: one host for each different line of ancestors is enough
    const lineage = (el: Element) => {
      const classes: string[] = [];

      for (let up = el.parentElement; up; up = up.parentElement) classes.push(up.className.toString());

      return classes.join('<');
    };
    const hosts = [
      ...new Map([...document.querySelectorAll('[data-pd-content]')].map((h) => [lineage(h), h])).values(),
    ];
    const probes = hosts.map((host) => {
      const probe = document.createElement('div');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      probe.setAttribute('data-probe', '');
      for (const tag of TAGS) {
        const el = probe.appendChild(document.createElement(tag));

        for (const inner of INSIDE) el.appendChild(document.createElement(inner));
      }
      for (const tag of SVG) svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', tag));
      probe.appendChild(svg);
      host.appendChild(probe);

      return probe;
    });
    const selectors: string[] = [];
    const collect = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) selectors.push(...rule.selectorText.split(/,(?![^(]*\))/));
        else if ('cssRules' in rule) collect((rule as CSSGroupingRule).cssRules);
      }
    };

    for (const sheet of document.styleSheets) {
      try {
        collect(sheet.cssRules);
      } catch {
        /* a sheet from another origin: not Orbito's */
      }
    }
    const found = new Set<string>();

    for (const selector of selectors.map((s) => s.trim()).filter((s) => s.includes('pd-'))) {
      // a state can be on, a pseudo-element belongs to its element: what is left is the element the rule styles
      const plain = selector
        .replace(/::[\w-]+/g, '')
        .replace(/:(hover|focus-visible|focus-within|focus|active|disabled|checked)/g, '')
        .replace(/\s*([>+~])\s*/g, '$1')
        .replace(/(^|[\s>+~])(?=$|[\s>+~])/g, '$1*');

      try {
        for (const el of document.querySelectorAll(plain))
          if (el.closest('[data-probe]') && !el.hasAttribute('data-probe')) found.add(selector);
      } catch {
        /* a selector this check cannot rewrite: skipped */
      }
    }
    for (const probe of probes) probe.remove();

    return { hosts: hosts.length, found: [...found].sort() };
  });

test.describe('Orbito never restyles a screen', () => {
  test('on the board and in the screen details', async ({ page }) => {
    await page.goto('/#/board/plants');
    const card = page.locator('[data-card][data-screen="plant-list"]').first();

    await expect(card.locator('[data-pd-content]')).toBeVisible();
    await card.click();
    await expect(page.locator('.pd-insp__preview [data-pd-content]')).toBeVisible();
    const { hosts, found } = await reached(page);

    expect(hosts).toBeGreaterThan(1);
    expect(found).toEqual([]);
  });

  test('in the prototype', async ({ page }) => {
    await page.goto('/#/s/plant-list');
    await expect(page.locator('.pd-stage__frame[data-pd-content]')).toBeVisible();
    const { hosts, found } = await reached(page);

    expect(hosts).toBe(1);
    expect(found).toEqual([]);
  });

  test('in the catalog of the design system', async ({ page }) => {
    await page.goto('/#/ds/ListItem');
    await expect(page.locator('[data-pd-content]').first()).toBeVisible();
    const { hosts, found } = await reached(page);

    expect(hosts).toBeGreaterThan(0);
    expect(found).toEqual([]);
  });
});

/** How every element of the screen in `host` is drawn: the properties a restyling would change. */
const drawn = (page: Page, host: string) =>
  page.locator(host).evaluate((el) =>
    [...el.querySelectorAll('*')].map((node) => {
      const s = getComputedStyle(node);

      return [
        node.tagName.toLowerCase(),
        s.display,
        s.visibility,
        s.opacity,
        s.color,
        s.backgroundColor,
        s.backgroundImage,
        s.backdropFilter,
        s.filter,
        s.mixBlendMode,
        s.boxShadow,
        s.borderRadius,
        s.fontFamily,
        s.fontSize,
        s.fontWeight,
        s.lineHeight,
        s.letterSpacing,
        s.textTransform,
        s.margin,
        s.padding,
      ].join(' | ');
    }),
  );

test('a screen is drawn the same on the board, in the screen details and in the prototype', async ({ page }) => {
  // a screen with frosted glass, gradients and shadows: the effects a shortcut would be tempted to drop
  const id = 'plant-detail';

  await page.goto(`/#/s/${id}`);
  await expect(page.locator('.pd-stage__frame[data-pd-content]')).toBeVisible();
  const prototype = await drawn(page, '.pd-stage__frame[data-pd-content]');

  expect(prototype.some((line) => line.includes('blur('))).toBe(true);
  await page.goto('/#/board/plants');
  const card = page.locator(`[data-card][data-screen="${id}"]`).first();

  await expect(card.locator('[data-pd-content]')).toBeVisible();
  expect(await drawn(page, `[data-card][data-screen="${id}"] [data-pd-content]`)).toEqual(prototype);
  await card.click();
  await expect(page.locator('.pd-insp__preview [data-pd-content]')).toBeVisible();
  expect(await drawn(page, '.pd-insp__preview [data-pd-content]')).toEqual(prototype);
});

test('a screen starts from the same plain text wherever it is shown, never from the panel around it', async ({
  page,
}) => {
  // what an element inherits when the design sets nothing itself
  const inherited = (host: string) =>
    page
      .locator(host)
      .first()
      .evaluate((el) => {
        const s = getComputedStyle(el);

        return [
          s.color,
          s.fontFamily,
          s.fontSize,
          s.fontWeight,
          s.fontStyle,
          s.lineHeight,
          s.letterSpacing,
          s.wordSpacing,
          s.textTransform,
          s.textAlign,
          s.textIndent,
          s.textShadow,
          s.whiteSpace,
          s.wordBreak,
          s.overflowWrap,
        ].join(' | ');
      });

  await page.goto('/#/s/plant-list');
  await expect(page.locator('.pd-stage__frame[data-pd-content]')).toBeVisible();
  const prototype = await inherited('.pd-stage__frame[data-pd-content]');

  await page.goto('/#/board/plants');
  const card = page.locator('[data-card][data-screen="plant-list"]').first();

  await expect(card.locator('[data-pd-content]')).toBeVisible();
  expect(await inherited('[data-card] [data-pd-content]')).toBe(prototype);
  await card.click();
  await expect(page.locator('.pd-insp__preview [data-pd-content]')).toBeVisible();
  expect(await inherited('.pd-insp__preview [data-pd-content]')).toBe(prototype);
  await page.goto('/#/ds/ListItem');
  await expect(page.locator('[data-pd-content]').first()).toBeVisible();
  expect(await inherited('[data-pd-content]')).toBe(prototype);
});
