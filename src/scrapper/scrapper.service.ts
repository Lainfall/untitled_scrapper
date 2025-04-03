import puppeteer, { Browser, ElementHandle, Page } from "puppeteer";
import { APP_CONFIG } from "../config/app.config.ts";
import { LoggerService } from "../core/logging/logger.service.ts";
import { GameInfo } from "./data/game.interface.ts";
import { IScrapperService } from "./scrapper.interface.ts";

export class ScrapperService implements IScrapperService {
  private logger: LoggerService;
  private information: GameInfo[] = [];
  private favoriteGames: { id: number; name: string; chance: number }[] = [
    { id: 103, name: "Fortune Rabbit", chance: 0 },
    { id: 17, name: "Fortune Tiger", chance: 0 },
    { id: 7, name: "Fortune Ox", chance: 0 },
  ];

  constructor(logger: LoggerService) {
    this.logger = logger;
  }

  async getInformation(browser: Browser): Promise<GameInfo[]> {
    const page = await browser.newPage();
    try {
      await this.goToSite(page, APP_CONFIG.DEFAULT_URL!);
      await this.selectTab(page);
      const cards = await this.getAllCards(page);
      this.information = await this.getAllCardsInfo(cards);
      this.logger.log(`📊 Successfully scraped ${this.information.length} game entries.`);
      return this.information;
    } catch (error) {
      this.logger.error("Error during scraping:", error);
      return [];
    } finally {
      await page.close();
    }
  }

  private async goToSite(page: Page, url: string): Promise<void> {
    this.logger.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "load" });
    await page.setViewport({ width: 1080, height: 1024 });
  }

  private async selectTab(page: Page): Promise<void> {
    await page.$eval("body", (body: HTMLBodyElement) => {
      (body.querySelectorAll(".game-tab")[1] as HTMLDivElement).click();
    });
  }

  private async getAllCards(page: Page): Promise<ElementHandle<Element>[]> {
    return await page.$$(".game-card");
  }

  private async getAllCardsInfo(
    cards: ElementHandle<Element>[],
  ): Promise<GameInfo[]> {
    const info: GameInfo[] = [];

    for (const element of cards) {
      const informationElements = await Promise.all([
        element.$(".display-chance"),
        element.$("img"),
        element.$(".pt-2"),
      ]);

      if (
        !informationElements[0] ||
        !informationElements[1] ||
        !informationElements[2]
      ) {
        this.logger.warn("Could not extract all information from a game card.");
        continue;
      }

      try {
        const [chanceElement, imgElement, idElement] = informationElements;
        const chanceText = await chanceElement!.evaluate((el) => el.innerHTML);
        const imgSrc = await imgElement!.evaluate((el) => el.src);
        const idText = await idElement!.evaluate(
          (el) => el.querySelector("b")!.innerHTML,
        );

        const chance = Number.parseInt(
          chanceText.split(">").pop()?.split("%").shift() || "0",
        );
        const id = Number.parseInt(idText);

        info.push({ id, chance, img: imgSrc, name: "Unknown" }); // Name might be extractable if needed
      } catch (error) {
        this.logger.error("Error extracting info from card element:", error);
      }
    }

    return info;
  }
}