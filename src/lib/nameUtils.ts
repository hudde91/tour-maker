/**
 * Shortens a full name to first name + last initial.
 * e.g. "John Smith" → "John S."
 * If only one name part, returns it as-is.
 */
export const shortenName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  return `${firstName} ${lastInitial}.`;
};
