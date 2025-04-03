import { Browser } from "puppeteer";
import { GameInfo } from "./data/game.interface.ts";

export interface IScrapperService {
  getInformation(browser: Browser): Promise<GameInfo[]>;
}
