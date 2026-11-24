import { env } from 'cloudflare:workers';
import { initial,stateSchema } from '../../model';
export const dynamic='force-dynamic';
const response=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:Request){
 const uid=req.headers.get('oai-authenticated-user-id'); if(!uid)return response({error:'Sign in to load your workspace.'},401);
 try{const row=await env.DB!.prepare('SELECT data, version FROM workspaces WHERE user_id = ?').bind(uid).first<{data:string,version:number}>();return response(row?{data:JSON.parse(row.data),version:row.version}:{data:initial,version:0});}catch{return response({error:'Your workspace could not be loaded. Please retry.'},503)}
}
export async function PUT(req:Request){
 const uid=req.headers.get('oai-authenticated-user-id'); if(!uid)return response({error:'Sign in to save your workspace.'},401);
 try{const raw=await req.text();if(raw.length>500000)return response({error:'Workspace is too large.'},413);const body=JSON.parse(raw);const parsed=stateSchema.safeParse(body.data);if(!parsed.success||!Number.isInteger(body.version)||body.version<0)return response({error:'Check your fields and use valid http or https links.'},400);
 const data=JSON.stringify(parsed.data);let result;
 if(body.version===0)result=await env.DB!.prepare('INSERT INTO workspaces (user_id,data,version) VALUES (?,?,1) ON CONFLICT(user_id) DO NOTHING').bind(uid,data).run();
 else result=await env.DB!.prepare('UPDATE workspaces SET data = ?, version = version + 1 WHERE user_id = ? AND version = ?').bind(data,uid,body.version).run();
 if(!result.meta.changes)return response({error:'This workspace changed in another tab. Reload before saving; your open edit is still here.'},409);
 return response({version:body.version+1});}catch{return response({error:'Save failed. Your previous saved data is safe. Please retry.'},503)}
}
