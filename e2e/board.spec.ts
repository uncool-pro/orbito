import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

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
  test('a click on a card opens the prototype on that screen', async ({ page }) => {
    await openBoard(page);
    const { x, y } = await centre(page, 'plant-list');

    await page.mouse.click(x, y);
    await expect(page).toHaveURL(/#\/s\/plant-list$/);
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
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(/#\/board\/plants$/);
  });
});

test('the whole tour runs without an error in the console', async ({ page }) => {
  const errors: string[] = [];

  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  for (const address of ['#/board/plants', '#/flows/plants', '#/s/plant-list', '#/ds', '#/ds/health', '#/skills']) {
    await page.goto(`/${address}`);
    await expect(page.locator('.pd-top')).toBeVisible();
  }
  expect(errors).toEqual([]);
});
