const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
process.chdir(path.join(__dirname,'..'));
globalThis.jspdf=require('../assets/vendor/jspdf.umd.min.js');require('../ficha-pdf.js');
const config=JSON.parse(fs.readFileSync('dados/config.json','utf8'));
const phase=JSON.parse(fs.readFileSync('dados/preliminar.json','utf8'));
const subject=phase.assuntos[0],reflection=subject.reflexoes[0];
const fonts=['regular','bold'].map(name=>fs.readFileSync(`assets/fonts/pdf-${name}.ttf`).toString('base64'));
fs.mkdirSync('tmp/pdfs',{recursive:true});
for(const long of [false,true]){
  const data={project:config.titulo,labels:config.ficha,phase,subject,reflection,fields:config.ui.campos,answers:['Mapeamos as áreas atendidas pela equipe.','Alinhar o escopo com as áreas envolvidas.',long?Array.from({length:200},(_,i)=>`Evidência ${i+1}: a organização revisará o escopo e registrará os resultados da melhoria.`).join('\n'):'O escopo será revisado e validado com as áreas envolvidas.'],practices:reflection.praticas.slice(0,2).map((p,i)=>({...p,done:i===0,improve:i===1}))};
  const doc=FichaPDF.build(data,fonts);
  assert.ok(long?doc.getNumberOfPages()>1:doc.getNumberOfPages()===1);
  fs.writeFileSync(`tmp/pdfs/${long?'longo':'exemplo'}.pdf`,Buffer.from(doc.output('arraybuffer')));
  console.log(`${long?'Longo':'Exemplo'}: ${doc.getNumberOfPages()} página(s).`);
}
