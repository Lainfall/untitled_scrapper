import { Browser } from "puppeteer";

export interface IBrowserService {
  launch(): Promise<Browser>;
  connect(): Promise<Browser>;
  close(browser: Browser | null): Promise<void>;
}