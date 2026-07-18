// qa.mjs — goal workflow loop: перевірка цілей G1–G7; exit 1, якщо є FAIL
import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
const {JSDOM, VirtualConsole} = require('jsdom');

const ROOT = path.resolve(process.cwd(), 'docs');
const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
const engineSrc = fs.readFileSync(path.join(ROOT, 'assets/engine.js'), 'utf8');
const indexSrc = fs.readFileSync(path.join(ROOT, 'assets/search-index.js'), 'utf8');

let fails = 0, warns = 0;
const F = m => {fails++; console.log('FAIL', m);};
const W = m => {warns++; console.log('WARN', m);};
const OK = m => console.log('ok  ', m);

function loadDom(file) {
  let html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  html = html
    .replace(/<script src="[^"]*search-index\.js"><\/script>/, () => '<script>' + indexSrc + '</script>')
    .replace(/<script src="[^"]*engine\.js"><\/script>/, () => '<script>//ENGINE\n' + engineSrc + '</script>')
    .replace(/<link rel="stylesheet"[^>]*>/g, '')
    .replace(/<link[^>]*fonts[^>]*>/g, '');
  const errs = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => {if (!/Not implemented/.test(e.message)) errs.push(e.message);});
  const dom = new JSDOM(html, {runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'https://x.test/' + file});
  return {dom, errs};
}

const allFiles = ['index.html', ...pages.map(p => p.file)];
const anchorMap = {};
const attrKinds = [['data-p', 'PLAYERS'], ['data-q', 'QUIZ'], ['data-qc', 'QCHECKS'], ['data-cs', 'CSIM'], ['data-o', 'ORDERS'], ['data-s', 'SCEN'], ['data-tl', 'TERMLAB'], ['data-dq', 'DIFFQ']];

await new Promise(res => setTimeout(res, 0));
for (const file of allFiles) {
  const {dom, errs} = loadDom(file);
  await new Promise(res => setTimeout(res, 450));
  const doc = dom.window.document;
  const keys = dom.window.__GFP__;
  // G1: no runtime errors
  if (errs.length) F(`G1 ${file}: jsdom errors: ${errs.slice(0, 2).join(' | ')}`); else OK(`G1 ${file}: без помилок виконання`);
  // G2: data keys resolve
  if (!keys) F(`G2 ${file}: __GFP__ відсутній (engine не виконався)`);
  else attrKinds.forEach(([attr, kind]) => {
    [...doc.querySelectorAll(`[${attr}]`)].forEach(el => {
      const v = el.getAttribute(attr);
      if (!keys[kind].includes(v)) F(`G2 ${file}: ${attr}="${v}" не знайдено у ${kind}`);
    });
  });
  // widgets actually rendered (non-empty)
  [['.gplayer', 'svg'], ['.quiz', '.qcard'], ['.qcheck', '.qc-opt'], ['.csim', '.cs-inp'], ['.order', '.or-chip'], ['.scplayer', '.repo'], ['.termlab', '.tl-inp'], ['.diffq', '.dq-opt']].forEach(([w, inner]) => {
    doc.querySelectorAll(w).forEach(el => {
      if (!el.querySelector(inner)) F(`G2 ${file}: ${w}[${el.dataset.p || el.dataset.q || el.dataset.qc || el.dataset.cs || el.dataset.o || el.dataset.s || el.dataset.tl || el.dataset.dq}] не відрендерився`);
    });
  });
  // G2: клік по вікну термінала termlab має фокусувати поле вводу (новачок клікає у велике вікно, не в рядок)
  const tlScroll = doc.querySelector('.termlab .tl-scroll');
  if (tlScroll) {
    tlScroll.dispatchEvent(new dom.window.MouseEvent('click', {bubbles: true}));
    if (!doc.activeElement || !doc.activeElement.classList.contains('tl-inp'))
      F(`G2 ${file}: клік по вікну termlab не фокусує поле вводу`);
  }
  // collect anchors
  anchorMap[file] = new Set([...doc.querySelectorAll('[id]')].map(e => e.id));
  // G5 progress on module pages
  if (file !== 'index.html') {
    const cb = doc.querySelector('.done-cb');
    if (!cb) F(`G5 ${file}: donebar відсутній`);
    else {
      cb.click();
      const key = 'gfp:' + doc.body.dataset.page + ':s0';
      if (dom.window.localStorage.getItem(key) !== '1') F(`G5 ${file}: localStorage не записався`);
      else OK(`G5 ${file}: прогрес пишеться (${key})`);
    }
    // G6 coverage: goal + interactive per lesson
    doc.querySelectorAll('section.lesson').forEach(sec => {
      if (!sec.querySelector('.goalbox')) W(`G6 ${file}#${sec.id}: без блоку "Ціль"`);
      if (!sec.querySelector('.gplayer,.quiz,.qcheck,.csim,.order,.scplayer,.termlab,.diffq,.rbwrap,#lcExp,.gloss-list,#glossList,#cheatList,.tree'))
        W(`G6 ${file}#${sec.id}: без інтерактиву (${sec.querySelector('h2')?.textContent.trim().slice(0, 40)})`);
    });
  } else {
    // index cards progress render
    const bar = doc.querySelector('.mcard .mprog i');
    if (!bar) F('G5 index: картки прогресу відсутні');
    // самодіагностика рівня
    const dg = doc.getElementById('diagBox');
    if (dg) {
      if (!dg.querySelector('.dg-opt')) F('G5 index: самодіагностика не відрендерилась (.dg-opt відсутні)');
      const DG = dom.window.__DIAG__;
      if (!DG || DG.count < 5) F('G5 index: __DIAG__ відсутній або замалий');
      else DG.pages.forEach(p => {if (!fs.existsSync(path.join(ROOT, p))) F(`G5 index: diag посилається на неіснуючу сторінку ${p}`);});
    }
  }
  // G3: search works on this page
  const inp = doc.getElementById('searchBox');
  if (inp) {
    inp.value = 'rebase';
    inp.dispatchEvent(new dom.window.Event('input', {bubbles: true}));
    const box = doc.getElementById('searchResults');
    const shown = box && dom.window.getComputedStyle(box).display === 'block' && box.querySelector('a.sr');
    if (!shown) F(`G3 ${file}: пошук не показав результатів`); 
  }
  dom.window.close();
}

