# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

Requires **Bun 1.4+**. The SvelteKit server, SQLite, and compile step all run on Bun (`bun --bun`).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.17.0 create --template minimal --types ts --add prettier tailwindcss="plugins:typography,forms" drizzle="database:sqlite+sqlite:better-sqlite3" paraglide="languageTags:en, id+demo:yes" --install bun marketo-web
```

The generated app used `better-sqlite3` and `adapter-auto`. This repo now uses `bun:sqlite` and `@sveltejs/adapter-bun`.

## Developing

Install with Bun, then start a development server:

```sh
bun install
bun run dev
```

`bun run dev` is `bun --bun vite dev` so SSR can import `bun:sqlite`. Pass `--open` to open a browser tab.

## Building

A normal production build writes a Bun server to `build/` (client assets beside it):

```sh
bun run build
bun ./build
```

Preview that output with `bun run preview`.

## Compiled binaries

`bun run compile` produces three standalone executables in `dist/` (Bun runtime embedded; the host does not need Bun or Node):

| Binary                 | Process                 |
| ---------------------- | ----------------------- |
| `dist/marketo-web`     | SvelteKit HTTP server   |
| `dist/bot-dreamdex`    | Example vault operator  |
| `dist/bot-performance` | Read-only stats indexer |

```sh
bun run compile
DATABASE_URL=local.db ./dist/marketo-web
DATABASE_URL=local.db ./dist/bot-performance
# operator key stays in env / .env next to the process — never compiled in
./dist/bot-dreamdex
```

Run `compile:web` before the bot compiles: the web adapter wipes `dist/` when `COMPILE=1`. Cross-compile with `COMPILE_TARGET=bun-linux-x64 bun run compile` (see [Bun compile targets](https://bun.com/docs/bundler/executables)).

`PUBLIC_*` is inlined into the web client at compile time. `DATABASE_URL`, `OPERATOR_PRIVATE_KEY`, and other private env are read at runtime (compiled binaries still load `.env` from the working directory). Optional `BOT_STATE_DIR` sets where `bot-dreamdex` writes `markets.json` (default: `.state` in the current working directory when compiled).
