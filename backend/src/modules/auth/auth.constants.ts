export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const TEMP_TOKEN_COOKIE = 'temp_token';

// TTL values in seconds for Redis storage
export const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days
export const TEMP_TOKEN_TTL = 5 * 60; // 5 minutes

export const GRACE_PERIOD_TTL = 24 * 60 * 60; // 24 hours

// TTL values in milliseconds for cookies
export const ACCESS_TOKEN_MAX_AGE = ACCESS_TOKEN_TTL * 1000;
export const REFRESH_TOKEN_MAX_AGE = REFRESH_TOKEN_TTL * 1000;
export const TEMP_TOKEN_MAX_AGE = TEMP_TOKEN_TTL * 1000;
