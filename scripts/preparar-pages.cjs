'use strict';
// Copia somente os arquivos públicos. Não exige pacotes npm.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');
const publicFiles = ['index.html', 'styles.css', 'app.js', 'ficha-pdf.js', 'assets', 'dados', 'CNAME', '.nojekyll'];
fs.mkdirSync(output, { recursive: true });
for (const file of publicFiles) fs.cpSync(path.join(root, file), path.join(output, file), { recursive: true });

// Verifica os nomes com distinção de maiúsculas, inclusive no Windows.
function resource(relative) {
  let current = output;
  for (const part of relative.split('/')) {
    assert.ok(part && part !== '..' && part !== '.', `Caminho inválido: ${relative}`);
    assert.ok(fs.readdirSync(current).includes(part), `Recurso ausente ou capitalização incorreta: ${relative}`);
    current = path.join(current, part);
  }
  assert.ok(fs.statSync(current).isFile(), `Não é arquivo: ${relative}`);
  for (const base of ['https://togafemmovimento.se7ti.com.br/', 'https://hadeliane.github.io/togaf-em-movimento/']) {
    const url = new URL(relative, base);
    assert.equal(url.origin, new URL(base).origin);
    assert.ok(url.pathname.startsWith(new URL(base).pathname));
  }
}
const read = file => fs.readFileSync(path.join(output, file), 'utf8');
for (const match of read('index.html').matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (!match[1].startsWith('#')) resource(match[1]);
}
for (const match of read('styles.css').matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) resource(match[1]);
const config = JSON.parse(read('dados/config.json'));
resource(config.inicial.imagemADM);
for (const phase of Object.values(config.inicial.fases)) resource(phase.imagem);
for (const phase of JSON.parse(read('dados/fases.json'))) JSON.parse(read('dados/' + phase.arquivo));
for (const font of ['regular', 'bold']) resource(`assets/fonts/pdf-${font}.ttf`);
assert.equal(read('CNAME').trim(), 'togafemmovimento.se7ti.com.br');
console.log('OK: arquivos públicos preparados em _site; imagens, fontes, scripts, JSON e caminhos verificados.');
