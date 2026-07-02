# CLAUDE.md — goal workflow loop курсу «Git for Power BI specialists»

Інтерактивний багатосторінковий курс. Статичний сайт без збірки: чистий HTML/CSS/JS у `docs/`, деплой на GitHub Pages через Actions.

## Goal workflow loop (цикл розробки)

Цикл: **цілі → збірка → QA → ітерація**. Зміна вважається готовою лише коли всі цілі виконані.

| Ціль | Опис | Перевірка |
|---|---|---|
| G1 | Кожна сторінка виконується без JS-помилок | `scripts/qa.mjs` (jsdom) |
| G2 | Кожен `data-p/q/qc/cs/o/s` резолвиться в дані рушія і віджет реально рендериться | `scripts/qa.mjs` |
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
  index.html            головна: картки модулів + прогрес
  modules/NN-slug.html  10 сторінок-модулів, 52 уроки (секції s0..sN)
  assets/app.css        уся стилізація
  assets/engine.js      дані (PLAYERS/QUIZ/SCEN/QCHECKS/CSIM/ORDERS/GIT_CMDS) + віджети + пошук + прогрес
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
- **Критичне правило процесу**: командний потік у курсі — `feature/* → merge у main → push → Git sync Dev workspace → deployment pipeline Dev→Prod`. PR-review **не** подається як обов'язковий етап (diff PBIP/PBIR непрактичний для людського рев'ю); Azure DevOps policies/CI(BPA) — опційний автоматичний бар'єр. Не переписувати.
- Апострофи в JS-рядках даних — лише всередині template-літералів (backticks).

## Конвенції віджетів

`<div class="gplayer" data-p="key">` покроковий SVG-граф · `<div class="scplayer" data-s="key">` мультирепо-сценарій · `<div class="quiz" data-q="bank">` банк вправ · `<div class="qcheck" data-qc="key">` міні-перевірка · `<div class="csim" data-cs="key">` симулятор команди · `<div class="order" data-o="key">` впорядкування кроків. Дані — у відповідних об'єктах `engine.js`; ключ без даних = FAIL у QA.

Додаючи урок: секція `s{n}` на сторінці + пункт у сайдбар-TOC + лічильник `data-total` картки на `index.html` + запис у `pages.json` + перегенерувати індекс.

## Backlog

- csim/order-покриття у модулях 04–08 (зараз найгустіше в 01/03).
- Задачі «прочитай diff і знайди проблему» як окремий тип віджета (зараз — через qcheck).
- Друкована шпаргалка команд (окрема сторінка print-css).
- Самодіагностика рівня на старті з рекомендацією модуля.
