/**
 * Fetch wrapper that always yields a typed result, never throwing on a
 * non-JSON body (e.g. an HTML error page) — that would surface to users as
 * the opaque "Unexpected end of JSON input".
 */
export async function postJson<T = Record<string, unknown>>(
  url: string,
  init: RequestInit
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    return {
      ok: false,
      status: 0,
      data: {} as T,
      error: "Няма връзка със сървъра. Провери интернета и опитай пак.",
    };
  }

  const text = await res.text();
  let data: T = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      // non-JSON (HTML error page, proxy timeout, etc.)
      return {
        ok: false,
        status: res.status,
        data: {} as T,
        error: "Възникна неочаквана грешка. Опитай отново след малко.",
      };
    }
  }

  const error =
    !res.ok && typeof (data as { error?: string }).error === "string"
      ? (data as { error?: string }).error
      : !res.ok
        ? "Възникна грешка. Опитай отново."
        : undefined;

  return { ok: res.ok, status: res.status, data, error };
}
