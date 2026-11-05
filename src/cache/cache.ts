export interface CacheAdapter { get<T>(key:string):Promise<T|undefined>; set<T>(key:string,value:T,ttlMs?:number):Promise<void>; delete(key:string):Promise<boolean>; clear():Promise<void>; keys(prefix?:string):Promise<string[]> }
export class MemoryCache implements CacheAdapter {
  private readonly data=new Map<string,{value:unknown;expires:number}>();
  constructor(private readonly maxEntries=10_000){}
  async get<T>(key:string):Promise<T|undefined>{const entry=this.data.get(key);if(!entry)return undefined;if(entry.expires&&entry.expires<=Date.now()){this.data.delete(key);return undefined;}this.data.delete(key);this.data.set(key,entry);return entry.value as T;}
  async set<T>(key:string,value:T,ttlMs=0):Promise<void>{this.data.delete(key);this.data.set(key,{value,expires:ttlMs>0?Date.now()+ttlMs:0});while(this.data.size>this.maxEntries){const first=this.data.keys().next().value as string|undefined;if(first===undefined)break;this.data.delete(first);}}
  async delete(key:string):Promise<boolean>{return this.data.delete(key);}
  async clear():Promise<void>{this.data.clear();}
  async keys(prefix=""):Promise<string[]>{for(const [key,item] of this.data)if(item.expires&&item.expires<=Date.now())this.data.delete(key);return [...this.data.keys()].filter(key=>key.startsWith(prefix));}
}
