const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window === "undefined") return {};

  try {
    const response = await fetch("/api/auth/get-session", {
      credentials: "include",
    });
    if (!response.ok) return {};

    const data = await response.json();
    if (data?.session?.token) {
      return { Authorization: `Bearer ${data.session.token}` };
    }
  } catch {
    // Session unavailable
  }

  return {};
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new ApiError(response.status, error.message ?? "Request failed");
  }

  return response.json() as Promise<T>;
}
