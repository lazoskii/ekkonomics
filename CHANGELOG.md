# Changelog

Registro das mudanças do app, da mais recente para a mais antiga.

## 2026-10-09

- **Fatura manual por cartão**: nova forma de lançar gastos — digite direto o
  valor total da fatura do mês de um cartão na tela inicial, sem precisar
  lançar compra por compra. Quando um valor manual existe, ele substitui a
  soma dos gastos individuais daquele cartão/mês nos totais do app; apagar o
  campo volta a somar os gastos automaticamente.
- Renomeado para **Ekkonomics** (nome completo) / **Ekko** (apelido usado no
  ícone da tela inicial).
- Publicado no **GitHub Pages**, permitindo instalar como PWA no iPhone
  (Safari → Adicionar à Tela de Início) funcionando 100% offline depois da
  primeira instalação, sem depender do PC ligado.
- Corrigido o layout em navegadores desktop largos: topbar, botão "+" e
  barra de navegação inferior não acompanhavam a coluna centralizada do
  conteúdo (ficavam grudados nas bordas da janela).
- Criado atalho de um clique no Windows (`Abrir App.bat` + atalho na Área de
  Trabalho) que sobe o servidor local e abre o app no navegador.
- Revisão de código: pequena limpeza de duplicação (`expensesForCard`) e
  comentários explicativos em `app.js`, `index.html`, `style.css`, `sw.js` e
  `make_icons.py`. Criados este changelog e o `README.md`.

## Antes

- Versão inicial do app: cadastro de cartões (nome, cor, limite, dias de
  fechamento/vencimento), lançamento de gastos por categoria, dashboard com
  totais por cartão/categoria e próximos vencimentos, navegação por mês,
  backup via export/import de `.json`, e configuração como PWA instalável
  (manifest + service worker para uso offline).
