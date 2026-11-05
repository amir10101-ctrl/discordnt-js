export class EmbedBuilder {
  private data:Record<string,unknown>={type:"rich"};
  setTitle(value:string):this{this.data.title=value;return this;} setDescription(value:string):this{this.data.description=value;return this;}
  setURL(value:string):this{this.data.url=value;return this;} setColor(value:number):this{this.data.color=value;return this;}
  setTimestamp(value:Date|string=new Date()):this{this.data.timestamp=value instanceof Date?value.toISOString():value;return this;}
  setFooter(text:string,icon_url?:string):this{this.data.footer=icon_url?{text,icon_url}:{text};return this;}
  setAuthor(name:string,icon_url?:string,url?:string):this{this.data.author={name,...(icon_url?{icon_url}:{}),...(url?{url}:{})};return this;}
  addFields(...fields:Array<{name:string;value:string;inline?:boolean}>):this{const old=(this.data.fields as unknown[]|undefined)??[];this.data.fields=[...old,...fields];return this;}
  setImage(url:string):this{this.data.image={url};return this;} setThumbnail(url:string):this{this.data.thumbnail={url};return this;}
  toJSON():Record<string,unknown>{return structuredClone(this.data);}
}
