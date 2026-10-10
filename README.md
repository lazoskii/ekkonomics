# Ekko (Ekkonomics)

App simples de controle de cartões e gastos mensais. PWA instalável — sem backend, sem build, sem dependências: HTML/CSS/JS puro.

## Funcionalidades

- Cadastro de cartões (nome, cor, limite, dia de fechamento e de vencimento)
- Lançamento de gastos individuais (descrição, valor, data, categoria)
- **Fatura manual por cartão/mês**: se não quiser lançar compra por compra, dá pra digitar direto o valor total da fatura do mês na tela inicial — ele substitui a soma dos gastos lançados naquele cartão/mês (volta a somar automaticamente se você apagar o valor manual)
- Dashboard com total do mês, total por cartão, total por categoria e próximos vencimentos
- Navegação por mês (setas no topo)
- Backup: exportar/importar tudo como `.json`
- Instalável como app (PWA) no Android, iOS e desktop, com suporte a uso offline

## Onde os dados ficam

Tudo fica salvo em `localStorage`, só no navegador/dispositivo onde o app é usado — não há servidor nem conta de usuário. Para levar os dados de um aparelho para outro, use **Mais → Exportar backup** e depois **Importar backup** no outro aparelho.

## Rodando localmente

Não precisa de build. Só precisa servir os arquivos por `http://` (Service Worker não funciona em `file://`):

```
python -m http.server 8000
```

Depois abra `http://localhost:8000`. No Windows, dê duplo clique em `Abrir App.bat` que ele já sobe o servidor e abre o navegador (arquivo local, não versionado no git).

## Deploy / atualizar o site publicado

O app está publicado via **GitHub Pages**, direto da branch `main` (pasta raiz). Pra atualizar o site:

```
git add -A
git commit -m "sua mensagem"
git push
```

O GitHub Pages redeploya automaticamente em ~1 minuto depois do push.

## Instalar no iPhone

1. Abra o link do GitHub Pages no **Safari** (precisa ser Safari, não funciona o "Adicionar à Tela de Início" em outros navegadores no iOS)
2. Toque em Compartilhar → **Adicionar à Tela de Início**
3. A partir daí funciona offline — o Service Worker guarda os arquivos em cache, não depende mais de internet nem de nenhum servidor rodando

## Regenerando os ícones

Os ícones em `icons/` são gerados programaticamente (sem arquivo de imagem fonte) por `make_icons.py`:

```
python make_icons.py
```

Precisa do Pillow (`pip install pillow`). Se mudar tamanhos ou nomes de arquivo, atualize também `manifest.webmanifest` e as tags `<link>` em `index.html`.

## Estrutura dos arquivos

```
index.html              estrutura das 4 telas + os 2 modais (cartão, gasto)
style.css                visual (tema claro/escuro automático via prefers-color-scheme)
app.js                    toda a lógica: estado, storage, renderização, eventos
sw.js                     service worker (cache offline do PWA)
manifest.webmanifest      metadados do PWA (nome, ícones, cores)
make_icons.py             gera os ícones em icons/
icons/                    ícones do PWA em vários tamanhos
```

Para o histórico de mudanças, veja [CHANGELOG.md](CHANGELOG.md).
