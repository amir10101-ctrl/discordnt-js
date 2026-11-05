import type { Interaction, MessagePayload } from "../types.js";
import type { REST } from "../rest/rest.js";
export class CommandContext {
  private acknowledged=false;
  constructor(readonly interaction:Interaction,private readonly rest:REST){}
  get user(){return this.interaction.member?.user??this.interaction.user;}
  get guildId(){return this.interaction.guild_id;}
  get channelId(){return this.interaction.channel_id;}
  get isAcknowledged(){return this.acknowledged;}
  get options(){return this.interaction.data?.options as Array<Record<string,unknown>>|undefined;}
  getString(name:string):string|undefined{return this.findOption(name)?.value as string|undefined;}
  getInteger(name:string):number|undefined{return this.findOption(name)?.value as number|undefined;}
  getBoolean(name:string):boolean|undefined{return this.findOption(name)?.value as boolean|undefined;}
  getUser(name:string):string|undefined{return this.findOption(name)?.value as string|undefined;}
  async reply(payload:MessagePayload|string):Promise<unknown>{if(this.acknowledged)throw new Error("Interaction has already been acknowledged; use editReply or followUp");this.acknowledged=true;return this.callback(typeof payload==="string"?{content:payload}:payload,4);}
  async defer(ephemeral=false):Promise<unknown>{if(this.acknowledged)throw new Error("Interaction has already been acknowledged");this.acknowledged=true;return this.callback(ephemeral?{flags:64}: {},5);}
  async deferUpdate():Promise<unknown>{if(this.acknowledged)throw new Error("Interaction has already been acknowledged");this.acknowledged=true;return this.callback({},6);}
  async editReply(payload:MessagePayload|string):Promise<unknown>{if(!this.acknowledged)throw new Error("Use reply or defer before editReply");return this.rest.patch(`/webhooks/${this.interaction.application_id}/${this.interaction.token}/messages/@original`,typeof payload==="string"?{content:payload}:payload);}
  async followUp(payload:MessagePayload|string):Promise<unknown>{if(!this.acknowledged)throw new Error("Use reply or defer before followUp");return this.rest.post(`/webhooks/${this.interaction.application_id}/${this.interaction.token}`,typeof payload==="string"?{content:payload}:payload);}
  async update(payload:MessagePayload):Promise<unknown>{if(this.acknowledged)throw new Error("Interaction has already been acknowledged");this.acknowledged=true;return this.callback(payload,7);}
  async showModal(modal:Record<string,unknown>):Promise<unknown>{if(this.acknowledged)throw new Error("Interaction has already been acknowledged");this.acknowledged=true;return this.callback(modal,9);}
  async respondAutocomplete(choices:Array<{name:string;value:string|number}>):Promise<unknown>{if(this.acknowledged)throw new Error("Interaction has already been acknowledged");this.acknowledged=true;return this.callback({choices},8);}
  private callback(data:unknown,type:number):Promise<unknown>{return this.rest.post(`/interactions/${this.interaction.id}/${this.interaction.token}/callback`,{type,data});}
  private findOption(name:string):Record<string,unknown>|undefined{const visit=(items:Array<Record<string,unknown>>|undefined):Record<string,unknown>|undefined=>{for(const item of items??[]){if(item.name===name)return item;const nested=visit(item.options as Array<Record<string,unknown>>|undefined);if(nested)return nested;}return undefined;};return visit(this.options);}
}
