/**
 * API seam — single place for the backend developer to plug in.
 *
 * Today: all calls fall through to localStorage via the other seam modules
 *        (auth.ts, clients.ts, scenarioManager.ts, workingScenario.ts).
 * Tomorrow: replace the body of `apiFetch` with a real `fetch(BASE_URL + path, ...)`
 *           call against your hosted API and the rest of the app keeps working.
 *
 * The four seam modules are the ONLY files that read or write user data.
 * Migrating to the cloud means editing those files — not the 40+ components
 * that consume them.
 */

// TODO(backend): set this from your build env, e.g.
//   const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const BASE_URL = "";

export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  // Reserved for future use (auth headers, abort signals, etc.)
  signal?: AbortSignal;
}

/**
 * Placeholder network helper. Currently unused — the seam modules still talk
 * to localStorage directly. When the backend is ready:
 *
 *   1. Set BASE_URL above (or read from env).
 *   2. Implement the body of this function with a real `fetch()`.
 *   3. In each seam module (auth.ts / clients.ts / scenarioManager.ts /
 *      workingScenario.ts), swap the `// TODO(backend):` blocks for
 *      `await apiFetch(...)` calls.
 *
 * Keep the public function signatures of the seam modules unchanged so no
 * components need to be touched.
 */
export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  // TODO(backend): replace with real network call.
  // Example:
  //   const res = await fetch(`${BASE_URL}${path}`, {
  //     method: opts.method ?? "GET",
  //     credentials: "include",                    // session cookie
  //     headers: { "Content-Type": "application/json" },
  //     body: opts.body ? JSON.stringify(opts.body) : undefined,
  //     signal: opts.signal,
  //   });
  //   if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  //   return (await res.json()) as T;
  throw new Error(
    `apiFetch is not wired up yet. Path: ${opts.method ?? "GET"} ${BASE_URL}${path}. ` +
      `See src/lib/api.ts and BACKEND_INTEGRATION.md.`,
  );
}
