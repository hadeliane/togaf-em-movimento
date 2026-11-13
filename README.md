# TOGAF® em Movimento

Aplicação estática em HTML, CSS e JavaScript. Execute `node servir.cjs` nesta pasta e abra http://127.0.0.1:4173. O carregamento dos JSON exige HTTP; não abra index.html via file://.

Publique index.html, app.js, ficha-pdf.js, styles.css, assets/ e dados/ em qualquer hospedagem estática, preservando a estrutura. Os caminhos são relativos e permitem publicação em subpastas. Não há instalação de dependências ou etapa de compilação. A biblioteca jsPDF 4.2.1 e sua licença estão incluídas em assets/vendor/.

## Conteúdo

- dados/config.json: identidade textual e rótulos da interface.
- dados/fases.json: índice ordenado das dez opções do ADM.
- dados/preliminar.json e demais arquivos: metadados, assuntos e reflexões.

Para acrescentar conteúdo, edite a coleção assuntos no JSON da fase. Cada assunto possui id, titulo, icone, descricao e reflexoes; cada reflexão possui id, titulo, pergunta e apoio. Preserve os IDs publicados, pois identificam a navegação e as respostas em memória. Use IDs únicos dentro de cada coleção. As demais fases começam com assuntos: [].

## Identidade visual

Referência local: `D:\Dropbox\SE7TI\Comercial\Marketing\Site\2026 - SE7Ti no LS Group\public`. Logotipo e fontes Inter foram copiados dessa referência. Cores e componentes se baseiam em site.css e editorial.css. Não foi localizado um cabeçalho específico aprovado para esta aplicação; a composição utiliza os textos fornecidos e os estilos institucionais existentes.

## Ficha e privacidade

Respostas e marcações ficam em memória, por reflexão, e são preservadas ao voltar entre etapas. Atualizar ou fechar a página apaga essas informações. Nada é enviado ao servidor. “Gerar minha ficha” baixa um PDF A4 diretamente, com texto selecionável, fontes incorporadas e paginação para respostas extensas. A geração é feita inteiramente no navegador, com jsPDF e fontes locais; não usa CDN nem a janela de impressão.

Uma reflexão pode conter `praticas: [{"id":"id-estavel","texto":"Prática concreta."}]`. A seção só aparece quando essa lista não está vazia. As marcações são opcionais; cada prática marcada é acrescentada em uma nova linha no campo correspondente, preservando o texto existente e evitando duplicações. Desmarcar não apaga o texto editável. Rótulos, orientações e mensagens da ficha ficam em `dados/config.json`, no objeto `ficha`. Textos introdutórios de cada fase ficam em `inicial.fases[id].introducao`.

Verificações: `node tests/fluxo.cjs` e `node tests/pdf.cjs`.

## Publicação no GitHub Pages

Repositório: https://github.com/hadeliane/togaf-em-movimento

Endereço final: https://togafemmovimento.se7ti.com.br/

O site usa HTML, CSS e JavaScript puros, JSON, fontes locais e jsPDF local. Não precisa de npm, framework, servidor de aplicação ou compilação. Os caminhos relativos existentes foram preservados: não adicione `/togaf-em-movimento/` nem URLs do Dropbox aos recursos. A navegação por hash (`#/preliminar/...`) permite abrir links internos e atualizar a página no Pages sem regras de redirecionamento ou `404.html`.

O workflow `.github/workflows/pages.yml` testa as fichas e o PDF, prepara `_site/` e publica esse diretório. Dispara em push para `main` ou manualmente na aba Actions; pull requests para `main` executam as verificações sem publicar. `scripts/preparar-pages.cjs` copia somente os arquivos públicos e verifica imagens, fontes, JSON, scripts e capitalização de nomes para Linux. Testes, PDFs de exemplo, README e arquivos de desenvolvimento ficam fora da publicação. `_site/` e `tmp/` são ignorados pelo Git.

### 1. Enviar os arquivos

Envie o conteúdo desta pasta para a raiz do repositório, incluindo `.github/workflows/pages.yml`, `.gitignore`, `.nojekyll`, `scripts/`, `tests/` e `CNAME`. Não envie a pasta inteira dentro de outra pasta no repositório. Não envie `_site/` nem `tmp/`.

