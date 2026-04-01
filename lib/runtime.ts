const LOCAL_DATABASE_PATTERN = /(^|@)(localhost|127\.0\.0\.1)(:|\/|$)/i;

export function hasReachableDatabaseUrl(databaseUrl: string | undefined | null) {
  if (!databaseUrl) {
    return false;
  }

  return !LOCAL_DATABASE_PATTERN.test(databaseUrl);
}
