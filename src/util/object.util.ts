export function convertArrayToObject<T, K extends keyof T>(
  key: K,
  array: Array<T>,
): Record<string | number | symbol, T> {
  return array.reduce((acc: Record<string | number | symbol, T>, curr) => {
    const propertyKey = curr[key];

    if (
      typeof propertyKey !== "string" &&
      typeof propertyKey !== "number" &&
      typeof propertyKey !== "symbol"
    ) {
      throw new Error("Key must be a string, number, or symbol");
    }

    acc[propertyKey] = curr;
    return acc;
  }, {});
}