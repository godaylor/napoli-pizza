<!-- generated-by: gsd-doc-writer -->
# Getting started

## Prerequisites

- Node.js `24.20.0` (`.nvmrc`); supported engine range is `>=24.15.0 <25.0.0`.
- npm and Git.
- Для browser tests — Playwright Chromium, Firefox и WebKit.

Приложению не нужны `.env`-файлы, backend, auth или платёжный провайдер.

## Installation steps

```bash
git clone https://github.com/godaylor/napoli-pizza.git 06-napoli
cd 06-napoli
npm ci
npx playwright install chromium firefox webkit
```

Для обычной локальной разработки вместо clean install допустим `npm install`; release/CI используют `npm ci`.

## First run

На Windows `npm.ps1` может использовать соседний системный `node.exe`, даже если PATH указывает на другой Node. Проверяйте runtime не только командой `node --version`: запускайте npm CLI через точный Node. В этой сессии Node `24.20.0` был получен через `npm exec --yes --package=node@24.20.0 --call "node -p process.execPath"`; затем `npm-cli.js` и локальные CLI инструментов запускались этим абсолютным executable. Глобальные настройки Node не менялись. Путь npm CLI зависит от установки; не копируйте чужой абсолютный путь.

```bash
npm run dev
```

Откройте URL из вывода Vite. Корневой маршрут перенаправит на `/menu`.

## Common setup issues

- `EBADENGINE`: активен не Node `24.20.0`. Переключите runtime по `.nvmrc` и повторите `npm ci`.
- Playwright сообщает, что executable не найден: выполните `npx playwright install chromium firefox webkit`.
- Порт `32500` занят: определите владельца процесса. Не останавливайте чужой процесс; дополнительный preview допускается только на проверенном свободном порте `32501–32599` с `--strictPort`.
- Direct route возвращает 404 после самостоятельного hosting: включите SPA rewrite из `vercel.json` или эквивалент вашего провайдера.

## Next steps

Команды и правила разработки описаны в [DEVELOPMENT.md](DEVELOPMENT.md), тестовая стратегия — в [TESTING.md](TESTING.md), release runbook — в [RELEASE.md](RELEASE.md).
