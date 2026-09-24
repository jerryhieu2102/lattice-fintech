export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = { "x-lattice-request": "1" };
  if (body && !(body instanceof FormData))
    headers["Content-Type"] = "application/json";
  const r = await fetch("/api/v1" + path, {
    method,
    credentials: "same-origin",
    headers,
    body:
      body instanceof FormData
        ? body
        : body === undefined
          ? undefined
          : JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : JSON.stringify(data.detail),
    );
  return data as T;
}
export const money = (value: number, currency = "EUR") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
export const percent = (value: number) => `${Math.round(value * 100)}%`;
export const label = (value: string) =>
  value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());

// Fixed demo valuation only. This is not a live FX quote.
export const demoEur = (amount: number, currency: string) =>
  amount * ({ EUR: 1, USD: 0.9, GBP: 1.17, VND: 0.000036 }[currency] ?? 0);
