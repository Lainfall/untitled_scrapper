export {};

declare global {
  namespace Deno {
    interface Env {
      get(key: "ENVIRONMENT"): "development" | "production" | undefined;
    }
  }
}
