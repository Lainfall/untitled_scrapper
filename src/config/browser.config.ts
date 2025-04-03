import { isDev } from "./app.config.ts";

const DEBUG_PORT: number = parseInt(Deno.env.get("REMOTE_DEBUG_PORT")!);

export const BROWSER_CONFIG = {
  REMOTE_DEBUG_PORT: DEBUG_PORT,
  REMOTE_DEBUG_URL: `http://127.0.0.1:${DEBUG_PORT}`,
  LAUNCH_OPTIONS: {
    headless: !isDev,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  },
};
