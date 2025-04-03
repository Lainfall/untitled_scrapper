export const isDev = Deno.env.get("ENVIRONMENT") ? true : false;

export const APP_CONFIG = {
  DB_PATH: Deno.env.get("DB_PATH"),
  DEFAULT_URL: Deno.env.get("DEFAULT_URL"),
  SCRAPE_INTERVAL_DEFAULT: parseInt(Deno.env.get("SCRAPE_INTERVAL")!),
  SERVER_PORT: parseInt(Deno.env.get("SERVER_PORT")!),
};
