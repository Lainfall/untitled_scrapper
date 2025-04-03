import { Browser, ElementHandle, Page } from "puppeteer";
import { APP_CONFIG } from "../config/app.config.ts";
import { LoggerService } from "../core/logging/logger.service.ts";
import { GameInfo } from "./data/game.interface.ts";
import { IScrapperService } from "./scrapper.interface.ts";
import { DatabaseService } from "../core/database/database.service.ts";

export class ScrapperService implements IScrapperService {
  private logger: LoggerService;
  private database: DatabaseService;
  private gameInfo: GameInfo[] = [];
  // ! Move this for somewhere else, like the future frontend
  // private favoriteGames: { id: number; name: string; chance: number }[] = [
  //   { id: 103, name: "Fortune Rabbit", chance: 0 },
  //   { id: 17, name: "Fortune Tiger", chance: 0 },
  //   { id: 7, name: "Fortune Ox", chance: 0 },
  // ];

  constructor(logger: LoggerService, database: DatabaseService) {
    this.logger = logger;
    this.database = database;
  }

  saveGameInfoToDatabase(gameInfos: GameInfo[]): void {
    this.logger.log("💾 Saving scraped game information to the database...");
    const db = this.database.getDb();

    try {
      // ! Move this to be populated while setting up the database
      const insertAppStmt = db.prepare(
        "INSERT OR IGNORE INTO apps (game_id, name) VALUES (?, ?)",
      );
      const selectAppIdStmt = db.prepare(
        "SELECT id FROM apps WHERE game_id = ?",
      );
      const insertAppDataStmt = db.prepare(
        "INSERT INTO app_data (chance, date, game_id) VALUES (?, ?, ?)",
      );

      for (const gameInfo of gameInfos) {
        try {
          insertAppStmt.run(gameInfo.id, gameInfo.name);

          const appIdResult = selectAppIdStmt.value<[number]>(gameInfo.id);
          const internalAppId = appIdResult?.[0];

          if (internalAppId) {
            insertAppDataStmt.run(gameInfo.chance, Date.now(), internalAppId);
          } else {
            this.logger.warn(
              `Could not retrieve internal app ID for game ID: ${gameInfo.id}`,
            );
          }
        } catch (error) {
          this.logger.error(
            `Error saving data for game ${gameInfo.name} (ID: ${gameInfo.id}):`,
            error,
          );
        }
      }

      insertAppStmt.finalize();
      selectAppIdStmt.finalize();
      insertAppDataStmt.finalize();

      this.logger.log("✅ Scraped game information saved to the database.");
    } catch (error) {
      this.logger.error(
        "Error preparing or executing database statements:",
        error,
      );
    }
  }

  async getInformation(browser: Browser): Promise<GameInfo[]> {
    const page = await browser.newPage();
    try {
      await this.goToSite(page, APP_CONFIG.DEFAULT_URL!);
      await this.selectTab(page);
      const cards = await this.getAllCards(page);
      this.gameInfo = await this.getAllCardsInfo(cards);
      this.logger.log(
        `📊 Successfully scraped ${this.gameInfo.length} game entries.`,
      );
      this.saveGameInfoToDatabase(this.gameInfo);
      return this.gameInfo;
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
