# Gerenciador de Figurinhas Copa 2026

Aplicacao web/PWA para controlar figurinhas do album da Copa do Mundo 2026, com dashboard, album, busca, repetidas, faltantes, filtros e exportacao de texto.

O app usa Supabase como banco online. O `localStorage` nao e mais fonte principal de dados; ele e lido apenas uma vez para migrar progresso antigo quando a tabela online ainda esta vazia.

## Criar um projeto dedicado no Supabase

Nome sugerido para o projeto: `album-copa-2026-figurinhas`.

1. Acesse [Supabase](https://supabase.com) e entre na sua conta.
2. Clique em `New project`.
3. Escolha a organizacao correta.
4. Em `Project name`, use `album-copa-2026-figurinhas`.
5. Em `Database Password`, gere uma senha forte e guarde em um gerenciador de senhas.
6. Em `Region`, escolha a regiao mais proxima do seu uso principal. Para Brasil, normalmente `South America (Sao Paulo)` quando disponivel; se nao aparecer, use a regiao com menor latencia.
7. Em `Pricing Plan`, escolha `Free` para MVP.
8. Clique em `Create new project` e aguarde a conclusao.

## Criar as tabelas

1. No painel do projeto Supabase, abra `SQL Editor`.
2. Clique em `New query`.
3. Cole todo o conteudo de [`supabase/schema.sql`](./supabase/schema.sql).
4. Clique em `Run`.

Esse SQL cria:

- `album_metadata`: dados gerais do album.
- `album_sessions`: sessao compartilhada do album.
- `stickers`: cadastro dos 994 codigos.
- `sticker_status`: posse, repetidas e data de atualizacao por codigo.

Ele tambem configura relacionamentos, RLS para a `anon public key`, triggers de `updated_at` e realtime em `sticker_status`.

## Pegar as credenciais

1. No painel do Supabase, abra `Project Settings`.
2. Clique em `API`.
3. Copie `Project URL`.
4. Na secao `Project API keys`, copie a chave `anon public`.

Depois abra [`src/supabase-config.js`](./src/supabase-config.js) e preencha:

```js
export const SUPABASE_URL = "COLE_AQUI_A_PROJECT_URL";
export const SUPABASE_ANON_KEY = "COLE_AQUI_A_ANON_PUBLIC_KEY";
export const FIXED_SESSION_ID = "album-principal";
```

A anon key e publica e pode ficar no frontend. Nao coloque a `service_role key` no projeto.

## Como rodar localmente

```bash
npm run dev
```

Depois abra `http://localhost:4173`.

## Estrutura do album

O cadastro base fica em [`src/albumData.js`](./src/albumData.js).

- FWC - Parte 1: 9 figurinhas, de `00` a `FWC8`.
- FWC - Parte 2: 11 figurinhas, de `FWC9` a `FWC19`.
- 48 selecoes com 20 figurinhas cada, como `MEX1` ate `MEX20` e `BRA1` ate `BRA20`.
- Coca-Cola: `CC1` ate `CC14`.
- Total: 994 figurinhas.

## Publicar no GitHub Pages

1. Preencha [`src/supabase-config.js`](./src/supabase-config.js).
2. Execute `npm run check`.
3. Commit e push:

```bash
git add .
git commit -m "Integrate Supabase storage"
git push
```

4. No GitHub, abra `Settings > Pages`.
5. Confirme que a publicacao aponta para a branch correta.

## Testar a integracao

1. Abra o app em dois navegadores ou em notebook e celular.
2. Marque uma figurinha como possuida em um dispositivo.
3. Adicione uma repetida.
4. Atualize o outro dispositivo ou aguarde o realtime.
5. Confirme que os numeros de progresso, possuidas e repetidas batem.

Para verificar diretamente no Supabase:

1. Abra `Table Editor`.
2. Entre na tabela `sticker_status`.
3. Filtre por `session_id = album-principal`.
4. Confira as colunas `codigo`, `possui`, `repetidas`, `quantidade_total` e `updated_at`.

## Validacao

```bash
npm run check
```
