import { parseArgs } from "@std/cli/parse-args";
import { APP_CONFIG } from "../config/app.config.ts";
import { LoggerService } from "../core/logging/logger.service.ts";

export interface ParsedArgs {
  help?: boolean;
  h?: boolean;
  browser?: string;
  b?: string;
  update?: string | number;
  u?: string | number;
}

export class CliService {
  private args: ParsedArgs;
  private logger: LoggerService;

  constructor(logger: LoggerService) {
    this.args = parseArgs(Deno.args, {
      boolean: ["help"],
      string: ["browser", "update"],
      alias: {
        browser: "b",
        update: "u",
        help: "h",
      },
      default: {
        browser: "chromium",
        update: APP_CONFIG.SCRAPE_INTERVAL_DEFAULT,
      },
    });
    this.logger = logger;
  }

  getArgs(): ParsedArgs {
    return this.args;
  }

  isHelpNeeded(): boolean {
    return !!this.args.help || !!this.args.h;
  }

  writeHelpMessage(): void {
    const helpText = `
Como usar:

-h, --help             Para exibir essa mensagem de ajuda

-u, --update=<seconds> Para trocar o tempo padrão de atualização (em segundos)
                       Exemplo: --update=120

-b, --browser=<name>   Para trocar o browser padrão que será usado (chromium, chrome, edge, brave)
                       Exemplo: --browser=chrome
                       \n`;
    console.log(helpText);
  }

  writeOptionsMessage(): string {
    const { columns } = Deno.consoleSize();
    return `
Slot PG data miner
q | ctrl+c) Fecha o programa e suas dependências
u) Força a atualização das informações no servidor
o) Abre o browser padrão no link da aplicação
${"▔".repeat(columns)}\n`;
  }

  writeOutput(): void {
    console.log(this.writeOptionsMessage);
  }
}
