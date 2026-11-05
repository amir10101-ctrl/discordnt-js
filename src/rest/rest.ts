import type { MessagePayload } from "../types.js";

export interface RESTOptions { token: string; apiBase?: string; timeout?: number; maxRetries?: number }
export interface RESTRequestOptions { query?: Record<string, string | number | boolean | undefined>; body?: unknown; headers?: Record<string,string>; signal?: AbortSignal; reason?: string }
export class DiscordAPIError extends Error {
  constructor(message: string, readonly status: number, readonly code: number | string | undefined, readonly response: unknown, readonly headers: Headers) { super(message); this.name = "DiscordAPIError"; }
}
type Bucket = { tail: Promise<void>; remaining: number; resetAt: number; limit: number };
export class REST {
  private readonly base: string; private readonly timeout: number; private readonly maxRetries: number;
  private readonly buckets = new Map<string, Bucket>(); private readonly routeBuckets = new Map<string,string>(); private globalResetAt = 0;
  constructor(private readonly options: RESTOptions) { this.base = (options.apiBase ?? "https://discord.com/api/v10").replace(/\/$/, ""); this.timeout = options.timeout ?? 15_000; this.maxRetries = options.maxRetries ?? 4; }
  async request<T>(method: string, route: string, options: RESTRequestOptions = {}): Promise<T> {
    const normalized = this.normalizeRoute(method, route); const bucketKey = this.routeBuckets.get(normalized) ?? normalized;
    const bucket = this.getBucket(bucketKey); let release!: () => void; const previous = bucket.tail; bucket.tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { return await this.perform<T>(method.toUpperCase(), route, options, normalized, bucket); } finally { release(); }
  }
  get<T>(route: string, options?: RESTRequestOptions): Promise<T> { return this.request<T>("GET",route,options); }
  post<T>(route: string, body?: unknown, options: Omit<RESTRequestOptions,"body"> = {}): Promise<T> { return this.request<T>("POST",route,{...options,body}); }
  put<T>(route: string, body?: unknown, options: Omit<RESTRequestOptions,"body"> = {}): Promise<T> { return this.request<T>("PUT",route,{...options,body}); }
  patch<T>(route: string, body?: unknown, options: Omit<RESTRequestOptions,"body"> = {}): Promise<T> { return this.request<T>("PATCH",route,{...options,body}); }
  delete<T>(route: string, options?: RESTRequestOptions): Promise<T> { return this.request<T>("DELETE",route,options); }
  private async perform<T>(method: string, route: string, options: RESTRequestOptions, normalized: string, bucket: Bucket): Promise<T> {
    const url = new URL(this.base + route);
    for (const [key,value] of Object.entries(options.query ?? {})) if (value !== undefined) url.searchParams.set(key,String(value));
    let attempt = 0;
    while (true) {
      const now = Date.now(); const wait = Math.max(this.globalResetAt, bucket.resetAt) - now; if (wait > 0) await this.delay(wait, options.signal);
      const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(new Error("Discord REST request timed out")), this.timeout);
      const abort = () => controller.abort(options.signal?.reason); options.signal?.addEventListener("abort",abort,{once:true});
      const headers = new Headers(options.headers); headers.set("Authorization",`Bot ${this.options.token}`); headers.set("User-Agent","DiscordNT.js (https://example.com, 0.1.0)");
      let body: BodyInit | undefined;
      if (options.body !== undefined) { if (typeof options.body === "string" || options.body instanceof FormData || options.body instanceof Blob) body = options.body; else { headers.set("Content-Type","application/json"); body = JSON.stringify(options.body); } }
      if (options.reason) headers.set("X-Audit-Log-Reason",encodeURIComponent(options.reason));
      let response: Response;
      try { response = await fetch(url,{method,headers,...(body !== undefined ? {body} : {}),signal:controller.signal}); }
      catch (error) { if (attempt++ < this.maxRetries && method !== "POST" && !options.signal?.aborted) { await this.delay(Math.min(1000 * 2 ** attempt,10_000),options.signal); continue; } throw error; }
      finally { clearTimeout(timeoutId); options.signal?.removeEventListener("abort",abort); }
      this.updateRateLimits(response.headers,normalized,bucket);
      const text = response.status === 204 ? "" : await response.text(); let data: unknown = undefined;
      if (text) { try { data = JSON.parse(text); } catch { data = text; } }
      if (response.status === 429) {
        const retry = typeof data === "object" && data !== null && "retry_after" in data ? Number((data as {retry_after:unknown}).retry_after) * 1000 : Number(response.headers.get("Retry-After") ?? 1) * 1000;
        if (response.headers.get("X-RateLimit-Global") === "true" || (typeof data === "object" && data !== null && "global" in data && (data as {global:unknown}).global === true)) this.globalResetAt = Date.now() + retry;
        else bucket.resetAt = Date.now() + retry;
        if (attempt++ < this.maxRetries) continue;
      } else if ((response.status >= 500 || response.status === 408) && attempt++ < this.maxRetries && method !== "POST") { await this.delay(Math.min(500 * 2 ** attempt,8000)); continue; }
      if (!response.ok) { const obj = typeof data === "object" && data !== null ? data as Record<string,unknown> : {}; throw new DiscordAPIError(String(obj.message ?? `Discord API returned ${response.status}`),response.status,typeof obj.code === "number" || typeof obj.code === "string" ? obj.code : undefined,data,response.headers); }
      return data as T;
    }
  }
  private updateRateLimits(headers: Headers, route: string, bucket: Bucket): void {
    const hash = headers.get("X-RateLimit-Bucket"); if (hash) { const key = `${hash}:${this.major(route)}`; this.routeBuckets.set(route,key); this.buckets.set(key,bucket); }
    const remaining = headers.get("X-RateLimit-Remaining"); const resetAfter = headers.get("X-RateLimit-Reset-After"); const limit = headers.get("X-RateLimit-Limit");
    if (remaining !== null) bucket.remaining = Number(remaining); if (limit !== null) bucket.limit = Number(limit); if (resetAfter !== null) bucket.resetAt = Date.now() + Number(resetAfter) * 1000;
  }
  private normalizeRoute(method: string, route: string): string { const path = route.split("?")[0] ?? route; return `${method}:${path.replace(/\d{16,20}/g,":id").replace(/\/reactions\/[^/]+/g,"/reactions/:emoji")}`; }
  private major(route: string): string { return (route.match(/\/(?:channels|guilds|webhooks)\/(\d{16,20})/)?.[1] ?? "global"); }
  private getBucket(key: string): Bucket { let value = this.buckets.get(key); if (!value) { value = {tail:Promise.resolve(),remaining:1,resetAt:0,limit:1}; this.buckets.set(key,value); } return value; }
  private delay(ms: number, signal?: AbortSignal): Promise<void> { return new Promise((resolve,reject) => { if (signal?.aborted) { reject(signal.reason); return; } const done=()=>{signal?.removeEventListener("abort",abort);resolve();}; const abort=()=>{clearTimeout(id);signal?.removeEventListener("abort",abort);reject(signal?.reason);}; const id=setTimeout(done,Math.max(0,ms));signal?.addEventListener("abort",abort,{once:true}); }); }
  async createMessage(channelId: string, payload: MessagePayload): Promise<unknown> { return this.post(`/channels/${channelId}/messages`,payload); }
}
