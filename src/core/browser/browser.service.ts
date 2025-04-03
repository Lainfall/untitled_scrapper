import puppeteer, { Browser, ConnectOptions, LaunchOptions } from "puppeteer";
import { BROWSER_CONFIG } from "../../config/browser.config.ts";
import { LoggerService } from "../logging/logger.service.ts";
import { IBrowserService } from "./browser.interface.ts";

export class BrowserService implements IBrowserService {
  private browser: Browser | null = null;
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  async launch(): Promise<Browser> {
    // ! Rework launch from puppeteer internal browser
    if (this.browser?.connected) {
      this.logger.log("Browser instance already running.");
      return this.browser;
    }

    const options: LaunchOptions = {
      ...BROWSER_CONFIG.LAUNCH_OPTIONS,
      args: [
        ...(BROWSER_CONFIG.LAUNCH_OPTIONS.args || []),
        `--remote-debugging-port=${BROWSER_CONFIG.REMOTE_DEBUG_PORT}`,
      ],
    };

    try {
      this.browser = await puppeteer.launch(options);
      this.logger.log("🚀 Launched new browser instance in production mode.");
      return this.browser;
    } catch (error) {
      this.logger.error("Failed to launch browser:", error);
      Deno.exit(1);
    }
  }

  async connect(): Promise<Browser> {
    if (this.browser?.connected) {
      this.logger.log("Browser instance already running.");
      return this.browser;
    }

    try {
      const browserURL = BROWSER_CONFIG.REMOTE_DEBUG_URL;
      this.logger.log(`🛠️ Connecting to existing browser at ${browserURL}`);
      this.browser = await puppeteer.connect({
        browserURL: browserURL,
        defaultViewport: null,
      });
      this.logger.log("🛠️ Successfully connected to existing browser.");
      return this.browser;
    } catch (error) {
      this.logger.error("Failed to connect to existing browser:", error);
      Deno.exit(1);
    }
  }

  async close(browser: Browser | null): Promise<void> {
    if (browser?.connected) {
      await browser.close();
      this.logger.log("🛑 Browser instance closed.");
    } else if (browser) {
      this.logger.warn("Browser instance was not connected or already closed.");
    }
  }
}
