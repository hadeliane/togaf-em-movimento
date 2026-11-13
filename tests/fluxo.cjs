const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
process.chdir(path.join(__dirname,'..'));
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.value='';}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  setAttribute(k,v){this[k]=v;}
  addEventListener(k,v){this.events[k]=v;}
  focus(){}
}
function all(root,predicate){return [root,...root.children.flatMap(n=>all(n,predicate))].filter(predicate);}
const nodes=Object.fromEntries(['tela','caminho','conteudo'].map(id=>[id,new Element('div')]));
let confirmResult=false,confirmations=0,download;
const ctx=vm.createContext({console,URL,document:{createElement:t=>new Element(t),createElementNS:(_,t)=>new Element(t),getElementById:id=>nodes[id],baseURI:'http://local/'},location:{hash:''},window:{confirm:()=>{confirmations++;return confirmResult;}},history:{replaceState:(_,__,hash)=>{ctx.location.hash=hash;}},FichaPDF:{download:async data=>{download=data;}},fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('.'+new URL(url).pathname,'utf8'))})});
vm.runInContext(fs.readFileSync('app.js','utf8').replace(/boot\(\);\s*$/,''),ctx);
ctx.testConfig=JSON.parse(fs.readFileSync('dados/config.json','utf8'));ctx.testPhases=JSON.parse(fs.readFileSync('dados/fases.json','utf8'));
vm.runInContext('config=testConfig;fases=testPhases;',ctx);
const render=async hash=>{ctx.location.hash=hash;await vm.runInContext('render()',ctx);};
const labels=()=>all(nodes.tela,n=>n.tag==='textarea');
const checks=()=>all(nodes.tela,n=>n.tag==='input');
const button=text=>all(nodes.tela,n=>n.tag==='button'&&n.textContent===text)[0];
(async()=>{
  const phase=JSON.parse(fs.readFileSync('dados/preliminar.json','utf8'));
  assert.ok(phase.assuntos.flatMap(a=>a.reflexoes).some(r=>r.praticas?.length));
  assert.ok(!/\bbanco\b/i.test(JSON.stringify(phase)));
  await render('#/preliminar/abrangencia');
  const action=button('Pensar em uma melhoria');assert.ok(action);action.events.click();assert.equal(ctx.location.hash,'#/preliminar/abrangencia/abrangencia-01/ficha');
  await render(ctx.location.hash);assert.equal(labels().length,3);assert.equal(checks().length,phase.assuntos[0].reflexoes[0].praticas.length*2);
  assert.equal(all(nodes.tela,n=>n.tag==='button'&&n.textContent==='Preencher minha ficha').length,0);
  checks()[1].checked=true;checks()[1].events.change();assert.equal(labels()[1].value,phase.assuntos[0].reflexoes[0].praticas[0].texto);
  labels()[1].value='Minha ação personalizada';labels()[1].events.input();
  assert.equal(all(nodes.tela,n=>n.className==='print-answer')[1].textContent,'Minha ação personalizada');
  checks()[3].checked=true;checks()[3].events.change();
  checks()[5].checked=true;checks()[5].events.change();
  const expected='Minha ação personalizada'+'\n'+phase.assuntos[0].reflexoes[0].praticas[1].texto+'\n'+phase.assuntos[0].reflexoes[0].praticas[2].texto;
  assert.equal(labels()[1].value,expected);
  assert.equal(all(nodes.tela,n=>n.className==='print-answer')[1]?.textContent,expected);
  checks()[3].checked=false;checks()[3].events.change();checks()[3].checked=true;checks()[3].events.change();assert.equal(labels()[1].value,expected);
  checks()[0].checked=true;checks()[0].events.change();checks()[2].checked=true;checks()[2].events.change();
  assert.equal(labels()[0].value,phase.assuntos[0].reflexoes[0].praticas[0].texto+'\n'+phase.assuntos[0].reflexoes[0].praticas[1].texto);
  assert.equal(labels()[1].value,expected);assert.equal(confirmations,0);
  assert.equal(button('Substituir o texto'),undefined);
  await button('Gerar minha ficha').events.click();assert.equal(download.practices.length,3);assert.ok(download.practices[0].done);assert.ok(download.practices[1].improve);assert.ok(download.answers[1].includes(phase.assuntos[0].reflexoes[0].praticas[2].texto));assert.equal(download.reflection.apoio,phase.assuntos[0].reflexoes[0].apoio);
  button('Esse fica para depois').events.click();assert.equal(ctx.location.hash,'#/preliminar/abrangencia');
  await render('#/preliminar/abrangencia/abrangencia-01');assert.equal(ctx.location.hash,'#/preliminar/abrangencia/abrangencia-01/ficha');assert.equal(checks()[0].checked,true);assert.equal(labels()[1].value,download.answers[1]);
  assert.equal(all(nodes.tela,n=>n.className==='print-answer')[1].textContent,download.answers[1]);
  for(const a of phase.assuntos)for(const r of a.reflexoes){await render(`#/preliminar/${a.id}/${r.id}/ficha`);assert.equal(labels().length,3);assert.equal(checks().length,(r.praticas?.length||0)*2);}
  await button('Gerar minha ficha').events.click();assert.equal(download.practices.length,0);
  console.log('OK: 17 fichas, rotas antigas, retorno direto, adição automática sem duplicação, escolhas opcionais e respostas preservadas.');
})().catch(e=>{console.error(e);process.exitCode=1;});
