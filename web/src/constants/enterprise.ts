/**
 * Allowed Enterprise Artist IDs
 * Only artist IDs in this array are allowed to create Enterprise salons
 * Add artist IDs here after manual agreement and payment setup
 */
export const ALLOWED_ENTERPRISE_ARTIST_IDS: string[] = [
  // Add allowed artist IDs here
  "5cf5ecc2-af3e-4bf5-af4b-92e0d78cc713"
  // Example: '123e4567-e89b-12d3-a456-426614174000'
];

/**
 * Instagram URL for Enterprise contact
 */
export const ENTERPRISE_CONTACT_INSTAGRAM = 'https://www.instagram.com/smartermin';

/**
 * Check if an artist ID is allowed to create Enterprise salons
 */
export function isEnterpriseArtistAllowed(artistId: string | null | undefined): boolean {
  if (!artistId) return false;
  return ALLOWED_ENTERPRISE_ARTIST_IDS.includes(artistId);
}

/**
 * Check if current user (artist) is allowed to create Enterprise salons
 */
export function isCurrentUserEnterpriseAllowed(userArtistId: string | null | undefined): boolean {
  return isEnterpriseArtistAllowed(userArtistId);
}
