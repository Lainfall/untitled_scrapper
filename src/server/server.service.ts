import { type Route, route } from "@std/http/unstable-route";
import { serveDir } from "@std/http/file-server";
import { ScrapperService } from "../scrapper/scrapper.service.ts";
import { APP_CONFIG } from "../config/app.config.ts";
import { LoggerService } from "../core/logging/logger.service.ts";

export class ServerService {
  private scrapperService: ScrapperService;
  private logger: LoggerService;
  private latestData: { id: number; chance: number; img: string }[] = [];

  constructor(scrapperService: ScrapperService, logger: LoggerService) {
    this.scrapperService = scrapperService;
    this.logger = logger;
  }

  updateData(data: { id: number; chance: number; img: string }[]): void {
    this.latestData = data;
  }

  getRoutes(): Route[] {
    return [
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/" }),
        handler: (req: Request) => serveDir(req, {}),
      },
      {
        method: ["GET"],
        pattern: new URLPattern({ pathname: "/data" }),
        handler: (_req: Request) =>
          new Response(JSON.stringify(this.latestData), {
            status: 200,
            headers: {
              "content-type": "application/json",
            },
          }),
      },
    ];
  }

  defaultHandler(_req: Request): Response {
    return new Response("Not found", { status: 404 });
  }

  start(): void {
    this.logger.log(
      `🚀 Starting HTTP server on http://localhost:${APP_CONFIG.SERVER_PORT}`,
    );
    Deno.serve(
      { port: APP_CONFIG.SERVER_PORT },
      route(this.getRoutes(), this.defaultHandler),
    );
  }
}
