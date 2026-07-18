# CLAUDE.md — goal workflow loop курсу «Git for Power BI specialists»

Інтерактивний багатосторінковий курс. Статичний сайт без збірки: чистий HTML/CSS/JS у `docs/`, деплой на GitHub Pages через Actions.

## Goal workflow loop (цикл розробки)

Цикл: **цілі → збірка → QA → ітерація**. Зміна вважається готовою лише коли всі цілі виконані.

| Ціль | Опис | Перевірка |
|---|---|---|
| G1 | Кожна сторінка виконується без JS-помилок | `scripts/qa.mjs` (jsdom) |
| G2 | Кожен `data-p/q/qc/cs/o/s/tl` резолвиться в дані рушія і віджет реально рендериться; кожен termlab-`sol` розв'язує свій `goal` (replay G2c) | `scripts/qa.mjs` |
| G3 | Пошук працює на кожній сторінці; індекс покриває всі секції; записи індексу валідні | `scripts/qa.mjs` |
| G4 | Усі внутрішні посилання та якорі валідні | `scripts/qa.mjs` |
| G5 | Прогрес пишеться в localStorage; картки модулів на головній рендеряться | `scripts/qa.mjs` |
| G6 | Кожен урок має блок «Ціль» і мінімум один інтерактив (WARN, не блокер) | `scripts/qa.mjs` |
| G7 | Workflow `qa-and-deploy` зелений; живий Pages-URL відкривається і показує головну | GitHub Actions + ручний/агентний фетч URL |

Команди циклу:

```bash
npm install                      # разово (jsdom для QA)
node scripts/build-search-index.mjs   # після БУДЬ-ЯКОЇ зміни контенту
node scripts/qa.mjs              # exit 0 = цілі G1–G6 виконані
```

Ітеруй до `FAIL=0`. `WARN` (G6) — зменшувати, коли дешево.

## Структура

```
docs/
  index.html            головна: самодіагностика рівня (#diagBox, банк DIAG, buildDiag; рекомендація за першою прогалиною) + картки модулів + картки практикуму + прогрес
  modules/NN-slug.html  10 сторінок-модулів, 67 уроків (секції s0..sN)
  modules/prN-slug.html 5 сторінок практикуму (pr1-osnovy..pr5-ekzamen, 20 секцій задач; лежать у modules/, бо sitePrefix() розпізнає лише цей шлях)
  modules/10-cheatsheet.html друкована шпаргалка (рендер GIT_CMDS через buildCheatsheet + @media print в app.css; кнопка #printBtn)
  assets/app.css        уся стилізація
  assets/engine.js      дані (PLAYERS/QUIZ/SCEN/QCHECKS/CSIM/ORDERS/TERMLAB/GIT_CMDS) + віджети (вкл. termlab-рушій: стан репо, парсер git-команд, goal-DSL) + пошук + прогрес
  assets/search-index.js  генерується скриптом, руками не правити
  assets/pages.json     мапа сторінок/уроків (використовують scripts/*)
  version.json          генерується ЛИШЕ в CI (deploy.yml пише SHA коміту) — клієнт полить його і авто-оновлює сторінку; локально файла немає, перевірка мовчки вимкнена
scripts/qa.mjs          QA-гейт goal-циклу
scripts/build-search-index.mjs
.github/workflows/deploy.yml   G7: QA-гейт + деплой docs/ на Pages + штамп version.json
```

Source of truth — файли в `docs/`. Разовий міграційний скрипт зі старої однофайлової версії в репозиторії не зберігається.

## Правила контенту

- Мова: українська, «простими словами», кожен новий термін — визначення + побутова аналогія + приклад з Power BI.
- Шаблон уроку: Ціль (`.goalbox`) → пояснення → приклад PBI → інтерактив → міні-перевірка (`.qcheck`) → «Урок пройдено» (donebar додає рушій).
- **Критичне правило процесу**: командний потік у курсі — `feature/* → merge у main → push → Git sync (Update from Git) публікує в робочу область` — це базова («звичайна») публікація. Deployment pipeline (Dev→Prod) — **опційний** рівень для команд з окремими середовищами, не обов'язкова частина процесу. PR-review **не** подається як обов'язковий етап (diff PBIP/PBIR непрактичний для людського рев'ю); Azure DevOps policies/CI(BPA) — опційний автоматичний бар'єр. Не переписувати.
- Апострофи в JS-рядках даних — лише всередині template-літералів (backticks).

## Конвенції віджетів

`<div class="gplayer" data-p="key">` покроковий SVG-граф · `<div class="scplayer" data-s="key">` мультирепо-сценарій · `<div class="quiz" data-q="bank">` банк вправ · `<div class="qcheck" data-qc="key">` міні-перевірка · `<div class="csim" data-cs="key">` симулятор команди · `<div class="order" data-o="key">` впорядкування кроків · `<div class="termlab" data-tl="key">` інтерактивний тренажер терміналу (вільне введення git-команд + жива SVG-схема стану репо) · `<div class="diffq" data-dq="key">` задача «прочитай diff» (файл + розфарбований diff + питання; дані у `DIFFQ`; `colorizeDiffPre` також авто-підсвічує +/− у `<pre>`-diff квізів) · `<div class="ytvideo" data-v="key">` відео українською (клік-фасад → офіційний `youtube-nocookie` embed із таймкодом; дані у `VIDEOS`, спільний ID/канал у константах `YT_*`). Дані — у відповідних об'єктах `engine.js`; ключ без даних = FAIL у QA.

Правила termlab: задача = `{title, task, init, goal, hints[], sol[], ok}`; `init` — декларативний стан (commits/branches/head/files/remote/tracking); `goal` — лише ключі з `TL_GOAL_KEYS` (невідомий ключ = FAIL G2c); `sol` мусить реально розв'язувати `goal` — QA (G2c) програє його через сам симулятор. Merge-конфлікти органічні: конфлікт виникає, коли обидві гілки від merge-base чіпали той самий файл (поле `files` у комітах init), підтримується кілька файлів одночасно і `git merge --abort`; `conflictOn` в init — примусовий override. Схематична задача — не окремий віджет, а патерн: опис ситуації → `gplayer` з ключем `pr_*` → `qcheck`. Дані termlab-задач не мають суперечити критичному правилу процесу. `engine.js` не розбивати на кілька файлів без правки `loadDom` у `qa.mjs` (він інлайнить лише `search-index.js` + `engine.js`).

Правило відео: лише офіційний iframe-embed (не завантажувати/не рехостити); перед додаванням перевіряти дозвіл автора через oEmbed (`youtube.com/oembed?url=…`); авторські таймкоди-розділи тягнути через `yt-dlp --print "%(chapters)j"`; видима атрибуція каналу обов'язкова. Наразі одне джерело — курс «GIT та GITHUB українською» (Нікіта Тимошенко, @ion_lab), прив'язаний до модулів 00–05 і 07; PBIP/advanced (06/08/09) україномовного відео не мають.

Додаючи урок: секція `s{n}` на сторінці + пункт у сайдбар-TOC + лічильник `data-total` картки на `index.html` + запис у `pages.json` + перегенерувати індекс.

## Backlog

- (порожній — усе заплановане реалізовано; нові ідеї додавати сюди)
