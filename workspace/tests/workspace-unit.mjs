import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const sql=new DatabaseSync(':memory:');
sql.exec(await readFile('drizzle/0000_sleepy_paladin.sql','utf8'));
globalThis.__testEnv = {
 DB: {
  prepare(query) {
   let values=[];
   return {
    bind(...args) { values=args; return this; },
    async first() { return sql.prepare(query).get(...values)||null; },
    async run() { const result=sql.prepare(query).run(...values); return {meta:{changes:Number(result.changes)}}; }
   };
  }
 }
};
await build({entryPoints:['app/api/workspace/route.ts'],bundle:true,platform:'node',format:'esm',outfile:'/tmp/workspace-route-test.mjs',plugins:[{name:'test-d1',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'test-env',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env = globalThis.__testEnv;'}))}}]});
const {GET,PUT}=await import('/tmp/workspace-route-test.mjs');
const base='http://localhost/api/workspace';
const read=async(user='test-user')=>{const r=await GET(new Request(base,{headers:user?{'oai-authenticated-user-id':user}:{}}));return {status:r.status,body:await r.json()}};
const write=async(data,version)=>{const r=await PUT(new Request(base,{method:'PUT',headers:{'oai-authenticated-user-id':'test-user','content-type':'application/json'},body:JSON.stringify({data,version})}));return {status:r.status,body:await r.json()}};
assert.equal((await read(null)).status,401);
const start=await read();assert.equal(start.status,200);assert.equal(start.body.version,0);
assert.deepEqual(start.body.data.items.filter(i=>i.kind==='phase').map(i=>i.id),['sql','js','cap','python','btp']);
const changed=structuredClone(start.body.data);changed.items.find(i=>i.id==='c2').progress=30;changed.items.find(i=>i.id==='c2').notes='QA saved course note';changed.sessions['2026-11-23']={title:'SQL practice',minutes:120,done:true,notes:'joins'};
assert.equal((await write(changed,0)).status,200);
const reread=await read();assert.equal(reread.body.version,1);assert.equal(reread.body.data.items.find(i=>i.id==='c2').progress,30);assert.equal(reread.body.data.sessions['2026-11-23'].done,true);
assert.equal((await write(changed,0)).status,409);
const other=await read('another-user');assert.equal(other.body.version,0);assert.equal(other.body.data.items.find(i=>i.id==='c2').progress,0);
const bad=structuredClone(changed);bad.items[0].url='javascript:alert(1)';assert.equal((await write(bad,1)).status,400);
assert.equal((await write(start.body.data,1)).status,200);
console.log('PASS: authentication, phase order, SQL persistence, weekly session saving, stale-write protection, account isolation, URL validation.');
