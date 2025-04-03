// main.ts
import { BrowserService } from "./core/browser/browser.service.ts";
import { CliService } from "./cli/cli.service.ts";
import { ScrapperService } from "./scrapper/scrapper.service.ts";
import { ServerService } from "./server/server.service.ts";
import { LoggerService } from "./core/logging/logger.service.ts";
import { APP_CONFIG } from "./config/app.config.ts";
import { isDev } from "./config/app.config.ts";
import { Browser } from "puppeteer";

console.log(isDev);
async function main() {
  const logger = new LoggerService();
  const cliService = new CliService(logger);
  const browserService = new BrowserService(logger);
  const scrapperService = new ScrapperService(logger);
  const serverService = new ServerService(scrapperService, logger);

  if (cliService.isHelpNeeded()) {
    cliService.writeHelpMessage();
    Deno.exit(0);
  }

  cliService.writeOptionsMessage();

  let browser: Browser;

  if (isDev) {
    browser = await browserService.connect();
  } else {
    browser = await browserService.launch();
  }

  // ! Rewoooooork
  async function scrapeAndServe() {
    logger.log("🔄 Starting data scraping...");
    const data = await scrapperService.getInformation(browser);
    serverService.updateData(
      data as {
        id: number;
        chance: number;
        img: string;
      }[],
    );
    logger.log("✅ Data scraping complete.");
  }

  // Initial scrape
  await scrapeAndServe();

  // Set up interval for periodic scraping
  const updateInterval = typeof cliService.getArgs().update != typeof undefined
    ? cliService.getArgs().update!
    : APP_CONFIG.SCRAPE_INTERVAL_DEFAULT!;

  logger.log(`⏱️ Setting scrape interval to ${updateInterval} seconds.`);
  setInterval(scrapeAndServe, 60 * 1000);

  // Start the server
  serverService.start();

  // Handle shutdown signals
  Deno.addSignalListener("SIGINT", async () => {
    logger.log("👋 Shutting down...");
    await browserService.close(browser);
    logger.log("👋 Shutdown complete.");
    Deno.exit(0);
  });
}

if (import.meta.main) {
  await main();
}
