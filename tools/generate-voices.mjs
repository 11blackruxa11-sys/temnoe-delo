#!/usr/bin/env node
/**
 * Generate premium Russian narrator and witness clips for ТЁМНОЕ ДЕЛО.
 *
 * PREVIEW (free, no requests): node tools/generate-voices.mjs
 * GENERATE (will use ElevenLabs credits):
 *   ELEVENLABS_API_KEY=... VOICE_ID_NARRATOR=... VOICE_ID_MARINA=... \
 *   VOICE_ID_ELENA=... VOICE_ID_ILYA=... VOICE_ID_VIKTOR=... \
 *   node tools/generate-voices.mjs --generate --limit=8
 *
 * Configure different voice IDs for narrator and each witness. The script uses
 * source text directly, saves standalone files, and updates voice/manifest.json.
 * Never add secrets to git. All expenses are controlled by --generate.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=await readFile(path.join(root,'game/v16/app.js'),'utf8');
const voiceDir=path.join(root,'game/v16/voice');
const manifestFile=path.join(voiceDir,'manifest.json');
const generate=process.argv.includes('--generate');
const limitArg=process.argv.find(x=>x.startsWith('--limit='));
const limit=limitArg?Math.max(1,Number(limitArg.slice(8))||1):Infinity;
const types=['narrator','marina','elena','ilya','viktor'];
const voiceIds=Object.fromEntries(types.map(p=>[p,process.env['VOICE_ID_'+p.toUpperCase()]||'']));
const apiKey=process.env.ELEVENLABS_API_KEY;
const decode=s=>s.replace(/\\(['"\\nrt])/g,(all,mark)=>({n:'\n',r:'\r',t:'\t'}[mark]||mark));
const fnv=s=>{let n=2166136261;for(let i=0;i<s.length;i++){n^=s.charCodeAt(i);n=Math.imul(n,16777619)}return(n>>>0).toString(16).padStart(8,'0')};
const jobs=new Map();
function add(who,text){if(!text||!types.includes(who))return;const key=who+'-'+fnv(text);if(jobs.has(key)&&jobs.get(key).text!==text)throw Error('Hash collision: '+key);jobs.set(key,{who,text,key,file:key+'.mp3'});}
const peopleStart=source.indexOf('const PEOPLE={'),storyStart=source.indexOf('const STORY=[');
if(peopleStart<0||storyStart<0)throw Error('Game source changed. Cannot find PEOPLE/STORY data.');
const people=source.slice(peopleStart,storyStart);
for(const [index,who] of types.slice(1).entries()){
  const start=people.indexOf(who+':{');
  if(start<0)throw Error('Missing witness '+who);
  const next=types.slice(2+index).map(x=>people.indexOf(x+':{',start+3)).filter(x=>x>start).sort((a,b)=>a-b)[0]??people.length;
  const section=people.slice(start,next);
  const intro=section.match(/\bintro:'((?:\\.|[^'\\])*)'/);
  if(intro)add(who,decode(intro[1]));
  for(const match of section.matchAll(/\bq:'((?:\\.|[^'\\])*)',(?:need:\[[^\]]*\],lock:'(?:\\.|[^'\\])*',)?a:'((?:\\.|[^'\\])*)'/g)){
    add('narrator',decode(match[1]));add(who,decode(match[2]));
  }
  // More tolerant coverage for question text whose lock/reveal fields vary.
  for(const match of section.matchAll(/\bq:'((?:\\.|[^'\\])*)'/g))add('narrator',decode(match[1]));
  for(const match of section.matchAll(/\ba:'((?:\\.|[^'\\])*)'/g))add(who,decode(match[1]));
}
const story=source.slice(storyStart,source.indexOf('function openStory()',storyStart));
for(const match of story.matchAll(/\{title:'((?:\\.|[^'\\])*)',when:'((?:\\.|[^'\\])*)',note:'((?:\\.|[^'\\])*)'/g)){
  add('narrator',decode(match[1])+'. '+decode(match[3]));
}
await mkdir(voiceDir,{recursive:true});
let current={version:1,provider:'ElevenLabs',language:'ru',clips:{}};
try{const loaded=JSON.parse(await readFile(manifestFile,'utf8'));current={...current,...loaded,clips:loaded.clips||{}}}catch{}
const ordered=[...jobs.values()];
let spent=0,ready=0;
for(const j of ordered){try{await access(path.join(voiceDir,j.file));current.clips[j.key]=j.file;ready++;}catch{}}
const outstanding=ordered.filter(j=>!current.clips[j.key]);
console.log('Voice jobs:',ordered.length,'existing:',ready,'to generate:',outstanding.length);
console.log('Characters:',Object.fromEntries(types.map(w=>[w,ordered.filter(j=>j.who===w).length])));
if(!generate){console.log('DRY RUN. To generate clips, supply key + five voice IDs and --generate. This uses paid credits.');process.exit(0)}
if(!apiKey||types.some(w=>!voiceIds[w])){throw Error('Missing ELEVENLABS_API_KEY or one of VOICE_ID_NARRATOR/MARINA/ELENA/ILYA/VIKTOR');}
for(const job of outstanding.slice(0,limit)){
  const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voiceIds[job.who])+'?output_format=mp3_44100_128',{
    method:'POST',headers:{'xi-api-key':apiKey,'Content-Type':'application/json','Accept':'audio/mpeg'},
    body:JSON.stringify({text:job.text,model_id:'eleven_multilingual_v2',voice_settings:{stability:.43,similarity_boost:.77,style:.30,use_speaker_boost:true}})
  });
  if(!response.ok)throw Error('ElevenLabs failed '+response.status+' (voice '+job.who+'): '+(await response.text()).slice(0,350));
  await writeFile(path.join(voiceDir,job.file),Buffer.from(await response.arrayBuffer()));
  current.clips[job.key]=job.file;spent++;
  await writeFile(manifestFile,JSON.stringify({...current,generatedAt:new Date().toISOString()},null,2)+'\n');
  console.log('Generated',spent,'/',Math.min(limit,outstanding.length),job.who,job.file);
}
console.log('Generated:',spent,'Total available:',Object.keys(current.clips).length);
