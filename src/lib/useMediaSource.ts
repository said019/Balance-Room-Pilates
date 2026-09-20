import { useEffect, useState } from 'react';
import api from './api';
/** Fetch only our catalogue with the current bearer. Never attach credentials to arbitrary URLs. */
export function useMediaSource(source:string|null|undefined):string|undefined {
 const privatePath=source?.match(/^\/api\/media\/([0-9a-f-]{36})$/i)?.[1];
 const [resolved,setResolved]=useState<{source:string;url:string}|null>(null);
 useEffect(()=>{
  if(!privatePath||!source)return;
  const controller=new AbortController();let objectUrl:string|undefined;
  api.get(`/media/${privatePath}`,{responseType:'blob',signal:controller.signal}).then(response=>{
   if(controller.signal.aborted)return;
   objectUrl=URL.createObjectURL(response.data);setResolved({source,url:objectUrl});
  }).catch(()=>{if(!controller.signal.aborted)setResolved(null);});
  return()=>{controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl);};
 },[privatePath,source]);
 return privatePath?(resolved?.source===source?resolved.url:undefined):(source||undefined);
}
