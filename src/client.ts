import { TypedEmitter } from "./events.js";
import { Gateway } from "./gateway/gateway.js";
import { REST } from "./rest/rest.js";
import { CommandContext } from "./structures/command-context.js";
import { MemoryCache } from "./cache/cache.js";
import type { NTOptions, SlashCommand, Interaction, MessagePayload } from "./types.js";

interface ClientEvents { ready: unknown; interactionCreate: CommandContext; dispatch:{t:string;d:unknown;s:number|null}; error:Error; destroy:undefined; reconnecting:{attempt:number;delay:number}; shardDisconnect:{code:number;reason:string} }
type CommandHandler=(ctx:CommandContext)=>unknown|Promise<unknown>;
export class NT extends TypedEmitter<ClientEvents> {
  readonly rest:REST; readonly cache:MemoryCache; readonly gateway:Gateway;
  private readonly commands=new Map<string,{data:SlashCommand;run:CommandHandler}>(); private readonly buttons=new Map<string,CommandHandler>(); private readonly selects=new Map<string,CommandHandler>(); private readonly modals=new Map<string,CommandHandler>(); private readonly autocompletes=new Map<string,CommandHandler>(); private started=false; private applicationId: string | undefined;
  constructor(readonly options:NTOptions){super();if(!options.token)throw new Error("A Discord bot token is required");this.rest=new REST({token:options.token,...(options.apiBase?{apiBase:options.apiBase}:{}),...(options.restTimeout?{timeout:options.restTimeout}:{}),...(options.maxRestRetries!==undefined?{maxRetries:options.maxRestRetries}:{})});this.cache=new MemoryCache();this.gateway=new Gateway({token:options.token,intents:options.intents??1,...(options.gatewayUrl?{url:options.gatewayUrl}:{}),reconnect:options.reconnect!==false});this.bindGateway();}
  slash(data:SlashCommand,run:CommandHandler):this {this.validateCommand(data);this.commands.set(data.name,{data,run});return this;}
  command(data:SlashCommand,run:CommandHandler):this{return this.slash(data,run);}
  button(customId:string,run:CommandHandler):this{this.buttons.set(customId,run);return this;}
  select(customId:string,run:CommandHandler):this{this.selects.set(customId,run);return this;}
  modal(customId:string,run:CommandHandler):this{this.modals.set(customId,run);return this;}
  autocomplete(commandName:string,run:CommandHandler):this{this.autocompletes.set(commandName,run);return this;}
  async registerCommands(applicationId=this.applicationId):Promise<unknown>{if(!applicationId)throw new Error("Application ID is not available. Wait for READY or pass an application ID.");return this.rest.put(`/applications/${applicationId}/commands`,[...this.commands.values()].map(item=>item.data));}
  async start():Promise<void>{if(this.started)return;this.started=true;try{const app=await this.rest.get<{id:string}>('/oauth2/applications/@me');this.applicationId=app.id;if(this.options.autoRegisterCommands!==false && this.commands.size>0) await this.registerCommands();this.gateway.connect();}catch(error){this.started=false;throw error;}}
  async destroy():Promise<void>{this.gateway.destroy();this.started=false;this.emit("destroy",undefined);this.removeAllListeners();}
  private bindGateway():void {this.gateway.on("ready",data=>this.emit("ready",data));this.gateway.on("dispatch",packet=>{this.emit("dispatch",packet);if(packet.t==="INTERACTION_CREATE")void this.handleInteraction(packet.d as Interaction);});this.gateway.on("error",error=>this.emit("error",error));this.gateway.on("reconnecting",value=>this.emit("reconnecting",value));this.gateway.on("close",value=>this.emit("shardDisconnect",value));}
  private async handleInteraction(interaction:Interaction):Promise<void>{
    const ctx=new CommandContext(interaction,this.rest); this.emit("interactionCreate",ctx);
    const data=interaction.data??{}; const customId=typeof data.custom_id==="string"?data.custom_id:""; let handler:CommandHandler|undefined;
    if(interaction.type===2){const name=String(data.name??"");handler=this.commands.get(name)?.run;}
    else if(interaction.type===3){handler=(data.component_type===2?this.buttons:this.selects).get(customId);}
    else if(interaction.type===4){const name=String(data.name??"");handler=this.autocompletes.get(name);}
    else if(interaction.type===5){handler=this.modals.get(customId);}
    if(!handler)return;
    try{await handler(ctx);}catch(error){this.emit("error",error instanceof Error?error:new Error(String(error)));if(!ctx.isAcknowledged){try{if(interaction.type===4)await ctx.respondAutocomplete([]);else await ctx.reply({content:"An unexpected error occurred.",flags:64});}catch{/* interaction token may have expired */}}}
  }
  private validateCommand(data:SlashCommand):void{if(!/^[\w-]{1,32}$/.test(data.name))throw new Error("Slash command name must be 1-32 characters and use letters, numbers, _ or -");if(data.type!==2&&data.type!==3&&(!data.description||data.description.length>100))throw new Error("Chat input commands require a description of 1-100 characters");if(data.options){let optionalSeen=false;for(const option of data.options){if(!option.name||option.name.length>32||!option.description||option.description.length>100)throw new Error(`Invalid command option: ${option.name}`);if(option.required) {if(optionalSeen)throw new Error("Required options must be placed before optional options");}else optionalSeen=true;}}}
}
export { NT as Client };
