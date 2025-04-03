// util/time.util.ts
export function delay(seconds: number = 10): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}