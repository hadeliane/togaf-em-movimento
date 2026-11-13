'use strict';
const $=id=>document.getElementById(id);
let config,fases,phase,subject,reflection;
const drafts=new Map();
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const button=(text,action,cls='button')=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',action);return b;};
async function json(file){const r=await fetch(new URL('dados/'+file,document.baseURI));if(!r.ok)throw Error(file+': HTTP '+r.status);return r.json();}
function strings(obj,keys){if(!obj||keys.some(k=>typeof obj[k]!=='string'))throw Error('Estrutura de conteúdo inválida');}
function validatePhase(p){strings(p,['id','titulo']);if(!Array.isArray(p.assuntos))throw Error('Assuntos inválidos');const ids=new Set();for(const a of p.assuntos){strings(a,['id','titulo','icone','descricao']);if(ids.has(a.id)||!Array.isArray(a.reflexoes))throw Error('Assunto inválido');ids.add(a.id);const refs=new Set();for(const r of a.reflexoes){strings(r,['id','titulo','pergunta','apoio']);if(refs.has(r.id))throw Error('Reflexão duplicada');refs.add(r.id);}}return p;}
function go(...parts){const hash='#/'+parts.map(encodeURIComponent).join('/');if(location.hash===hash)render();else location.hash=hash;}
function card(title,detail,icon,action){const b=button('',action,'card');b.append(el('span',icon,'badge'));const t=el('span');t.append(el('strong',title));if(detail)t.append(el('small',detail));b.append(t);return b;}
// Imagens originais: caminhos e descrições são definidos em dados/config.json.
function originalImage(src, alt, fallbackText, className) {
  const frame = el('div', undefined, className);
  const img = el('img');
  const fallback = el('span', fallbackText, 'image-fallback');
  img.alt = alt;
  img.decoding = 'async';
  fallback.hidden = true;
  img.addEventListener('error', () => { img.hidden = true; fallback.hidden = false; });
  img.src = src;
  frame.append(img, fallback);
  return frame;
}
function diagram() {
  const fig = el('figure', undefined, 'art');
  fig.append(originalImage(config.inicial.imagemADM, config.ui.ciclo, config.inicial.admAusente, 'adm-image'));
  return fig;
}
function phaseCard(f) {
  const content = config.inicial.fases[f.id];
  const b = button('', () => go(f.id), 'card phase-card' + (content.disponivel ? ' available' : ' upcoming'));
  b.disabled = !content.disponivel;
  b.append(originalImage(content.imagem, '', config.inicial.imagemAusente, 'phase-image'));
  const copy = el('span', undefined, 'phase-copy');
  copy.append(el('strong', f.titulo), el('span', content.descricao, 'phase-description'));
  b.append(copy);
  return b;
}
// Camada visual dos assuntos; o conteúdo permanece nos arquivos JSON.
const subjectIcons = {
  abrangencia: [['circle',{cx:12,cy:12,r:9}],['circle',{cx:12,cy:12,r:5}],['circle',{cx:12,cy:12,r:1}],['path',{d:'M15 9 21 3M17 3h4v4'}]],
  equipe: [['circle',{cx:9,cy:8,r:3}],['path',{d:'M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4v2'}]],
  'ferramentas-repositorio': [['path',{d:'M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7ZM3 10h18M9 15h6'}]],
  indicadores: [['path',{d:'M3 3v18h18M7 15l5-5 4 3 5-7M16 6h5v5'}]],
  metamodelo: [['rect',{x:9,y:2,width:6,height:6,rx:1.5}],['rect',{x:2,y:16,width:6,height:6,rx:1.5}],['rect',{x:16,y:16,width:6,height:6,rx:1.5}],['path',{d:'M12 8v4M5 16v-4h14v4'}]],
  principios: [['path',{d:'m12 2 9 10-9 10L3 12 12 2ZM3 12h18M12 2l4 10-4 10-4-10 4-10'}]],
  'processos-servicos': [['path',{d:'M4 7h15l-4-4M20 17H5l4 4M20 7v4M4 17v-4'}],['circle',{cx:4,cy:7,r:2}],['circle',{cx:20,cy:17,r:2}]]
};
function subjectIcon(subject) {
  const frame=el('span',undefined,'badge');
  frame.setAttribute('aria-hidden','true');
  const shapes=subjectIcons[subject.id];
  if(!shapes){frame.textContent=subject.icone;return frame;}
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.6,'stroke-linecap':'round','stroke-linejoin':'round',focusable:'false'}))svg.setAttribute(key,value);
  for(const [tag,attrs] of shapes){const shape=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))shape.setAttribute(key,value);svg.append(shape);}
  frame.append(svg);return frame;
}
function subjectCard(subject){
  const item=button('',()=>go(phase.id,subject.id),'card subject-card');
  const copy=el('span');
  copy.append(el('strong',subject.titulo),el('small',subject.descricao));
  item.append(subjectIcon(subject),copy);return item;
}
function reflectionCard(r){
  const item=el('article',undefined,'card reflection-card');
  const copy=el('div',undefined,'reflection-copy');
  copy.append(el('strong',r.titulo),el('small',r.pergunta),button(config.ui.pensarMelhoria,()=>go(phase.id,subject.id,r.id,'ficha'),'button reflection-action'));
  item.append(copy);return item;
}
const practiceDrafts=new Map();
function renderSheet(){
  const labels=config.ficha;
  const selected={phase,subject,reflection};
  const key=[phase.id,subject.id,reflection.id].join('/');
  if(!drafts.has(key))drafts.set(key,['','','']);
  if(!practiceDrafts.has(key))practiceDrafts.set(key,new Map());
  const answers=drafts.get(key),marks=practiceDrafts.get(key);
  const practices=reflection.praticas||[];
  if(!Array.isArray(practices)||practices.some(p=>!p||typeof p.id!=='string'||typeof p.texto!=='string')||new Set(practices.map(p=>p.id)).size!==practices.length)throw Error('Práticas inválidas');
  const panel=el('article',undefined,'panel sheet');
  panel.append(el('h2',labels.titulo));
  const dl=el('dl',undefined,'metadata sheet-context');
  for(const [label,value]of [[labels.fase,phase.titulo],[labels.assunto,subject.titulo],[labels.reflexao,reflection.pergunta]]){
    const row=el('div');row.append(el('dt',label),el('dd',value));dl.append(row);
  }
  panel.append(dl);
  const fields=el('section',undefined,'sheet-fields');
  const inputs=[],printAnswers=[];
  config.ui.campos.forEach((label,i)=>{
    const field=el('div',undefined,'field');
    const title=el('label',label);title.htmlFor='resposta-'+i;
    const help=el('p',labels.orientacoes[i],'field-help');help.id='orientacao-'+i;
    const input=el('textarea');input.id='resposta-'+i;input.rows=4;input.value=answers[i];input.setAttribute('aria-describedby',help.id);
    const printAnswer=el('div',answers[i],'print-answer');
    printAnswers.push(printAnswer);
    input.addEventListener('input',()=>{answers[i]=input.value;printAnswer.textContent=input.value;});
    inputs.push(input);field.append(title,help,input,printAnswer);fields.append(field);
  });
  if(practices.length){
    const section=el('section',undefined,'sheet-practices');
    const title=el('h3',labels.praticasTitulo);title.id='praticas-titulo';section.setAttribute('aria-labelledby',title.id);
    section.append(title,el('p',labels.praticasApoio,'practices-intro'));
    const list=el('ul',undefined,'practice-list');
    for(const practice of practices){
      if(!marks.has(practice.id))marks.set(practice.id,{done:false,improve:false});
      const state=marks.get(practice.id);
      const item=el('li');const group=el('fieldset');group.append(el('legend',practice.texto));
      const options=el('div',undefined,'practice-options');
      for(const [property,text]of [['done',labels.jaFazemos],['improve',labels.queroMelhorar]]){
        const option=el('label');const check=el('input');check.type='checkbox';check.checked=state[property];
        check.addEventListener('change',()=>{
          const fieldIndex=property==='done'?0:1;
          if(check.checked){
            const current=answers[fieldIndex];
            if(!current.split(/\r?\n/).some(line=>line.trim()===practice.texto.trim())){
              answers[fieldIndex]=current.trim()?current.trimEnd()+'\n'+practice.texto:practice.texto;
              inputs[fieldIndex].value=answers[fieldIndex];
              printAnswers[fieldIndex].textContent=answers[fieldIndex];
            }
          }
          state[property]=check.checked;
        });
        option.append(check,el('span',text));options.append(option);
      }
      group.append(options);item.append(group);list.append(item);
    }
    section.append(list);panel.append(section);
  }
  panel.append(fields);
  const error=el('p',undefined,'pdf-error');error.hidden=true;error.setAttribute('role','alert');
  const actions=el('div',undefined,'actions sheet-actions');
  const later=button(labels.depois,()=>go(selected.phase.id,selected.subject.id),'back');
  const generate=button(labels.gerar,async()=>{
    generate.disabled=true;error.hidden=true;
    try{
      await FichaPDF.download({project:config.titulo,labels,phase:selected.phase,subject:selected.subject,reflection:selected.reflection,fields:config.ui.campos,answers:[...answers],practices:practices.map(p=>({...p,...marks.get(p.id)})).filter(p=>p.done||p.improve)});
    }catch(e){console.error(e);error.textContent=labels.erroPDF;error.hidden=false;}
    finally{generate.disabled=false;}
  });
  actions.append(later,generate);panel.append(actions,error);return panel;
}
let sequence=0;
async function render(){const current=++sequence;const screen=$('tela');const nav=$('caminho');screen.replaceChildren();nav.replaceChildren();const ui=config.ui;try{const parts=location.hash.replace(/^#\/?/,'').split('/').filter(Boolean).map(decodeURIComponent);nav.hidden=!parts.length;
if(!parts.length){
  const intro=el('div',undefined,'home-intro');
  intro.append(el('h2',ui.perguntaInicial),el('p',config.apresentacao));
  screen.append(intro);
  const layout=el('div',undefined,'layout'),cards=el('div',undefined,'cards phase-grid');
  for(const f of fases)cards.append(phaseCard(f));
  layout.append(cards,diagram());screen.append(layout);return;
}
nav.append(button(ui.inicio,()=>go(), 'back'));
const meta=fases.find(f=>f.id===parts[0]);if(!meta)throw Error('Fase não encontrada');const loaded=validatePhase(await json(meta.arquivo));if(current!==sequence)return;if(loaded.id!==meta.id)throw Error('Identificação da fase inválida');phase=loaded;nav.append(el('span','/'),button(phase.titulo,()=>go(phase.id),'back'));
if(parts.length===1){const heading=el('div',undefined,'subject-intro');const phaseVisual=config.inicial.fases[phase.id];heading.append(originalImage(phaseVisual.imagem,phase.titulo,phase.titulo,'subject-phase-image'));const introCopy=el('div',undefined,'subject-intro-copy');introCopy.append(el('h2',ui.escolhaAssunto,'subject-heading'));if(phaseVisual.introducao)introCopy.append(el('p',phaseVisual.introducao,'subject-support'));heading.append(introCopy);screen.append(heading);if(!phase.assuntos.length)screen.append(el('p',ui.indisponivel,'notice'));else{const cards=el('div',undefined,'cards subjects subject-grid');for(const a of phase.assuntos)cards.append(subjectCard(a));screen.append(cards);}return;}
subject=phase.assuntos.find(a=>a.id===parts[1]);if(!subject)throw Error('Assunto não encontrado');nav.append(el('span','/'),button(subject.titulo,()=>go(phase.id,subject.id),'back'));
if(parts.length===2){const intro=el('div',undefined,'reflection-intro');intro.append(el('h2',ui.escolhaReflexao),el('p',subject.introducaoReflexoes||ui.orientacaoReflexoes));screen.append(intro);const cards=el('div',undefined,'cards subjects reflection-grid');for(const r of subject.reflexoes)cards.append(reflectionCard(r));screen.append(cards);return;}
reflection=subject.reflexoes.find(r=>r.id===parts[2]);if(!reflection||parts.length>4||(parts[3]&&parts[3]!=='ficha'))throw Error('Reflexão não encontrada');nav.append(el('span','/'),button(ui.reflexoes,()=>go(phase.id,subject.id),'back'));
// Links antigos de detalhamento abrem a ficha e recebem a URL canônica.
if(parts.length===3)history.replaceState(null,'','#/'+[phase.id,subject.id,reflection.id,'ficha'].map(encodeURIComponent).join('/'));
nav.append(el('span','/'),el('span',ui.ficha));screen.append(renderSheet());
}catch(e){if(current!==sequence)return;console.error(e);screen.replaceChildren(el('p',ui.erro,'notice'),button(ui.tentar,render));}finally{if(current===sequence)$('conteudo').focus({preventScroll:true});}}
async function boot(){try{[config,fases]=await Promise.all([json('config.json'),json('fases.json')]);strings(config,['chamada','titulo','subtitulo','apresentacao','assinatura','rodape']);if(!config.ui||!Array.isArray(config.ui.campos)||config.ui.campos.length!==3||!Array.isArray(fases)||fases.length!==10)throw Error('Configuração inválida');strings(config.ui,['inicio','assuntos','reflexoes','ficha','perguntaInicial','escolhaAssunto','escolhaReflexao','indisponivel','breve','disponivel','abrirFicha','imprimir','voltar','privacidade','impressao','erro','tentar','ciclo']);if(!config.inicial||!config.inicial.fases)throw Error('Configuração da página inicial inválida');strings(config.inicial,['imagemADM','imagemAusente','admAusente','disponivel','breve']);const ids=new Set();for(const f of fases){strings(f,['id','titulo','sigla','arquivo']);if(ids.has(f.id)||!/^[a-z-]+\.json$/.test(f.arquivo))throw Error('Fase inválida');strings(config.inicial.fases[f.id],['descricao','imagem']);ids.add(f.id);}fases.sort((a,b)=>a.ordem-b.ordem);for(const id of ['titulo','subtitulo','rodape'])$(id).textContent=config[id];document.title=config.titulo;await render();window.addEventListener('hashchange',render);}catch(e){console.error(e);$('tela').replaceChildren(el('p','Não foi possível iniciar a aplicação. Verifique dados/config.json e dados/fases.json e sirva a pasta por HTTP.','notice'),button('Tentar novamente',()=>location.reload()));}}
boot();
