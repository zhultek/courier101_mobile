import { API_URL } from '../config';
import { useAuth } from '../store/auth';
import { queryClient } from './queryClient';

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
  sessionToken?: string;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, sessionToken, signal } = options;
  const initialState = useAuth.getState();
  const requestToken = sessionToken ?? initialState.token;
  const requestCourier = initialState.courier?.code;
  const headers: Record<string, string> = { Accept: 'application/json' };

  if (auth) {
    if (requestToken) headers.Authorization = `Bearer ${requestToken}`;
  }

  let payload: string | FormData | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, body instanceof FormData ? 120_000 : 30_000);
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  let response: Response;
  let text: string;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
    text = await response.text();
  } catch {
    throw new ApiError(
      timedOut ? 408 : 0,
      timedOut
        ? 'The connection took too long. Please try again.'
        : 'Unable to connect. Check your internet connection and try again.'
    );
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON response (e.g. HTML error page)
  }

  if (!response.ok) {
    const state = useAuth.getState();
    const sameSession = requestToken === state.token && requestCourier === state.courier?.code;
    if (sameSession && (json?.error_code === 'MOBILE_APP_UNAVAILABLE' || (response.status === 401 && auth))) {
      // Revoked tokens and disabled/deleted couriers return to code entry, with no cached customer data.
      void state.resetCourier();
      queryClient.clear();
    }
    throw new ApiError(
      response.status,
      json?.message ?? `Request failed (${response.status})`,
      json?.errors
    );
  }

  if (auth && requestToken !== useAuth.getState().token) {
    // A response started before logout must never repopulate another customer's state.
    throw new ApiError(401, 'Your session has ended.');
  }

  if (json === null && response.status !== 204) {
    throw new ApiError(502, 'We could not load your information. Please try again.');
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
