import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getD1() {
  const { env } = await getCloudflareContext();
  return env.DB;
}

export async function getR2() {
  const { env } = await getCloudflareContext();
  return env.R2;
}
