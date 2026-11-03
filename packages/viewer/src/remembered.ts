/**
 * Small choices remembered on this computer: a switch, a width, a name. They live in the browser's storage, which can be
 * off (private mode, blocked by a policy); then a choice lasts until the page reloads, and nothing else changes.
 */
export const recall = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const remember = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice lasts until reload */
  }
};
