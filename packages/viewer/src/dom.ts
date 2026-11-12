/**
 * True when a key press belongs to something the person is typing in (a field, a dropdown, editable text): shortcuts of
 * the board and of the shell leave those keys alone.
 */
export const isTextField = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
