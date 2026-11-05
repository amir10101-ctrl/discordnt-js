export type Listener<T = unknown> = (payload: T) => void;
export class TypedEmitter<Events extends object = Record<string, unknown>> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    let set = this.listeners.get(event); if (!set) { set = new Set(); this.listeners.set(event, set); }
    set.add(listener as Listener<never>); return this;
  }
  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this {
    const wrapped: Listener<Events[K]> = value => { this.off(event, wrapped); listener(value); }; return this.on(event, wrapped);
  }
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): this { this.listeners.get(event)?.delete(listener as Listener<never>); return this; }
  emit<K extends keyof Events>(event: K, payload: Events[K]): boolean { const set = this.listeners.get(event); if (!set?.size) return false; for (const listener of [...set]) (listener as Listener<Events[K]>)(payload); return true; }
  removeAllListeners<K extends keyof Events>(event?: K): this { if (event === undefined) this.listeners.clear(); else this.listeners.delete(event); return this; }
}