// G3b: index covers all sections
const idx = JSON.parse(indexSrc.replace('window.SEARCH_INDEX=', '').replace(/;$/, ''));
let secTotal = 0;
for (const p of pages) secTotal += anchorMap[p.file] ? [...anchorMap[p.file]].filter(a => /^s\d+$/.test(a)).length : 0;
if (idx.length !== secTotal) F(`G3 індекс: ${idx.length} записів проти ${secTotal} секцій`); else OK(`G3 індекс покриває всі ${secTotal} секцій`);

// G4: internal links + anchors valid
for (const file of allFiles) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const dom = new JSDOM(html);
  const base = path.dirname(file);
  [...dom.window.document.querySelectorAll('a[href]')].forEach(a => {
    const href = a.getAttribute('href');
    if (/^(https?:|mailto:)/.test(href)) return;
    const [fp, anchor] = href.split('#');
    const target = fp ? path.normalize(path.join(base, fp)).replace(/\\/g, '/') : file;
    if (fp && !fs.existsSync(path.join(ROOT, target))) {F(`G4 ${file}: битий лінк ${href}`); return;}
    if (anchor && anchorMap[target] && !anchorMap[target].has(anchor)) F(`G4 ${file}: битий якір ${href}`);
  });
}
OK('G4 перевірено внутрішні посилання');

// G2b: search index anchors valid
idx.forEach(e => {if (!anchorMap[e.p] || !anchorMap[e.p].has(e.a)) F(`G3 індекс: битий запис ${e.p}#${e.a}`);});

// G2c: termlab — кожен sol розв'язує свій goal через сам симулятор
{
  const vc = new VirtualConsole();
  const tlErrs = [];
  vc.on('jsdomError', e => {if (!/Not implemented/.test(e.message)) tlErrs.push(e.message);});
  const dom = new JSDOM(`<body><script>${engineSrc}</script></body>`, {runScripts: 'dangerously', virtualConsole: vc, url: 'https://x.test/'});
  const TL = dom.window.__TL__;
  if (tlErrs.length) F(`G2c termlab: engine.js помилки: ${tlErrs[0]}`);
  else if (!TL) F('G2c termlab: window.__TL__ відсутній');
  else {
    let ok = 0;
    for (const key of Object.keys(TL.bank)) {
      const t = TL.bank[key];
      Object.keys(t.goal).forEach(k => {if (!TL.goalKeys.includes(k)) F(`G2c termlab ${key}: невідомий goal-ключ "${k}"`);});
      if (TL.check(TL.newState(t.init), t.goal)) F(`G2c termlab ${key}: goal виконаний уже на старті`);
      const st = TL.newState(t.init);
      (t.sol || []).forEach(cmd => TL.run(st, cmd));
      if (!TL.check(st, t.goal)) F(`G2c termlab ${key}: sol не розв'язує goal`); else ok++;
    }
    OK(`G2c termlab: ${ok}/${Object.keys(TL.bank).length} розв'язків проходять replay`);
  }
  // G2d: csim — канонічний sol проходить власні регекси
  const CS = dom.window.__CSIM__;
  if (!CS) F('G2d csim: window.__CSIM__ відсутній');
  else {
    let csOk = 0;
    for (const key of Object.keys(CS)) {
      const c = CS[key];
      const norm = String(c.sol).trim().replace(/\s+/g, ' ');
      if (!c.a.some(rx => new RegExp(rx).test(norm))) F(`G2d csim ${key}: sol "${c.sol}" не матчиться власними регексами`); else csOk++;
    }
    OK(`G2d csim: ${csOk}/${Object.keys(CS).length} sol проходять власні регекси`);
  }
  dom.window.close();
}

console.log('\n==== ПІДСУМОК: FAIL=' + fails + ' WARN=' + warns + ' ====');
process.exit(fails ? 1 : 0);
