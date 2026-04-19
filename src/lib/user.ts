/**
 * Get the local asset URL for a given avatar index.
 * Avatars are stored in src/assets/avatars/{1-9}.png
 */
export function getAvatarUrl(index: string | number | undefined): string {
  // Fallback to avatar 1 if index is invalid or missing
  const i = index ? String(index) : '1';
  
  // Verify it's between 1 and 9
  const safeIndex = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(i) ? i : '1';
  
  // Use Vite's dynamic asset loading
  // Note: path is relative to this file (src/lib/user.ts)
  return new URL(`../assets/avatars/${safeIndex}.png`, import.meta.url).href;
}