Para usar Git, esta pasta ainda não tinha repositório inicializado na preparação. Se o repositório remoto estiver vazio, execute nesta pasta:

```powershell
git init -b main
git add .
git commit -m "Prepara publicação do TOGAF em Movimento no GitHub Pages"
git remote add origin https://github.com/hadeliane/togaf-em-movimento.git
git push -u origin main
```

Se o remoto já tiver commits, clone-o em outra pasta e copie estes arquivos para lá antes de criar o commit. Não use push forçado. Pelo navegador, confirme que os arquivos ocultos também foram enviados.

### 2. Configurar o GitHub

1. No repositório, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Em **Custom domain**, informe `togafemmovimento.se7ti.com.br` e salve, antes de apontar o DNS.
3. Confira se Actions está habilitado no repositório e se a branch usada é `main`. Se a branch principal tiver outro nome, ajuste os dois filtros no workflow.
4. Depois do envio, acompanhe **Actions → Publicar no GitHub Pages**. Se necessário, use **Run workflow** na branch `main`. O ambiente `github-pages` deve permitir publicação dessa branch.
5. Após a validação do DNS e emissão do certificado, habilite **Enforce HTTPS** em Pages. Se a opção ainda estiver indisponível, aguarde e consulte o diagnóstico de DNS em Pages.

O arquivo `CNAME` documenta o endereço e permite publicação alternativa por branch. Com GitHub Actions, ele não configura o domínio automaticamente: o passo em **Settings → Pages** é obrigatório. Não são necessários tokens pessoais ou secrets para este workflow. O repositório precisa estar em um plano/visibilidade que permita GitHub Pages (em GitHub Free, use repositório público).

### 3. Configurar somente o subdomínio no DNS

Hospedar o site principal no Wix não garante que o DNS seja administrado lá. Se o Wix gerencia os nameservers, abra **Domínios → se7ti.com.br → Ações do domínio → Gerenciar registros DNS**. Se o domínio foi conectado ao Wix por apontamento, faça a alteração no provedor que administra o DNS.

| Tipo | Nome/Host | Destino/Valor |
| --- | --- | --- |
| CNAME | `togafemmovimento` | `hadeliane.github.io` |

O destino não leva `https://`, caminho ou nome do repositório. Se o painel pedir o nome completo, use `togafemmovimento.se7ti.com.br`. Use o TTL padrão. Caso já exista registro para **esse mesmo subdomínio**, ajuste-o para evitar conflito com o CNAME.

Mantenha os registros de `@`, `www`, e-mail e os nameservers atuais: assim `se7ti.com.br` continua no Wix. Não configure redirecionamento de URL ou iframe no lugar do CNAME. A propagação pode levar até 48 horas.

### 4. Conferência após publicar

- Abra o endereço final com HTTPS e confira logotipo, diagrama ADM, imagens das fases e fontes.
- Entre em uma fase, assunto e reflexão. Copie a URL com `#`, abra em outra aba e atualize; a mesma ficha deve abrir.
- Digite respostas com acentos e marque práticas; navegue para trás e retorne. As respostas persistem durante a sessão, mas são apagadas ao atualizar ou fechar a página.
- Clique em **Gerar minha ficha**: deve baixar um PDF A4 com as respostas. Abra o PDF e use a impressão do leitor para imprimir. Respostas extensas geram várias páginas.
- A impressão direta da página pelo navegador também inclui os textos preenchidos; a geração pelo botão continua sendo o fluxo principal para salvar a ficha.

### Verificação local

```powershell
node tests/fluxo.cjs
node tests/pdf.cjs
node scripts/preparar-pages.cjs
node servir.cjs
```

Os testes de PDF geram exemplos em `tmp/pdfs/`. A preparação gera `_site/`. O servidor local serve esta pasta em http://127.0.0.1:4173. Não abra `index.html` por `file://`.

Referências: [workflow do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [domínio personalizado](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) e [CNAME no Wix](https://support.wix.com/en/article/adding-or-updating-cname-records-in-your-wix-account).
