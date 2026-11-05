export enum ButtonStyle { Primary=1, Secondary=2, Success=3, Danger=4, Link=5 }
export class ButtonBuilder {
  private data:Record<string,unknown>;
  constructor(customId:string,label:string,style:ButtonStyle=ButtonStyle.Primary){this.data={type:2,custom_id:customId,label,style};}
  setEmoji(emoji:string):this{this.data.emoji={name:emoji};return this;} setDisabled(value=true):this{this.data.disabled=value;return this;}
  setURL(url:string):this{this.data.url=url;this.data.style=ButtonStyle.Link;delete this.data.custom_id;return this;}
  toJSON():Record<string,unknown>{return {...this.data};}
}
export class ActionRowBuilder { private components:unknown[]=[]; addComponents(...items:Array<{toJSON():unknown}|Record<string,unknown>>):this{this.components.push(...items.map(item=>"toJSON" in item&&typeof item.toJSON==="function"?item.toJSON():item));return this;} toJSON():Record<string,unknown>{return {type:1,components:this.components};} }
