interface CloudflareEnv {
  DB: D1Database;
  R2: R2Bucket;
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}
