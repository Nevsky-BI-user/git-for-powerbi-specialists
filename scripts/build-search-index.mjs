// build-search-index.mjs — generates docs/assets/search-index.js from module pages
import fs from 'fs';
import path from 'path';
import {createRequire} from 'module';
const require = createRequire(import.meta.url);
const {JSDOM} = require('jsdom');

const ROOT = path.resolve(process.cwd(), 'docs');
const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
const entries = [];
for (const p of pages) {
  const html = fs.readFileSync(path.join(ROOT, p.file), 'utf8');
  const dom = new JSDOM(html); // no scripts
  const doc = dom.window.document;
  doc.querySelectorAll('section.lesson').forEach(sec => {
    const t = (sec.querySelector('h2')?.textContent || sec.id).trim();
    const x = sec.textContent.replace(/\s+/g, ' ').trim().slice(0, 500);
    entries.push({p: p.file, a: sec.id, t, m: p.title, x});
  });
}
fs.writeFileSync(path.join(ROOT, 'assets/search-index.js'),
  'window.SEARCH_INDEX=' + JSON.stringify(entries) + ';');
console.log('search index entries:', entries.length);
