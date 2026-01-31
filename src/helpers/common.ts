/**
 * Generates a random alphanumeric ID of specified length
 * @param length - The length of the ID to generate (default: 8)
 * @returns A random alphanumeric string
 */
export const generateRandomId = (length = 8): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
