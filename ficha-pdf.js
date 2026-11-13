'use strict';
// Renderização vetorial, com texto selecionável e paginação por linha.
globalThis.FichaPDF = (() => {
  let assetsPromise;
  function base64(buffer) {
    const bytes=new Uint8Array(buffer);let result='';
    for(let i=0;i<bytes.length;i+=8192)result+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(result);
  }
  function assets() {
    if(!assetsPromise)assetsPromise=Promise.all(['assets/fonts/pdf-regular.ttf','assets/fonts/pdf-bold.ttf'].map(async file=>{
      const r=await fetch(new URL(file,document.baseURI));if(!r.ok)throw Error(file);return base64(await r.arrayBuffer());
    })).catch(error=>{assetsPromise=undefined;throw error;});
    return assetsPromise;
  }
  function build(data,fonts) {
    const PDF=globalThis.jspdf.jsPDF;
    const doc=new PDF({unit:'mm',format:'a4',compress:true});
    doc.addFileToVFS('regular.ttf',fonts[0]);doc.addFont('regular.ttf','Ficha','normal');
    doc.addFileToVFS('bold.ttf',fonts[1]);doc.addFont('bold.ttf','Ficha','bold');
    doc.setProperties({title:data.labels.titulo,subject:data.reflection.pergunta,author:'SE7Ti'});
    const left=18,width=174,bottom=276;let y=44;
    function pageHeader(){
      doc.setFillColor('#0B3445');doc.rect(0,0,210,32,'F');
      doc.setTextColor('#FFFFFF');doc.setFont('Ficha','bold');doc.setFontSize(19);doc.setFontSize(Math.min(19,19*width/doc.getTextWidth(data.labels.titulo)));doc.text(data.labels.titulo,left,16);
      doc.setFont('Ficha','normal');doc.setFontSize(9);doc.text(data.project+'  |  SE7Ti',left,24);
    }
    function ensure(space){if(y+space>bottom){doc.addPage();pageHeader();y=44;}}
    function text(value,{bold=false,size=11,color='#243F4B',after=4}={}){
      doc.setFont('Ficha',bold?'bold':'normal');doc.setFontSize(size);
      const lines=doc.splitTextToSize(String(value||''),width);
      for(const line of lines){ensure(5.7);doc.setFont('Ficha',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(color);doc.text(line,left,y);y+=5.7;}
      y+=after;
    }
    function section(label){ensure(20);y+=3;doc.setDrawColor('#CDD8D3');doc.line(left,y-4,192,y-4);text(label,{bold:true,size:12,color:'#0B3445',after:5});}
    pageHeader();
    for(const [label,value] of [[data.labels.fase,data.phase.titulo],[data.labels.assunto,data.subject.titulo],[data.labels.reflexao,data.reflection.pergunta]]){
      ensure(18);text(label,{bold:true,size:9,color:'#596F1B',after:0});text(value);
    }
    if(data.practices.length){
      section(data.labels.praticasTitulo);
      for(const practice of data.practices){
        ensure(18);text(practice.texto,{after:0});
        text([practice.done?data.labels.jaFazemos:'',practice.improve?data.labels.queroMelhorar:''].filter(Boolean).join(' / '),{size:9,color:'#596F1B',after:5});
      }
    }
    data.answers.forEach((answer,i)=>{section(data.fields[i]);text(answer||' ',{after:6});});
    const count=doc.getNumberOfPages();
    for(let i=1;i<=count;i++){doc.setPage(i);doc.setDrawColor('#D5DED9');doc.line(left,283,192,283);doc.setFont('Ficha','normal');doc.setFontSize(8);doc.setTextColor('#46585C');doc.text('SE7Ti',left,289);doc.text(`${i} / ${count}`,192,289,{align:'right'});}
    return doc;
  }
  async function download(data){const fonts=await assets();const doc=build(data,fonts);doc.save('plano-de-melhoria-pontual-da-arquitetura.pdf');}
  return {build,download};
})();
