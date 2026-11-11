import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const DEMO = resolve(dirname(fileURLToPath(import.meta.url)), '../demo');

const cardOf = (page: Page, id: string) => page.locator(`[data-card][data-screen="${id}"]`).first();

const openBoard = async (page: Page, address = '#/board/plants') => {
  await page.goto(`/${address}`);
  await expect(cardOf(page, 'plant-list')).toBeVisible();
};

const centre = async (page: Page, id: string) => {
  const box = await cardOf(page, id).boundingBox();

  if (!box) throw new Error(`card ${id} is not on the board`);

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
};

test.describe('board', () => {
  test('a click on a card selects the screen and shows its details, without leaving the board', async ({ page }) => {
    await openBoard(page);
    const { x, y } = await centre(page, 'plant-list');

    await page.mouse.click(x, y);
    await expect(page).toHaveURL(/#\/board\/plants$/);
    await expect(page.locator('.pd-insp__head')).toContainText('List');
  });

  test('▶ above a card and a double click start the prototype on that screen', async ({ page }) => {
    await openBoard(page);
    await cardOf(page, 'plant-list').locator('.pd-card__play').click();
    await expect(page).toHaveURL(/#\/s\/plant-list$/);
    await openBoard(page);
    const { x, y } = await centre(page, 'plant-detail');

    await page.mouse.dblclick(x, y);
    await expect(page).toHaveURL(/#\/s\/plant-detail$/);
  });

  test('dev mode measures a screen on the board and shows its code on the right', async ({ page }) => {
    await openBoard(page);
    await page.locator('.pd-devtoggle').click();
    const { x, y } = await centre(page, 'plant-list');

    await page.mouse.move(x, y);
    await expect(page.locator('.pd-measure__box')).toBeVisible();
    await page.mouse.click(x, y);
    await expect(page.locator('.pd-code__text')).toContainText('defineScreen');
  });

  test('the wheel scrolls a clicked screen, and moves the board again after Esc', async ({ page }) => {
    await openBoard(page);
    const card = cardOf(page, 'plant-list');
    const scroller = card.locator('[data-pd-scroll]').first();
    const { x, y } = await centre(page, 'plant-list');

    await page.mouse.click(x, y);
    await expect(card).toHaveClass(/pd-card--active/);
    await page.mouse.wheel(0, 200);
    await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    // the board stayed where it was
    expect(Math.round((await centre(page, 'plant-list')).y)).toBe(Math.round(y));
    await page.keyboard.press('Escape');
    await expect(card).not.toHaveClass(/pd-card--active/);
    await page.mouse.wheel(0, 120);
    await expect.poll(async () => Math.round((await centre(page, 'plant-list')).y)).toBeLessThan(Math.round(y));
  });

  test('the ways out under a card name the menu once instead of every tab', async ({ page }) => {
    await openBoard(page);
    // a screen with ways out to other features: the arrow under it names them on hover
    const key = await page.locator('[data-stub]').first().getAttribute('data-stub');
    const box = (await page.locator(`[data-card="${key}"]`).boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // the highlight comes once the pointer rests on the card, not while it only passes
    await expect(page.locator('.pd-stub.is-on text').first()).toBeVisible();
    const labels = await page.locator('.pd-stub.is-on text').allTextContents();

    expect(labels.length).toBeGreaterThan(0);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('the comment button above a card opens the comments in a bubble next to it; Esc closes only the bubble', async ({
    page,
  }) => {
    await openBoard(page);
    await cardOf(page, 'plant-detail').locator('.pd-card__comment').click();
    const bubble = page.getByRole('dialog', { name: 'Comments on Detail' });

    await expect(bubble).toBeVisible();
    await expect(bubble.locator('textarea')).toBeFocused();
    // next to the screen, not over it
    const card = (await cardOf(page, 'plant-detail').locator('.pd-card__frame').boundingBox())!;
    const box = (await bubble.boundingBox())!;

    expect(box.x >= card.x + card.width || box.x + box.width <= card.x).toBe(true);
    await page.keyboard.press('Escape');
    await expect(bubble).toHaveCount(0);
    await expect(page.locator('.pd-insp__head')).toContainText('Detail');
  });

  test('a comment Claude writes into comments/ shows on the board, also after a reload', async ({ page }) => {
    const folder = join(DEMO, 'comments/watered');
    const bubble = page.getByRole('dialog', { name: /^Comments on/ });

    expect(existsSync(folder)).toBe(false);
    await openBoard(page);
    try {
      mkdirSync(folder);
      writeFileSync(
        join(folder, 'e2e-claude.md'),
        '---\nstatus: doing\nauthor: Claude\ncreated: 2026-11-04T10:00:00Z\n---\nThe name field comes first\n',
      );
      const button = cardOf(page, 'watered').locator('.pd-card__comment');

      await expect(button).toHaveText('1');
      await page.reload();
      await button.click();
      await expect(bubble).toContainText('The name field comes first');
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  test('the Design system tab opens the catalog, and Project leads back to the board', async ({ page }) => {
    await openBoard(page);
    await page.getByRole('tab', { name: 'Design system' }).click();
    await expect(page).toHaveURL(/#\/ds$/);
    await page.getByRole('tab', { name: 'Project' }).click();
    await expect(page).toHaveURL(/#\/board\/plants$/);
  });

  test('dragging over a card moves the board and opens nothing', async ({ page }) => {
    await openBoard(page);
    const before = await centre(page, 'plant-list');

    await page.mouse.move(before.x, before.y);
    await page.mouse.down();
    await page.mouse.move(before.x + 120, before.y + 60, { steps: 6 });
    await page.mouse.up();
    const after = await centre(page, 'plant-list');

    await expect(page).toHaveURL(/#\/board\/plants$/);
    expect(Math.round(after.x - before.x)).toBe(120);
    expect(Math.round(after.y - before.y)).toBe(60);
  });

  test('the island switches views and keeps the page', async ({ page }) => {
    await openBoard(page);
    const island = page.getByRole('toolbar');

    await island.locator('a').nth(1).click();
    await expect(page).toHaveURL(/#\/flows\/plants$/);
    await island.locator('a').nth(0).click();
    await expect(page).toHaveURL(/#\/board\/plants$/);
    await island.locator('a').nth(2).click();
    await expect(page).toHaveURL(/#\/s\//);
  });

  test('a flow in the left panel opens by its address', async ({ page }) => {
    await openBoard(page);
    await page.locator('.pd-tree__flow', { hasText: 'Add a plant' }).click();
    await expect(page).toHaveURL(/#\/board\/plants\/P2$/);
  });

  test('a second click on the open feature shows the whole page again', async ({ page }) => {
    await openBoard(page, '#/board/plants/P2');
    await page.locator('.pd-tree__flow', { hasText: 'Add a plant' }).click();
    await expect(page).toHaveURL(/#\/board\/plants$/);
  });

  test('the left panel highlights one thing at a time: the open feature, or the screen selected in it', async ({
    page,
  }) => {
    await openBoard(page, '#/board/plants/P1');
    const feature = page.locator('.pd-tree__flow', { hasText: 'Water a plant' });

    await expect(feature).toHaveClass(/is-on/);
    const { x, y } = await centre(page, 'plant-list');

    await page.mouse.click(x, y);
    await expect(page.locator('.pd-tree__screen.is-on')).toHaveCount(1);
    await expect(feature).not.toHaveClass(/is-on/);
    await page.keyboard.press('Escape');
    await expect(feature).toHaveClass(/is-on/);
  });

  test('the comment and play buttons above a card keep one colour, selected or not', async ({ page }) => {
    await openBoard(page);
    const colour = (sel: string) =>
      cardOf(page, 'plant-list')
        .locator(sel)
        .evaluate((el) => getComputedStyle(el).color);
    const before = [await colour('.pd-card__comment'), await colour('.pd-card__play')];
    const { x, y } = await centre(page, 'plant-list');

    expect(before[0]).toBe(before[1]);
    await page.mouse.click(x, y);
    expect([await colour('.pd-card__comment'), await colour('.pd-card__play')]).toEqual(before);
  });

  test('search selects a screen on its own page, without opening the prototype', async ({ page }) => {
    await openBoard(page);
    const search = page.locator('.pd-search__input');

    await search.fill('profile');
    await search.press('Enter');
    await expect(page).toHaveURL(/#\/board\/account$/);
    await expect(page.locator('.pd-insp__open')).toHaveAttribute('href', /#\/s\/profile$/);
  });
});

test.describe('prototype', () => {
  test('a link in a mockup leads to the next screen, and back returns', async ({ page }) => {
    await page.goto('/#/s/plant-list');
    const link = page.locator('[data-pd-to]').first();

    await expect(link).toBeVisible();
    const target = await link.getAttribute('data-pd-to');

    await link.click();
    await expect(page).toHaveURL(new RegExp(`#/s/${target}$`));
    await page.goBack();
    await expect(page).toHaveURL(/#\/s\/plant-list$/);
  });

  test('a mockup with a high z-index stays under the size switch and the island, which keep working', async ({
    page,
  }) => {
    await page.goto('/#/s/plant-list');
    const frame = page.locator('.pd-stage__frame');

    await expect(frame).toBeVisible();
    // a layer inside the mockup over the whole window, above everything it knows (a fixed header or tab bar does this)
    await frame.evaluate((el) => {
      const bar = document.createElement('div');

      bar.style.cssText = 'position:fixed;inset:0;z-index:9999';
      el.appendChild(bar);
    });
    await page.locator('.pd-sizes button').first().click();
    await expect(page.locator('.pd-sizes button').first()).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.pd-island__modes a').first().click();
    await expect(page).toHaveURL(/#\/board/);
  });

  test('an unknown screen shows a way back instead of an empty page', async ({ page }) => {
    await page.goto('/#/s/nope');
    await expect(page.getByText('nope')).toBeVisible();
    await page.locator('.pd-doc a').click();
    await expect(page).toHaveURL(/#\/board/);
  });
});

test.describe('screen details', () => {
  test('a comment is an open change in a file of its own, moved along and removed', async ({ page }) => {
    const folder = join(DEMO, 'comments/watered');
    const bubble = page.getByRole('dialog', { name: /^Comments on/ });
    const comment = bubble.locator('.pd-comment', { hasText: 'Say how much water' });
    const only = () => join(folder, readdirSync(folder)[0]!);

    expect(existsSync(folder)).toBe(false);
    await page.goto('/#/s/watered');
    await page.locator('.pd-commentstoggle').click();
    await bubble.getByPlaceholder('Your name').fill('Test');
    await bubble.getByPlaceholder('What should change on this screen?').fill('Say how much water');
    await bubble.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(comment).toBeVisible();
    expect(readdirSync(folder)).toHaveLength(1);
    expect(readFileSync(only(), 'utf8')).toMatch(
      /^---\nstatus: open\nauthor: Test\ncreated: \d{4}-\d{2}-\d{2}T[\d:]+Z\n---\nSay how much water\n$/,
    );
    // the screen in the prototype shows it waits
    await expect(page.locator('.pd-commentstoggle .pd-count')).toHaveText('1');
    await comment.locator('select').selectOption('done');
    await expect.poll(() => readFileSync(only(), 'utf8')).toContain('status: done');
    await bubble.locator('.pd-bubble__more', { hasText: '1 done' }).click();
    await comment.getByRole('button', { name: 'Remove this comment' }).click();
    await expect(comment).toHaveCount(0);
    expect(existsSync(folder)).toBe(false);
  });

  test('a requirement shows its text from requirements/', async ({ page }) => {
    await page.goto('/#/s/plant-detail');
    const req = page.locator('.pd-req', { hasText: 'REQ-03' });

    await req.locator('summary').click();
    await expect(req).toContainText('Acceptance criteria');
  });

  test('ways out to other features fold into one line', async ({ page }) => {
    await page.goto('/#/s/plant-list');
    const more = page.locator('.pd-insp__more').first();

    await expect(more).toBeVisible();
    await expect(page.locator('.pd-insp__group')).toHaveCount(0);
    await more.click();
    await expect(page.locator('.pd-insp__group').first()).toBeVisible();
  });
});

test.describe('prototype sizes and dev mode', () => {
  test('a phone screen shows on a small, a standard and a large phone', async ({ page }) => {
    await page.goto('/#/s/plant-list');
    const frame = page.locator('.pd-stage__frame > *').first();

    await page.locator('.pd-sizes button', { hasText: 'SE' }).click();
    await expect.poll(async () => await frame.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(375);
    await page.locator('.pd-sizes button', { hasText: 'Pro Max' }).click();
    await expect.poll(async () => await frame.evaluate((el) => (el as HTMLElement).offsetWidth)).toBe(430);
  });

  test('dev mode shows the path, the code and measures without leaving the screen', async ({ page }) => {
    await page.goto('/#/s/plant-list');
    await page.locator('.pd-devtoggle').click();
    await expect(page.locator('.pd-devpath code')).toHaveText('screens/plants/plant-list.screen.tsx');
    await expect(page.locator('.pd-code__text')).toContainText('defineScreen');
    const item = page.locator('.pd-stage__frame [data-pd-to]').first();
    const box = (await item.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.locator('.pd-measure__box')).toBeVisible();
    // a click picks the element to measure from, it does not navigate
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page).toHaveURL(/#\/s\/plant-list$/);
  });
});

test.describe('pages of their own', () => {
  test('the catalog opens from the health pill and leads back to where you were', async ({ page }) => {
    await page.goto('/#/flows/plants');
    await page.locator('.pd-health-pill').click();
    await expect(page).toHaveURL(/#\/ds\/health$/);
    await page.locator('.pd-backbar__link').click();
    await expect(page).toHaveURL(/#\/flows\/plants$/);
  });

  test('Esc leaves the skills map', async ({ page }) => {
    await openBoard(page);
    await page.locator('.pd-topnav').click();
    await expect(page).toHaveURL(/#\/skills$/);
    // the address changes before the page has drawn and started listening for Esc
    await expect(page.locator('.pd-backbar')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/#\/board\/plants$/);
  });
});

test('the whole tour runs without an error in the console', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', (e) => errors.push(String(e)));
  // a failed request is reported with its address below, so the console line without one is skipped
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(m.text());
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto('/#/flows/plants');
  // the feature map too: the switch is remembered, so every later visit to the page's flows shows it
  await page.locator('.pd-mapswitch button', { hasText: 'Features' }).click();
  await expect(page.locator('.pd-fmap__box').first()).toBeVisible();
  for (const address of ['#/board/plants', '#/flows/plants', '#/s/plant-list', '#/ds', '#/ds/health', '#/skills']) {
    await page.goto(`/${address}`);
    await expect(page.locator('.pd-top')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test.describe('the first time', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('says how Orbito works, asks for a name once and signs comments with it', async ({ page }) => {
    await page.goto('/#/board/plants');
    const welcome = page.getByRole('dialog', { name: 'Welcome to Orbito' });

    await expect(welcome).toContainText('agent first');
    // git's name may arrive as a suggestion at the very moment the name is typed: type until the field holds the name
    const name = welcome.getByRole('textbox');

    await expect(async () => {
      await name.fill('Ola');
      await expect(name).toHaveValue('Ola', { timeout: 500 });
    }).toPass();
    await welcome.getByRole('button', { name: 'Start' }).click();
    await expect(welcome).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.pd-top')).toBeVisible();
    await expect(welcome).toHaveCount(0);
    await page.goto('/#/s/plant-list');
    await page.locator('.pd-commentstoggle').click();
    await expect(page.getByRole('dialog', { name: /^Comments on/ })).toContainText('Signed as Ola');
  });
});

test('the pages list shows five and a half pages, as in Figma, and scrolls for more', async ({ page }) => {
  await openBoard(page);
  const list = page.locator('.pd-pages__list');

  // the demo has three pages: add copies of a row to stand for a project with many
  await list.evaluate((ul) => {
    for (let i = 0; i < 6; i++) ul.appendChild(ul.firstElementChild!.cloneNode(true));
  });
  const { shown, full, row } = await list.evaluate((ul) => ({
    shown: ul.clientHeight,
    full: ul.scrollHeight,
    row: (ul.firstElementChild as HTMLElement).offsetHeight,
  }));

  expect(shown).toBe(5.5 * row + 5);
  expect(full).toBeGreaterThan(shown);
});

test('the pages and the features scroll on their own: scrolling a long feature list keeps the pages in view', async ({
  page,
}) => {
  await openBoard(page);
  const tree = page.locator('.pd-drawer__body--project > .pd-tree');

  // the demo has a few features: add copies of its rows to stand for a project with many
  await tree.evaluate((nav) => {
    const level = nav.querySelector('ul')!;

    for (let i = 0; i < 40; i++) level.appendChild(level.firstElementChild!.cloneNode(true));
  });
  await tree.hover();
  await page.mouse.wheel(0, 4000);
  await expect.poll(() => tree.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  // the panel itself did not move: the pages are where they were, in view
  expect(await page.locator('.pd-drawer__body').evaluate((el) => el.scrollTop)).toBe(0);
  await expect(page.locator('.pd-pages')).toBeInViewport();
});

test('the pages list grows and shrinks by its bottom edge, and keeps its height', async ({ page }) => {
  await openBoard(page);
  const list = page.locator('.pd-pages__list');
  const grip = page.locator('.pd-pages__grip');
  const height = () => list.evaluate((ul) => Math.round(ul.getBoundingClientRect().height));
  const before = await height();

  // the demo has three pages: drag the edge up to two rows
  await page.locator('.pd-pages').hover();
  const box = (await grip.boundingBox())!;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y - 60, { steps: 5 });
  await page.mouse.up();
  const two = await height();

  expect(two).toBeLessThan(before);
  expect(two).toBe(65);
  await page.reload();
  await expect.poll(height).toBe(65);
  // the keyboard does the same, one row at a time, up to all the pages
  await grip.focus();
  await page.keyboard.press('ArrowDown');
  await expect.poll(height).toBe(await list.evaluate((ul) => ul.scrollHeight));
  await page.evaluate(() => localStorage.removeItem('pd.pagesHeight'));
});
