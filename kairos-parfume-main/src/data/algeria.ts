// Validation téléphone et formatage DZD. Les wilayas et frais sont gérés en base.
export const PHONE_REGEX = /^(?:(?:\+213|00213|0)[567]\d{8})$/;

export function normalizePhone(input: string): string {
  return input.replace(/[\s.-]/g, '');
}

export function isValidDzPhone(input: string): boolean {
  return PHONE_REGEX.test(normalizePhone(input));
}

export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(amount) + ' DA';
}
