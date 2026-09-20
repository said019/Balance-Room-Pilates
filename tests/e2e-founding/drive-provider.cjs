// Synthetic HTTP provider for the isolated Founding proof-upload browser test.
// Run with the clean Founding environment; never points to Google or a bank.
const {createRequire}=require('node:module');const {resolve}=require('node:path');const {randomUUID}=require('node:crypto');
const target=new URL(process.env.DATABASE_URL||'');if(target.hostname!=='127.0.0.1'||target.port!=='54349'||process.env.NODE_ENV!=='test')throw Error('Founding disposable DB only');
const req=createRequire(resolve(__dirname,'../../../backend/package.json'));const express=req('express');const app=express();
app.post('/token',(_q,r)=>r.json({access_token:'synthetic'}));app.post('/upload/drive/v3/files',(_q,r)=>r.json({id:randomUUID()}));app.get('/drive/v3/files/:id/permissions',(_q,r)=>r.json({permissions:[{type:'user'}]}));app.listen(3429,'127.0.0.1');
