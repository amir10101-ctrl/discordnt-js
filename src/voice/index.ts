/**
 * Voice is intentionally exposed as an adapter contract in this first package cut.
 * A complete Discord voice implementation needs UDP discovery, negotiated encryption,
 * RTP/Opus packetization and end-to-end tests against Discord voice servers. This module
 * does not pretend those protocol steps are implemented.
 */
export interface VoiceAdapter<Connection = unknown> {
  join(guildId:string, channelId:string, options?:{selfMute?:boolean;selfDeaf?:boolean}):Promise<Connection>;
  leave(guildId:string):Promise<void>;
}
export class VoiceManager<Connection = unknown> {
  constructor(private readonly adapter:VoiceAdapter<Connection>){}
  join(guildId:string,channelId:string,options?:{selfMute?:boolean;selfDeaf?:boolean}):Promise<Connection>{return this.adapter.join(guildId,channelId,options);}
  leave(guildId:string):Promise<void>{return this.adapter.leave(guildId);}
}
