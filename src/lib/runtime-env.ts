import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getRuntimeEnv(): CloudflareEnv {
  return getCloudflareContext().env;
}
