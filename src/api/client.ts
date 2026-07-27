import { API_URL } from '../config';
import { useAuth } from '../store/auth';

type ApiErrors = string | Record<string, string | string[]>;

export class ApiError extends Error {
  status: number;
  errors?: ApiErrors;

  constructor(status: number, message: string, errors?: ApiErrors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  /** First field-level validation message, falling back to the top-level message. */
  get firstError(): string {
    if (typeof this.errors === 'string') return this.errors;
    if (this.errors) {
      const first = Object.values(this.errors)[0];
      if (typeof first === 'string') return first;
      if (first?.length) return first[0];
    }
    return this.message;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  auth?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (auth) {
    const token = useAuth.getState().token;
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let payload: string | FormData | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: payload,
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (e.g. HTML error page)
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      // Token revoked or expired: drop the session so the app returns to login.
      useAuth.getState().signOut();
    }
    throw new ApiError(
      response.status,
      json?.message ?? `Request failed (${response.status})`,
      json?.errors
    );
  }

  return json as T;
}

export function toFormData(fields: Record<string, unknown>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    form.append(key, value as any);
  }
  return form;
}
