export type Snowflake = string;
export type MaybePromise<T> = T | Promise<T>;
export interface User { id: Snowflake; username: string; discriminator?: string; global_name?: string | null; avatar?: string | null; bot?: boolean }
export interface Interaction { id: Snowflake; application_id: Snowflake; type: number; data?: Record<string, unknown>; guild_id?: Snowflake; channel_id?: Snowflake; member?: { user?: User; permissions?: string }; user?: User; token: string; version: number }
export interface CommandOption { type: number; name: string; description: string; required?: boolean; choices?: Array<{name:string;value:string|number}>; options?: CommandOption[]; autocomplete?: boolean; channel_types?: number[]; min_value?: number; max_value?: number; min_length?: number; max_length?: number }
export interface SlashCommand { name: string; description: string; options?: CommandOption[]; type?: 1|2|3; default_member_permissions?: string | null; dm_permission?: boolean; nsfw?: boolean }
export interface NTOptions { token: string; intents?: number; apiBase?: string; gatewayUrl?: string; reconnect?: boolean; autoRegisterCommands?: boolean; restTimeout?: number; maxRestRetries?: number; identifyProperties?: { os?: string; browser?: string; device?: string } }
export interface MessagePayload { content?: string; embeds?: unknown[]; components?: unknown[]; files?: unknown[]; allowed_mentions?: Record<string, unknown>; flags?: number }
export interface GatewayPayload { op: number; d?: unknown; s?: number | null; t?: string | null }
