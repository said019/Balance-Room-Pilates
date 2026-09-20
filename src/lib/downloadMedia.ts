import api from './api';
export async function downloadMedia(source:string,name:string) {
 const id=source.match(/^\/api\/media\/([0-9a-f-]{36})$/i)?.[1];
 let url:string;
 if(id)url=URL.createObjectURL((await api.get(`/media/${id}`,{responseType:'blob'})).data);
 else if(/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,/.test(source))url=source;
 else throw new Error('Archivo no disponible en el almacenamiento del studio');
 try {const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();}
 finally {if(id)setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
