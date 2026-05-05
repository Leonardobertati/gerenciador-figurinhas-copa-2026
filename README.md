# Gerenciador de Figurinhas Copa 2026

MVP web/PWA para controlar figurinhas do álbum Panini da Copa do Mundo 2026, com visual mobile-first, modo escuro, dashboard, álbum, busca, repetidas, faltantes e exportação de texto para WhatsApp.

## Como rodar localmente

Como o app é estático, você pode usar qualquer servidor local.

Opção com Node:

```bash
npm run dev
```

Ou diretamente:

```bash
node scripts/server.js
```

Depois abra `http://localhost:4173` no navegador.

## Configurar Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute o arquivo `supabase/schema.sql`.
4. Abra `src/supabase-config.js`.
5. Preencha:

```js
export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
export const SUPABASE_ANON_KEY = "SUA_ANON_PUBLIC_KEY";
```

Sem essas chaves, o app funciona em modo local usando `localStorage`, útil para testar a interface. Com as chaves preenchidas, o progresso é salvo na tabela `user_sticker_status`.

## Estrutura dos dados

O cadastro do álbum fica em `src/albumData.js`.

O app gera:

- FWC - Parte 1: 9 figurinhas, de `00` a `FWC8`
- FWC - Parte 2: 11 figurinhas, de `FWC9` a `FWC19`
- 48 seleções com 20 figurinhas cada
- Coca-Cola: 14 figurinhas, de `CC1` a `CC14`
- Total: 994 figurinhas

Cada figurinha usa:

```js
{
  codigo: "MEX1",
  secao: "México",
  grupo: "Grupo A",
  ordemSecao: 3,
  ordemFigurinha: 1,
  colada: false,
  repetidas: 0
}
```

## Regras de quantidade

- `colada = true`: a figurinha está marcada no álbum
- `colada = false`: a figurinha não está marcada no álbum
- `repetidas`: quantidade de figurinhas repetidas daquele código

Coladas e repetidas são separadas. Assim, é possível ter `colada = false` e `repetidas = 2`.

Cálculos:

- Coladas: figurinhas com `colada = true`
- Faltando: figurinhas com `colada = false`
- Repetidas: soma de `repetidas`

## Uso

- Toque em uma figurinha sem quantidade para marcar como tenho.
- Toque e segure em uma figurinha para abrir opções.
- Em repetidas ou faltantes, use o botão de exportação para gerar texto copiável.
- A busca localiza por código, como `MEX1`, `FWC8` ou `CC14`.

## Publicação

Você pode publicar como site estático em Vercel, Netlify, GitHub Pages ou Supabase Storage. Antes de publicar, confirme que `src/supabase-config.js` contém a URL e a anon/public key corretas do Supabase.

## Validação

Para validar a quantidade e a ordem básica do álbum:

```bash
npm run check
```
