import { readFileSync } from 'node:fs';
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

  test('an unknown screen shows a way back instead of an empty page', async ({ page }) => {
    await page.goto('/#/s/nope');
    await expect(page.getByText('nope')).toBeVisible();
    await page.locator('.pd-doc a').click();
    await expect(page).toHaveURL(/#\/board/);
  });
});

test.describe('screen details', () => {
  test('a comment is saved in the project and leaves it when done', async ({ page }) => {
    const file = join(DEMO, '.orbito/comments.json');
    const before = readFileSync(file, 'utf8');

    await page.goto('/#/s/plant-list');
    await page.getByPlaceholder('What should change on this screen?').fill('Too many plants at once');
    await page.getByPlaceholder('Your name').fill('Test');
    await page.getByRole('button', { name: 'Add', exact: true }).click();
    await expect(page.locator('.pd-comment', { hasText: 'Too many plants at once' })).toBeVisible();
    expect(JSON.parse(readFileSync(file, 'utf8'))['plant-list'][0]).toMatchObject({ text: 'Too many plants at once', author: 'Test' });
    await page.locator('.pd-comment', { hasText: 'Too many plants at once' }).getByRole('button').click();
    await expect(page.locator('.pd-comment', { hasText: 'Too many plants at once' })).toHaveCount(0);
    expect(readFileSync(file, 'utf8')).toBe(before);
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
    await expect.poll(async () => (await frame.evaluate((el) => (el as HTMLElement).offsetWidth))).toBe(375);
    await page.locator('.pd-sizes button', { hasText: 'Pro Max' }).click();
    await expect.poll(async () => (await frame.evaluate((el) => (el as HTMLElement).offsetWidth))).toBe(430);
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
