
/* === 1. SVG-РУШІЙ === */
const BR={main:'#f0a35e',feature:'#5bd6a8',feat2:'#6cb6ff',hotfix:'#e3697f',rebased:'#5bd6a8',merge:'#c9a0e8'};
function N(id,lane,color,parents,refs,faded){return {id,lane,color:color||'main',parents:parents||[],refs:refs||[],faded:!!faded};}
function drawGraph(step){
  const nodes=step.nodes,r=12,rowH=56,laneW=64,topPad=24,leftPad=26;
  if(!nodes.length)return '<div style="color:#566070;padding:20px">порожній репозиторій</div>';
  const maxLane=Math.max(...nodes.map(n=>n.lane));
  const pos={};nodes.forEach((n,i)=>pos[n.id]={x:leftPad+n.lane*laneW,y:topPad+i*rowH});
  let edges='';
  nodes.forEach(n=>n.parents.forEach(pid=>{
    const a=pos[n.id],b=pos[pid];if(!b)return;
    const col=BR[n.color]||'#556',op=n.faded?'0.3':'1';
    if(a.x===b.x)edges+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="2" opacity="${op}"/>`;
    else{const my=(a.y+b.y)/2;edges+=`<path d="M${a.x} ${a.y} C ${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}" fill="none" stroke="${col}" stroke-width="2" opacity="${op}"/>`;}
  }));
  let circ='';
  nodes.forEach(n=>{
    const p=pos[n.id],col=BR[n.color]||'#556',op=n.faded?'0.32':'1';
    if(n.faded){
      circ+=`<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="none" stroke="${col}" stroke-width="2" stroke-dasharray="3 3" opacity="${op}"/>`;
      circ+=`<text x="${p.x}" y="${p.y+3}" text-anchor="middle" font-size="9" font-weight="700" fill="${col}" opacity="${op}" font-family="JetBrains Mono,monospace">${n.id}</text>`;
    }else{
      circ+=`<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${col}" stroke="#ffffff" stroke-width="2"/>`;
      circ+=`<text x="${p.x}" y="${p.y+3}" text-anchor="middle" font-size="9" font-weight="700" fill="#16202d" font-family="JetBrains Mono,monospace">${n.id}</text>`;
    }
    let rx=p.x+r+9;
    n.refs.forEach(ref=>{
      const head=ref==='HEAD',w=ref.length*6.7+15;
      const fill=head?'#f0a35e':'none',stroke=head?'#f0a35e':(BR[n.color]||'#889'),tc=head?'#0c0f14':(BR[n.color]||'#cdd4df');
      circ+=`<rect x="${rx}" y="${p.y-9}" width="${w}" height="18" rx="9" fill="${fill}" stroke="${stroke}" stroke-width="1.4"/>`;
      circ+=`<text x="${rx+w/2}" y="${p.y+3}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${tc}" font-family="JetBrains Mono,monospace">${ref}</text>`;
      rx+=w+6;
    });
    n._rx=rx;
  });
  const maxRx=Math.max(...nodes.map(n=>n._rx||0));
  const width=Math.max(maxRx+12,leftPad+(maxLane+1)*laneW),height=topPad*2+(nodes.length-1)*rowH;
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${Math.round(width)}px" xmlns="http://www.w3.org/2000/svg">${edges}${circ}</svg>`;
}

/* === 2. ВІЗУАЛІЗАЦІЇ === */
const PLAYERS={
  commits:[
    {cap:`<b>git commit</b> — перший коміт. main і HEAD створено й вказують на нього.`,nodes:[N('M0',0,'main',[],['main','HEAD'])]},
    {cap:`Другий коміт. main і HEAD рухаються разом уперед.`,nodes:[N('C2',0,'main',['M0'],['main','HEAD']),N('M0',0,'main',[])]},
    {cap:`Третій коміт. Кожен посилається на батька, утворюючи ланцюг.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD']),N('C2',0,'main',['M0']),N('M0',0,'main',[])]}
  ],
  branching:[
    {cap:`Гілка main з двома комітами. HEAD на main.`,nodes:[N('B',0,'main',['A'],['main','HEAD']),N('A',0,'main',[])]},
    {cap:`<b>git switch -c feature</b>. Нова гілка вказує на той самий коміт B. HEAD перейшов на feature.`,nodes:[N('B',0,'main',['A'],['main','feature','HEAD']),N('A',0,'main',[])]},
    {cap:`Коміт C додано у feature. main лишилась на B.`,nodes:[N('C',1,'feature',['B'],['feature','HEAD']),N('B',0,'main',['A'],['main']),N('A',0,'main',[])]},
    {cap:`Перемкнулись на main, додали D. C і D мають спільного батька B — розгалуження.`,nodes:[N('D',0,'main',['B'],['main','HEAD']),N('C',1,'feature',['B'],['feature']),N('B',0,'main',['A']),N('A',0,'main',[])]}
  ],
  ff:[
    {cap:`main на A. feature пішла вперед на B, C. main НЕ має нових комітів.`,nodes:[N('C',0,'feature',['B'],['feature']),N('B',0,'feature',['A']),N('A',0,'main',[],['main','HEAD'])]},
    {cap:`<b>Fast-forward.</b> git merge просто пересуває main на C. Нового коміту немає, історія лінійна.`,nodes:[N('C',0,'main',['B'],['main','feature','HEAD']),N('B',0,'main',['A']),N('A',0,'main',[])]}
  ],
  mergecommit:[
    {cap:`main (D) і feature (C) розійшлися після спільного B.`,nodes:[N('D',0,'main',['B'],['main','HEAD']),N('C',1,'feature',['B'],['feature']),N('B',0,'main',['A']),N('A',0,'main',[])]},
    {cap:`<b>git merge feature.</b> Створено merge-коміт MG із ДВОМА батьками (D і C). Розгалуження збережено.`,nodes:[N('MG',0,'merge',['D','C'],['main','HEAD']),N('D',0,'main',['B']),N('C',1,'feature',['B'],['feature']),N('B',0,'main',['A']),N('A',0,'main',[])]}
  ],
  rebase:[
    {cap:`feature (C) відгалузилась від B. main пішла вперед на D. Мета — перенести C поверх D.`,nodes:[N('D',0,'main',['B'],['main']),N('C',1,'feature',['B'],['feature','HEAD']),N('B',0,'main',['A']),N('A',0,'main',[])]},
    {cap:`<b>git rebase main.</b> C відтворено поверх D як C' (новий SHA). Старий C — orphaned.`,nodes:[N("C'",0,'rebased',['D'],['feature','HEAD']),N('D',0,'main',['B'],['main']),N('B',0,'main',['A']),N('A',0,'main',[]),N('C',1,'feature',['B'],[],true)]}
  ],
  reset:[
    {cap:`main на D. Хочемо скасувати два останні коміти: <b>git reset B</b>.`,nodes:[N('D',0,'main',['C'],['main','HEAD']),N('C',0,'main',['B']),N('B',0,'main',['A']),N('A',0,'main',[])]},
    {cap:`Вказівник пересунуто на B. C і D — orphaned. Що з файлами — залежить від режиму, але граф однаковий.`,nodes:[N('D',0,'main',['C'],[],true),N('C',0,'main',['B'],[],true),N('B',0,'main',['A'],['main','HEAD']),N('A',0,'main',[])]}
  ],
  cherry:[
    {cap:`main: A→B (HEAD). feature: A→X→Y. Хочемо лише X у main.`,nodes:[N('B',0,'main',['A'],['main','HEAD']),N('Y',1,'feature',['X'],['feature']),N('X',1,'feature',['A']),N('A',0,'main',[])]},
    {cap:`<b>git cherry-pick X.</b> Копія X як X' поверх B (новий SHA). feature не зачеплено, Y не перенесено.`,nodes:[N("X'",0,'main',['B'],['main','HEAD']),N('B',0,'main',['A']),N('Y',1,'feature',['X'],['feature']),N('X',1,'feature',['A']),N('A',0,'main',[])]}
  ],
  complex:[
    {cap:`Реальний <code>git log --graph</code>: feature (X,Y) злита merge-комітом MG, далі main продовжилась E.`,nodes:[N('E',0,'main',['MG'],['main','HEAD']),N('MG',0,'merge',['B','Y'],[]),N('Y',1,'feature',['X'],['feature']),N('X',1,'feature',['B']),N('B',0,'main',['A']),N('A',0,'main',[])]}
  ],
  clone:[
    {cap:`На сервері (origin) — історія з трьох комітів. На твоєму комп'ютері порожньо. <span style="color:var(--blue)">origin/main</span> = гілка на сервері.`,nodes:[N('C3',0,'main',['C2'],['origin/main']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]},
    {cap:`<b>git clone &lt;url&gt;</b> — уся історія завантажена локально. З'явились локальні <span style="color:var(--accent)">main</span> і HEAD на тому ж коміті, що й origin/main.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD','origin/main']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ],
  pull:[
    {cap:`Колега запушив C4. Після <b>git fetch</b> твоя origin/main «бачить» C4, але локальна main ще на C3 — робочі файли не змінились.`,nodes:[N('C4',0,'main',['C3'],['origin/main']),N('C3',0,'main',['C2'],['main','HEAD']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]},
    {cap:`<b>git pull</b> (= fetch + merge fast-forward) — локальна main пересунулась на C4. Локальний і серверний стани збіглися.`,nodes:[N('C4',0,'main',['C3'],['main','HEAD','origin/main']),N('C3',0,'main',['C2']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ],
  remote:[
    {cap:`Локальна main випереджає сервер на один коміт (C3). <span style="color:var(--blue)">origin/main</span> (стан сервера) ще на C2.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD']),N('C2',0,'main',['C1'],['origin/main']),N('C1',0,'main',[])]},
    {cap:`<b>git push</b> — C3 відправлено на сервер. origin/main тепер теж на C3 — локальний і віддалений стани збіглися.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD','origin/main']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ],
  detached:[
    {cap:`Нормальний стан: HEAD → гілка main → коміт C3.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]},
    {cap:`<b>git checkout C1</b> — HEAD «відчепився» й указує ПРЯМО на C1, не на гілку. Це detached HEAD.`,nodes:[N('C3',0,'main',['C2'],['main']),N('C2',0,'main',['C1']),N('C1',0,'main',[],['HEAD'])]},
    {cap:`Коміт X створено в detached-стані — він НЕ належить жодній гілці. При перемиканні легко загубити.`,nodes:[N('X',1,'feature',['C1'],['HEAD']),N('C3',0,'main',['C2'],['main']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]},
    {cap:`<b>git switch -c rescue</b> — створює гілку на X. Тепер коміт закріплено й він у безпеці.`,nodes:[N('X',1,'rebased',['C1'],['rescue','HEAD']),N('C3',0,'main',['C2'],['main']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ],
  bisect:[
    {cap:`Баг є в C8, але не було в C1. Старт: git bisect bad C8; git bisect good C1.`,nodes:[N('C8',0,'hotfix',['C7'],['bad']),N('C7',0,'main',['C6']),N('C6',0,'main',['C5']),N('C5',0,'main',['C4']),N('C4',0,'main',['C3']),N('C3',0,'main',['C2']),N('C2',0,'main',['C1']),N('C1',0,'feature',[],['good'])]},
    {cap:`Git робить checkout СЕРЕДНЬОГО коміту C4. Тестуєш — баг відсутній → git bisect good.`,nodes:[N('C8',0,'hotfix',['C7'],['bad']),N('C7',0,'main',['C6']),N('C6',0,'main',['C5']),N('C5',0,'main',['C4']),N('C4',0,'main',['C3'],['HEAD']),N('C3',0,'main',['C2']),N('C2',0,'main',['C1']),N('C1',0,'feature',[],['good'])]},
    {cap:`C4 — good. Діапазон звузився до C5–C8. Git тестує C6 — баг Є → git bisect bad.`,nodes:[N('C8',0,'hotfix',['C7'],['bad']),N('C7',0,'main',['C6']),N('C6',0,'main',['C5'],['HEAD']),N('C5',0,'main',['C4']),N('C4',0,'feature',['C3']),N('C3',0,'feature',['C2']),N('C2',0,'feature',['C1']),N('C1',0,'feature',[],['good'])]},
    {cap:`C6 — bad. Залишились C5–C6. Тест C5 — баг відсутній → good. Винен C6.`,nodes:[N('C8',0,'hotfix',['C7']),N('C7',0,'hotfix',['C6']),N('C6',0,'hotfix',['C5'],['bad']),N('C5',0,'feature',['C4'],['good','HEAD']),N('C4',0,'feature',['C3']),N('C3',0,'feature',['C2']),N('C2',0,'feature',['C1']),N('C1',0,'feature',[])]},
    {cap:`Git: "C6 is the first bad commit". git bisect reset повертає на твою гілку.`,nodes:[N('C8',0,'hotfix',['C7']),N('C7',0,'hotfix',['C6']),N('C6',0,'hotfix',['C5'],['bad ← винен']),N('C5',0,'feature',['C4'],['good']),N('C4',0,'feature',['C3']),N('C3',0,'feature',['C2']),N('C2',0,'feature',['C1']),N('C1',0,'feature',[])]}
  ],
  pushreject:[
    {cap:`Ти зробив локальний коміт X. Але колега раніше запушив свій Y, тож <span style="color:var(--blue)">origin/main</span> пішов уперед іншим шляхом. <b>git push ВІДХИЛЕНО</b>: 'non-fast-forward' — на сервері є коміт (Y), якого немає в тебе.`,nodes:[N('X',0,'main',['C3'],['main','HEAD']),N('Y',1,'feat2',['C3'],['origin/main']),N('C3',0,'main',['C2']),N('C2',0,'main',[])]},
    {cap:`<b>git pull --rebase</b> — твій X перенесено поверх Y як X' (новий SHA). Старий X orphaned. Тепер історія узгоджена з сервером.`,nodes:[N("X'",0,'rebased',['Y'],['main','HEAD']),N('Y',0,'feat2',['C3'],['origin/main']),N('C3',0,'main',['C2']),N('C2',0,'main',[]),N('X',1,'main',['C3'],[],true)]},
    {cap:`<b>git push</b> — X' відправлено. origin/main і main знову збіглися.`,nodes:[N("X'",0,'rebased',['Y'],['main','HEAD','origin/main']),N('Y',0,'feat2',['C3']),N('C3',0,'main',['C2']),N('C2',0,'main',[]),N('X',1,'main',['C3'],[],true)]}
  ]
};

/* === 3. ВПРАВИ === */
const QUIZ={
  modA:[
    {q:`Куди команда <code>git add</code> переміщує зміни?`,opts:[`Лишає їх у робочій директорії без змін стану`,`У Staging (Index)`,`Одразу відправляє на віддалений сервер`,`Запечатує їх у готовий коміт з новим SHA`],correct:1,why:`git add кладе зміни у staging — проміжну зону, що формує наступний коміт.`},
    {q:`Що таке HEAD?`,opts:[`Псевдонім URL віддаленого сервера`,`Вказівник на поточну гілку/коміт`,`Перша гілка у списку git branch`,`Головний файл конфігурації репозиторію`],correct:1,why:`HEAD — вказівник на те, де ти зараз «стоїш». Зазвичай HEAD → гілка → коміт.`},
    {q:`Де фізично зберігається вся історія репозиторію?`,opts:[`У робочій директорії поряд із файлами проєкту`,`У прихованій папці .git`,`У зоні staging до наступного коміту`,`Тільки на віддаленому сервері origin`],correct:1,why:`Уся історія, коміти й гілки лежать у прихованій папці .git у корені репозиторію.`},
    {q:`Що таке SHA коміту?`,opts:[`Порядковий номер коміту в гілці`,`Унікальний хеш-ідентифікатор коміту`,`Назва гілки, у якій зроблено коміт`,`Ім'я автора, що підписав коміт`],correct:1,why:`SHA — 40-символьний хеш, обчислений із вмісту коміту. Це його унікальний «паспорт».`},
    {q:`Робоча директорія (Working Directory) — це...`,opts:[`Файли, які ти зараз бачиш і редагуєш на диску`,`Остання версія проєкту, що лежить на сервері`,`Прихована папка .git з історією комітів`,`Список локальних і віддалених гілок`],correct:0,why:`Working Directory — це фактичні файли проєкту на твоєму диску в поточному стані.`}
  ],
  modB:[
    {q:`feature пішла вперед, main без нових комітів. Який merge?`,opts:[`Merge-коміт із двома батьками`,`Fast-forward (пересув вказівника)`,`Злиття завжди дасть конфлікт міри`,`Rebase feature поверх main`],correct:1,why:`Якщо основна гілка не розходилась — Git просто пересуває вказівник уперед.`},
    {q:`Яка команда завантажує коміти з сервера, НЕ змінюючи робочі файли?`,opts:[`git pull (тягне і одразу зливає)`,`git fetch`,`git push (відправляє на сервер)`,`git merge (зливає дві гілки)`],correct:1,why:`git fetch тягне дані без злиття. git pull = fetch + merge.`},
    {q:`Що робить <code>git clone &lt;url&gt;</code>?`,opts:[`Копіює весь віддалений репозиторій на твій комп'ютер`,`Стирає локальні незакомічені зміни й тягне свіжу версію`,`Завантажує лише останній коміт без історії`,`Створює нову гілку від поточного стану`],correct:0,why:`clone завантажує всю історію й файли з сервера й налаштовує origin.`},
    {q:`Твій push відхилено: 'non-fast-forward'. Що зробити?`,opts:[`Одразу push з --force, перезаписавши сервер`,`Спершу pull (забрати чужі коміти), потім push`,`Видалити гілку й створити її заново`,`Зробити reset --hard і повторити push`],correct:1,why:`На сервері є коміти, яких немає в тебе. Треба їх забрати (pull/--rebase), потім push.`},
    {q:`Що робить <code>git switch -c feature</code>?`,opts:[`Створює нову гілку й переходить на неї`,`Видаляє гілку feature й повертає на main`,`Перемикається на вже наявну гілку feature`,`Комітить поточні зміни у гілку feature`],correct:0,why:`-c = create: створити гілку й одразу перейти на неї.`},
    {q:`Що таке <code>origin</code>?`,opts:[`Стандартна назва основного віддаленого репозиторію`,`Стандартна назва головної гілки замість main`,`Найперший (кореневий) коміт репозиторію`,`Тег, що позначає стабільний реліз`],correct:0,why:`origin — псевдонім URL сервера, що Git присвоює при clone.`},
    {q:`Команда <code>git config --global user.email</code> задає...`,opts:[`email автора, яким підписуються коміти`,`пароль чи токен доступу до сервера`,`назву гілки за замовчуванням`,`URL віддаленого репозиторію origin`],correct:0,why:`user.name і user.email підписують кожен коміт; --global застосовує для всіх репозиторіїв користувача.`},
    {q:`<b>detached HEAD</b> — це коли...`,opts:[`HEAD вказує прямо на коміт, а не на гілку`,`зник зв'язок із origin і немає інтернету`,`гілку main випадково видалено з репозиторію`,`під час merge стався конфлікт злиття`],correct:0,why:`Коміти в detached HEAD не належать гілці й можуть загубитись; рятунок — git switch -c <гілка>.`}
  ],
  modC:[
    {q:`Який режим reset ЗБЕРІГАЄ зміни у Staging?`,opts:[`--hard (скидає всі три зони)`,`--mixed (знімає зміни зі staging у робочу директорію)`,`--soft`,`--keep (зберігає лише незалежні зміни)`],correct:2,why:`--soft пересуває лише вказівник; зміни лишаються у staging.`},
    {q:`Гілка вже на сервері й спільна. Чим безпечно скасувати коміт?`,opts:[`git reset --hard на попередній коміт`,`git revert`,`git commit --amend поверх старого коміту`,`git rebase з переписуванням історії`],correct:1,why:`revert створює НОВИЙ коміт-скасування, не переписуючи історію.`},
    {q:`Що <code>git reset --hard</code> робить з робочою директорією?`,opts:[`Лишає робочі файли недоторканими`,`Перезаписує її, незакомічені зміни втрачаються`,`Очищає лише staging, а файли на диску не чіпає`,`Створює коміт-скасування, зберігаючи зміни`],correct:1,why:`--hard скидає всі три зони; незбережене зникає. Відновлення — лише через reflog.`},
    {q:`Ти зробив reset --hard і «втратив» коміт. Де шукати?`,opts:[`git status покаже його серед змінених файлів`,`git reflog`,`git push поверне його з сервера`,`git stash list — reset ховає коміти туди`],correct:1,why:`reflog зберігає всі переміщення HEAD ~90 днів — звідти коміт зазвичай відновлюється.`}
  ],
  modD:[
    {q:`Чому коміт A' після rebase має новий SHA?`,opts:[`rebase пошкоджує вміст коміту при переносі`,`Змінився батько й час → інший хеш`,`Це відомий баг механізму rebase`,`SHA генерується випадково при кожному записі`],correct:1,why:`SHA рахується з вмісту, батька, автора й часу. Зміна батька → новий хеш = новий коміт.`},
    {q:`Золоте правило rebase:`,opts:[`Робити rebase тільки коли ти на гілці main`,`Не робити rebase опублікованих/спільних комітів`,`Завжди обирати rebase замість merge`,`Робити rebase лише з GUI, а не з терміналу`],correct:1,why:`Переписування спільної історії ламає копії колег. Rebase — для локальних комітів.`},
    {q:`У файлі бачиш <code>=======</code> між двома блоками. Що це?`,opts:[`Синтаксична помилка у TMDL-файлі`,`Маркер конфлікту: вище — твоя версія, нижче — чужа`,`Багаторядковий коментар, доданий Git`,`Роздільник секцій усередині формату PBIR`],correct:1,why:`Це конфлікт. Між <<< і === — HEAD, між === і >>> — гілка, що зливається.`},
    {q:`Що робить <code>git rebase --abort</code>?`,opts:[`Завершує rebase, зберігаючи вже перенесені коміти`,`Скасовує rebase і повертає все як було до старту`,`Видаляє гілку, на яку робили rebase`,`Пропускає поточний коміт і йде далі`],correct:1,why:`--abort повністю відкочує rebase до початкового стану (Git зберігає його в ORIG_HEAD).`}
  ],
  modE:[
    {q:`Які файли ТРЕБА комітити в PBIP? (кілька варіантів)`,multi:true,opts:[`*.tmdl (визначення моделі)`,`cache.abf`,`localSettings.json`,`.pbip (вказівник)`,`definition/ (TMDL та PBIR)`],correct:[0,3,4],why:`Комітимо те, що ВИЗНАЧАЄ модель і звіт. cache.abf і localSettings.json — локальні, у .gitignore.`},
    {q:`Що таке TMDL?`,opts:[`Формат візуальної частини звіту`,`Текстова мова опису семантичної моделі`,`Рушій бази даних під моделлю`,`Локальний кеш даних Power BI`],correct:1,why:`TMDL (Tabular Model Definition Language) — людиночитна мова з відступами для таблиць, мір, зв'язків.`},
    {q:`Що таке PBIR?`,opts:[`Модульний JSON-формат звіту`,`Мова опису семантичної моделі`,`Файл машинозалежного кешу`,`CLI-інструмент для деплою моделі`],correct:0,why:`PBIR (Power BI Enhanced Report Format) — звіт як набір JSON-файлів, що добре діфиться.`},
    {q:`Що таке lineageTag?`,opts:[`Унікальний GUID-ідентифікатор об'єкта моделі`,`Назва гілки, у якій створено об'єкт`,`Тип агрегації міри (SUM, AVG тощо)`,`Окремий файл із метаданими таблиці`],correct:0,why:`lineageTag стабілізує ідентичність об'єкта (таблиці, міри) між середовищами.`},
    {q:`Чому для Git формат PBIP кращий за .pbix?`,opts:[`PBIP — текст, його зміни видно рядок за рядком`,`.pbix стискається краще, тож diff чіткіший`,`обидва формати діфляться однаково`,`жоден із них не придатний для Git`],correct:0,why:`.pbix бінарний (один блок), PBIP — текстові файли, тому Git показує точні зміни.`},
    {q:`Коли PBIP-формат МОЖЕ бути недоречним?`,opts:[`дуже великі моделі / складні merge / окремі специфічні можливості звіту`,`коли в команді працює лише один розробник`,`коли модель мала й простих таблиць небагато`,`коли звіт публікують у робочу область Fabric`],correct:0,why:`PBIP має обмеження: великі моделі важче діфити, частину функцій звіту представлено неповно, складні merge вимагають валідації.`},
    {q:`Стек 2 для роботи з моделлю — це...`,opts:[`Tabular Editor: редагування TMDL + Best Practice Analyzer + деплой через XMLA`,`Power BI Desktop як єдиний інструмент для всього`,`Excel Power Pivot для правок моделі вручну`,`SQL Server Management Studio для запитів до моделі`],correct:0,why:`Tabular Editor дає точніший контроль над моделлю, BPA для якості й деплой моделі окремо від звіту.`}
  ],
  modF:[
    {q:`Чому cache.abf додають у .gitignore?`,opts:[`У ньому зберігаються паролі до джерел даних`,`Важкий і машинозалежний; спричиняє type-conflict між ПК`,`Git не вміє зберігати файли з розширенням .abf`,`Це застарілий формат, який Power BI більше не читає`],correct:1,why:`cache.abf — локальна копія моделі з даними. У репозиторії ламає відкриття на іншому ПК.`},
    {q:`Після текстового merge TMDL-конфлікту що зробити обов'язково?`,opts:[`Нічого — одразу push, Git усе перевірив сам`,`Провалідувати модель у Desktop / Tabular Editor`,`Видалити конфліктний .tmdl і перестворити його`,`Перейменувати гілку, щоб скинути стан merge`],correct:1,why:`Git перевіряє лише текст. Коректний merge може дати зламану модель (дубль lineageTag).`},
    {q:`Файл усе ще відстежується, хоч доданий у .gitignore. Чому й що робити?`,opts:[`.gitignore діє лише на НЕвідстежувані; зробити git rm --cached`,`.gitignore треба покласти в папку .git, а не в корінь`,`очистити кеш командою git gc, щоб правило спрацювало`,`закомітити .gitignore ще раз, щоб він перечитався`],correct:0,why:`.gitignore не приховує вже відстежувані файли. Прибрати: git rm --cached <файл> + коміт.`},
    {q:`Два розробники змінили ту саму міру по-різному, обидві логіки потрібні. Рішення?`,opts:[`Лишити версію того, хто запушив першим`,`Лишити обидві як дві окремі міри з різними назвами`,`Зробити reset --hard на коміт до конфлікту`,`Видалити таблицю з мірою й створити наново`],correct:1,why:`Якщо обидві логіки цінні — розвести їх у дві міри, прибравши маркери конфлікту.`},
    {q:`Як зменшити кількість конфліктів у команді?`,opts:[`Тримати всіх в одній спільній гілці main`,`Короткоживучі feature-гілки + частий rebase на свіжий main`,`Комітити рідше, великими пакетами змін`,`Вимкнути CI, щоб не блокувало злиття`],correct:1,why:`Маленькі гілки й частий rebase не дають історіям сильно розійтись.`},
    {q:`Терміновий фікс прод-багу треба внести, не зливаючи всю гілку розробки. Як?`,opts:[`git merge всієї гілки розробки в prod`,`git cherry-pick потрібного коміту в prod-гілку`,`git reset --hard prod-гілки на коміт-фікс`,`видалити main і зробити prod головною гілкою`],correct:1,why:`cherry-pick переносить лише один потрібний коміт у потрібну гілку.`},
    {q:`Формат Conventional Commits — це...`,opts:[`<type>(<scope>): <subject>, напр. feat(model): add YTD`,`вільний текст будь-якою мовою без структури`,`лише номер задачі з трекера, напр. TASK-142`,`емодзі на початку плюс короткий опис змін`],correct:0,why:`Conventional Commits задають структуру: тип, область, короткий опис — історія стає читабельною й машинозчитуваною.`},
    {q:`Чому ця команда НЕ робить ставку на PR-review як головний бар'єр?`,opts:[`review PBIP/PBIR-діфів непрактичний; бар'єр — валідація в Desktop і CI (та поетапний деплой, якщо він налаштований)`,`GitHub не підтримує PR для репозиторіїв із PBIP-файлами`,`код-рев'ю сповільнює деплой, тож ним завжди нехтують`,`діфи TMDL надто малі, щоб у них могла бути помилка`],correct:0,why:`Текстові TMDL/JSON-діфи без прев'ю звіту важко рев'ювити, тож зміни зливають у main, а гейтом є валідація перед злиттям і контрольована публікація.`}
  ],
  modG:[
    {q:`Що робить <code>git bisect</code>?`,opts:[`Бінарним пошуком знаходить коміт, що вніс баг`,`розбиває великий коміт на кілька менших`,`зливає дві розбіжні гілки в одну`,`розділяє репозиторій на два окремих`],correct:0,why:`bisect ділить діапазон комітів навпіл; ти позначаєш good/bad, і Git швидко звужує до винного коміту.`},
    {q:`Навіщо потрібен pre-commit hook у Power BI-команді?`,opts:[`Автоматично перевіряти TMDL/JSON чи запускати BPA перед комітом`,`Автоматично пушити коміт на сервер одразу після створення`,`Автоматично створювати нову feature-гілку під кожен коміт`,`Автоматично форматувати повідомлення коміту під Conventional Commits`],correct:0,why:`Hook — локальний скрипт перед комітом; не дає закомітити зламану модель чи порушення правил.`},
    {q:`Що дає <code>git worktree add</code>?`,opts:[`Окрему робочу директорію для іншої гілки без stash`,`Резервну копію робочої директорії перед ризикованим merge`,`Стиснений архів усього репозиторію для передачі`,`Візуальне дерево комітів у терміналі`],correct:0,why:`worktree дозволяє паралельно правити hotfix в окремій папці, не чіпаючи поточні незакомічені зміни.`},
    {q:`Що робить <code>git add -p</code>?`,opts:[`Додає у staging вибрані БЛОКИ змін, а не весь файл`,`Додає у staging абсолютно всі змінені файли одразу`,`Показує попередній перегляд змін без їх додавання`,`Прибирає файл зі staging назад у робочу директорію`],correct:0,why:`Patch mode дозволяє зібрати атомарний коміт — застейджити лише пов'язані зміни, навіть якщо у файлі їх кілька.`}
  ],
  modT:[
    {q:`Що таке термінал?`,opts:[`Текстове вікно, де команди вводять словами`,`Провідник із папками, який відкривають мишкою`,`Вбудований у Git текстовий редактор коду`,`Панель керування налаштуваннями операційної системи`],correct:0,why:`Термінал — текстовий інтерфейс: друкуєш команду, комп'ютер її виконує.`},
    {q:`Яка команда показує поточну папку?`,opts:[`pwd`,`cd (переходить в іншу папку)`,`ls (показує вміст папки)`,`mkdir (створює нову папку)`],correct:0,why:`pwd = print working directory — повний шлях до поточної папки.`},
    {q:`Створити папку <code>data</code> — це...`,opts:[`mkdir data`,`touch data (створює порожній файл)`,`cd data (переходить у папку)`,`ls data (показує вміст папки)`],correct:0,why:`mkdir створює директорію (папку).`},
    {q:`<code>cd ..</code> робить...`,opts:[`перехід на одну папку вгору`,`перехід у попередню відкриту папку`,`видалення поточної папки`,`показ прихованих файлів у папці`],correct:0,why:`Дві крапки .. — батьківська папка; cd .. піднімає на рівень вище.`},
    {q:`Перевірити, що Git встановлено:`,opts:[`git --version`,`git init (створює новий репозиторій)`,`git status (показує стан робочої копії)`,`git help (відкриває довідку по командах)`],correct:0,why:`git --version показує версію або помилку, якщо Git ще не встановлено.`}
  ]
};

/* === 4. КУРИКУЛУМ === */
/* === 4b. БАГАТО-РЕПО СЦЕНАРНИЙ РУШІЙ === */
function ccRef(r){const map={'main':'#f0a35e','feature':'#5bd6a8','origin/main':'#6cb6ff','origin/feature':'#6cb6ff','HEAD':'#f0a35e'};const col=map[r]||'#8a93a3';return `<span class="ccref" style="border-color:${col};color:${col}">${r}</span>`;}
function commitChip(c){const col={A:'#5bd6a8',B:'#6cb6ff',base:'#f0a35e',M:'#c9a0e8'}[c.by]||'#8a93a3';return `<div class="cchip"><span class="cdot" style="background:${col}"></span><span class="cid">${c.id}</span>${(c.ref||[]).map(ccRef).join('')}</div>`;}
function repoCol(title,sub,commits,cls){return `<div class="repo ${cls||''}"><div class="repo-h">${title}<span>${sub}</span></div><div class="repo-body">${commits&&commits.length?commits.map(commitChip).join(''):'<div class="repo-empty">порожньо</div>'}</div></div>`;}
const SCEN={
  basic1:{steps:[
    {actor:'sys',cmd:`git clone <url>`,cap:`Старт: на сервері один коміт C1. Обидва розробники клонують репозиторій і отримують однакову копію.`,
     A:[{id:'C1',by:'base',ref:['main']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git add . && git commit -m "міра Total Sales"`,cap:`Розробник A додає міру й комітить ЛОКАЛЬНО → коміт C2. Сервер і B про нього ще нічого не знають.`,
     A:[{id:'C2',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git push`,cap:`A відправляє C2 на сервер. Тепер origin має C2. У B досі лише C1.`,
     A:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'B',cmd:`git pull`,cap:`B робить pull і отримує C2 з сервера. Усі три копії знову однакові — синхронізовані.`,
     A:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}]}
  ]},
  parallel:{steps:[
    {actor:'sys',cmd:`git clone <url>`,cap:`Обидва стартують з C1. A правитиме сторінку OKR, B — міру badge (РІЗНІ файли).`,
     A:[{id:'C1',by:'base',ref:['main']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git commit -m "OKR page"`,cap:`A комітить C2a локально.`,
     A:[{id:'C2a',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'B',cmd:`git commit -m "badge measure"`,cap:`Паралельно B комітить C2b локально (інший файл).`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C2b',by:'B',ref:['main','HEAD']},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git push`,cap:`A пушить першим — C2a лягає на сервер.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2b',by:'B',ref:['main']},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`git push   →   ! [rejected]`,cap:`B намагається запушити, але сервер ВІДХИЛЯЄ: на ньому вже є C2a, якого немає в B.`,note:`non-fast-forward: на сервері є коміт, якого немає локально. Спершу забери чужі зміни (pull), лише потім push.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2b',by:'B',ref:['main']},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`git pull --rebase`,cap:`B забирає C2a і переносить свій C2b поверх нього → C2b'. Файли різні, тож конфлікту немає.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:"C2b'",by:'B',ref:['main','HEAD']},{id:'C2a',by:'A'},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`git push`,cap:`Тепер push проходить. Сервер: C1 → C2a → C2b'.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}],B:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git pull`,cap:`A підтягує C2b'. Усі три копії синхронні.`,
     A:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}],R:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}],B:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}]}
  ]},
  conflict:{steps:[
    {actor:'sys',cmd:`git clone <url>`,cap:`Обидва на C1. У файлі model.tmdl є міра Total Sales. Обидва правитимуть САМЕ її.`,
     A:[{id:'C1',by:'base',ref:['main']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git commit -m "Sales = SUM"`,cap:`A змінив міру на SUM(...) → C2a локально.`,
     A:[{id:'C2a',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'B',cmd:`git commit -m "Sales = SUMX"`,cap:`B змінив ТУ САМУ міру на SUMX(...) → C2b локально.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C2b',by:'B',ref:['main','HEAD']},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git push`,cap:`A пушить першим — C2a на сервері.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2b',by:'B',ref:['main']},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`git pull --rebase   →   CONFLICT`,cap:`B тягне C2a і пробує накласти свій C2b. Git зупиняється: обидва змінили один рядок measure.`,note:`CONFLICT (content): model.tmdl. У файлі з'явились маркери <<<<<<< ======= >>>>>>>.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2a',by:'A',ref:['HEAD']},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`# редагує model.tmdl, лишає правильний DAX`,cap:`B відкриває файл, прибирає маркери конфлікту й лишає узгоджену версію міри (напр. SUMX).`,note:`Між <<<<<<< HEAD і ======= — версія C2a; між ======= і >>>>>>> — версія C2b. Лишити один варіант.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2a',by:'A',ref:['HEAD']},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`git add model.tmdl && git rebase --continue`,cap:`B позначає конфлікт вирішеним і завершує rebase → коміт C2b' поверх C2a.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:"C2b'",by:'B',ref:['main','HEAD']},{id:'C2a',by:'A'},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`git push`,cap:`B пушить C2b'. Перед цим варто відкрити проєкт у Desktop і перевірити, що міра рахує правильно.`,
     A:[{id:'C2a',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}],B:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git pull`,cap:`A підтягує фінальний стан. Конфлікт вирішено, всі синхронні.`,
     A:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}],R:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}],B:[{id:"C2b'",by:'B',ref:['main']},{id:'C2a',by:'A'},{id:'C1',by:'base'}]}
  ]},
  feature:{steps:[
    {actor:'sys',cmd:`git clone <url>`,cap:`Обидва на main (C1).`,
     A:[{id:'C1',by:'base',ref:['main']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git switch -c feature/badge`,cap:`A створює гілку feature/badge (поки що вказує на C1).`,
     A:[{id:'C1',by:'base',ref:['main','feature','HEAD']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git commit -m "SVG badge"`,cap:`A комітить C2 у feature. main лишається на C1.`,
     A:[{id:'C2',by:'A',ref:['feature','HEAD']},{id:'C1',by:'base',ref:['main']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git push -u origin feature/badge`,cap:`A пушить гілку feature на сервер. З'являється origin/feature.`,
     A:[{id:'C2',by:'A',ref:['feature']},{id:'C1',by:'base',ref:['main']}],R:[{id:'C2',by:'A',ref:['origin/feature']},{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'B',cmd:`git fetch`,cap:`B робить fetch — тепер бачить гілку origin/feature, але працює ще на main.`,
     A:[{id:'C2',by:'A',ref:['feature']},{id:'C1',by:'base',ref:['main']}],R:[{id:'C2',by:'A',ref:['origin/feature']},{id:'C1',by:'base',ref:['main']}],B:[{id:'C2',by:'A',ref:['origin/feature']},{id:'C1',by:'base',ref:['main','HEAD']}]},
    {actor:'B',cmd:`git switch feature/badge`,cap:`B перемикається на feature/badge і бачить коміт C2 від A. Тепер обидва можуть працювати в одній гілці.`,
     A:[{id:'C2',by:'A',ref:['feature']},{id:'C1',by:'base',ref:['main']}],R:[{id:'C2',by:'A',ref:['origin/feature']},{id:'C1',by:'base',ref:['main']}],B:[{id:'C2',by:'A',ref:['feature','HEAD']},{id:'C1',by:'base',ref:['main']}]}
  ]},
  mergepr:{steps:[
    {actor:'sys',cmd:`стан перед злиттям`,cap:`Гілка feature (C2 від A) готова. main на сервері — на C1. B уже на main.`,
     A:[{id:'C2',by:'A',ref:['feature']},{id:'C1',by:'base',ref:['main']}],R:[{id:'C2',by:'A',ref:['origin/feature']},{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main','HEAD']}]},
    {actor:'sys',cmd:`merge feature → main (веб)`,cap:`feature зливають у main у веб-репозиторії (без окремого review-бар'єра). Тут fast-forward: main іде на C2.`,
     A:[{id:'C2',by:'A',ref:['feature']},{id:'C1',by:'base',ref:['main']}],R:[{id:'C2',by:'A',ref:['origin/main','origin/feature']},{id:'C1',by:'base'}],B:[{id:'C1',by:'base',ref:['main','HEAD']}]},
    {actor:'A',cmd:`git switch main && git pull`,cap:`A повертається на main і підтягує C2.`,
     A:[{id:'C2',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['origin/main']},{id:'C1',by:'base'}],B:[{id:'C1',by:'base',ref:['main','HEAD']}]},
    {actor:'B',cmd:`git switch main && git pull`,cap:`B оновлює свій main. Усі три на C2.`,
     A:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['origin/main']},{id:'C1',by:'base'}],B:[{id:'C2',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git branch -d feature/badge`,cap:`Після злиття гілку feature видаляють локально й на сервері (git push origin --delete feature/badge).`,
     A:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['origin/main']},{id:'C1',by:'base'}],B:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}]}
  ]},
  cache:{steps:[
    {actor:'sys',cmd:`git clone <url>`,cap:`Обидва на C1. У проєкті чомусь немає рядка cache.abf у .gitignore.`,
     A:[{id:'C1',by:'base',ref:['main']}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git add . && git commit -m "зміни"`,cap:`A робить git add . — і разом з правками випадково комітить важкий cache.abf → C2.`,note:`git add . захопив **/.pbi/cache.abf, бо його не було в .gitignore.`,
     A:[{id:'C2',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}],R:[{id:'C1',by:'base',ref:['main']}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git push`,cap:`C2 (з cache.abf) лягає на сервер.`,
     A:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C1',by:'base',ref:['main']}]},
    {actor:'B',cmd:`git pull   →   відкриває .pbip`,cap:`B тягне C2 і відкриває проєкт — Power BI Desktop кидає помилку type-conflict через чужий cache.abf.`,note:`Чужий машинозалежний кеш несумісний із локальним середовищем B.`,
     A:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git rm --cached "**/.pbi/cache.abf"`,cap:`Прибираємо cache.abf з відстеження (файл лишається на диску, але Git його більше не веде).`,
     A:[{id:'C2',by:'A',ref:['main','HEAD']},{id:'C1',by:'base'}],R:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}],B:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`# .pbi/ → .gitignore; commit; push`,cap:`Додаємо .pbi/ у .gitignore і комітимо → C3 на сервері.`,
     A:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],R:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],B:[{id:'C2',by:'A',ref:['main']},{id:'C1',by:'base'}]},
    {actor:'B',cmd:`rm .pbi/cache.abf && git pull`,cap:`B видаляє свій локальний кеш і тягне C3. Проєкт відкривається, кеш перебудується локально. Конфліктів більше нема.`,
     A:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],R:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],B:[{id:'C3',by:'A',ref:['main','HEAD']},{id:'C2',by:'A'},{id:'C1',by:'base'}]}
  ]},
  reflog:{steps:[
    {actor:'sys',cmd:`стан`,cap:`У A локально три коміти: C1→C2→C3 (main на C3). Сервер і B теж на C3.`,
     A:[{id:'C3',by:'A',ref:['main','HEAD']},{id:'C2',by:'A'},{id:'C1',by:'base'}],R:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],B:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git reset --hard C1   (помилково)`,cap:`A хотів прибрати один коміт, але скинув аж на C1. Локально C2 і C3 «зникли».`,note:`Робоча копія A тепер на C1. Але коміти не стерті фізично — їх видно в reflog. Сервер і B не зачеплено.`,
     A:[{id:'C1',by:'base',ref:['main','HEAD']}],R:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],B:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git reflog`,cap:`reflog показує всі переміщення HEAD. A бачить рядок, де HEAD був на C3 (напр. SHA a1b2c3d).`,
     A:[{id:'C1',by:'base',ref:['main','HEAD']}],R:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],B:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}]},
    {actor:'A',cmd:`git reset --hard a1b2c3d`,cap:`A повертає main на C3. Нічого не втрачено — стан повністю відновлено.`,
     A:[{id:'C3',by:'A',ref:['main','HEAD']},{id:'C2',by:'A'},{id:'C1',by:'base'}],R:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}],B:[{id:'C3',by:'A',ref:['main']},{id:'C2',by:'A'},{id:'C1',by:'base'}]}
  ]},
  cherry:{steps:[
    {actor:'sys',cmd:`стан`,cap:`prod = main на C2 (сервер + обидва). A у гілці feature має коміт-фікс F1 і недороблений F2.`,
     A:[{id:'F2',by:'A',ref:['feature','HEAD']},{id:'F1',by:'A'},{id:'C2',by:'base',ref:['main']}],R:[{id:'C2',by:'base',ref:['main']}],B:[{id:'C2',by:'base',ref:['main','HEAD']}]},
    {actor:'A',cmd:`git switch main`,cap:`A переходить на main (prod-гілку).`,
     A:[{id:'C2',by:'base',ref:['main','HEAD']}],R:[{id:'C2',by:'base',ref:['main']}],B:[{id:'C2',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git cherry-pick <F1>`,cap:`A бере ЛИШЕ коміт-фікс F1 → його копія F1' лягає на main. Недороблений F2 не чіпали.`,
     A:[{id:"F1'",by:'A',ref:['main','HEAD']},{id:'C2',by:'base'}],R:[{id:'C2',by:'base',ref:['main']}],B:[{id:'C2',by:'base',ref:['main']}]},
    {actor:'A',cmd:`git push`,cap:`Фікс F1' у проді. Решта фічі (F2) спокійно лишилась у гілці feature.`,
     A:[{id:"F1'",by:'A',ref:['main']},{id:'C2',by:'base'}],R:[{id:"F1'",by:'A',ref:['main']},{id:'C2',by:'base'}],B:[{id:'C2',by:'base',ref:['main']}]},
    {actor:'B',cmd:`git pull`,cap:`B підтягує гарячий фікс. Прод оновлено в усіх.`,
     A:[{id:"F1'",by:'A',ref:['main']},{id:'C2',by:'base'}],R:[{id:"F1'",by:'A',ref:['main']},{id:'C2',by:'base'}],B:[{id:"F1'",by:'A',ref:['main','HEAD']},{id:'C2',by:'base'}]}
  ]}
};
function buildScenarios(){
  const L={A:'Розробник A',B:'Розробник B',sys:'Система / сервер'};
  document.querySelectorAll('.scplayer').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const sc=SCEN[el.dataset.s];if(!sc)return;let idx=0;
    el.innerHTML=`<div class="sc-cmd"></div><div class="repos"></div><div class="gcap sc-cap"></div><div class="sc-note-h"></div><div class="pnav"><button class="ghost sc-prev">← Назад</button><button class="sc-next">Далі →</button><span class="cnt sc-cnt"></span></div>`;
    const cmd=el.querySelector('.sc-cmd'),repos=el.querySelector('.repos'),cap=el.querySelector('.sc-cap'),noteH=el.querySelector('.sc-note-h'),cnt=el.querySelector('.sc-cnt'),prev=el.querySelector('.sc-prev'),next=el.querySelector('.sc-next');
    function render(){
      const s=sc.steps[idx];
      cmd.innerHTML=`<span class="sc-actor ${s.actor}">${L[s.actor]}</span>`;
      if(s.cmd){const cs=document.createElement('span');cs.className='sc-cmdtext';cs.textContent=s.cmd;cmd.appendChild(cs);}
      repos.innerHTML=repoCol('💻 A — локально','Розробник A',s.A)+repoCol('☁️ Сервер','origin (хмара)',s.R,'remote')+repoCol('💻 B — локально','Розробник B',s.B);
      cap.textContent=s.cap;
      if(s.note){noteH.innerHTML='<div class="sc-note"></div>';noteH.querySelector('.sc-note').textContent=s.note;}else noteH.innerHTML='';
      cnt.textContent=`крок ${idx} / ${sc.steps.length-1}`;prev.disabled=idx===0;next.disabled=idx===sc.steps.length-1;
    }
    prev.onclick=()=>{idx=Math.max(0,idx-1);render();};
    next.onclick=()=>{idx=Math.min(sc.steps.length-1,idx+1);render();};
    render();
  });
}

/* === 6. ВІДЖЕТИ === */
function buildPlayers(){
  document.querySelectorAll('.gplayer').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const steps=PLAYERS[el.dataset.p];if(!steps)return;let idx=0;
    el.innerHTML=`<div class="gsvg"></div><div class="gcap"></div>
      <div class="pnav"><button class="ghost gp-prev">← Назад</button><button class="gp-next">Далі →</button><span class="cnt gp-cnt"></span></div>
      <div class="glegend"><span><i style="background:#f0a35e"></i>main</span><span><i style="background:#5bd6a8"></i>feature/нові</span><span><i style="background:#6cb6ff"></i>серверні</span><span><i style="background:#c9a0e8"></i>merge-коміт</span><span><i style="border:1px dashed #566070;border-radius:50%"></i>orphaned</span></div>`;
    const svg=el.querySelector('.gsvg'),cap=el.querySelector('.gcap'),cnt=el.querySelector('.gp-cnt'),prev=el.querySelector('.gp-prev'),next=el.querySelector('.gp-next');
    function render(){svg.innerHTML=drawGraph(steps[idx]);cap.innerHTML=steps[idx].cap;cnt.textContent=`крок ${idx} / ${steps.length-1}`;prev.disabled=idx===0;next.disabled=idx===steps.length-1;}
    prev.onclick=()=>{idx=Math.max(0,idx-1);render();};
    next.onclick=()=>{idx=Math.min(steps.length-1,idx+1);render();};
    render();
  });
}
/* перемішує варіанти відповідей і перераховує індекс(и) правильної,
   щоб правильна відповідь не була завжди першою. Працює і для single, і для multi. */
function shuffleQ(q){
  const perm=q.opts.map((_,i)=>i);
  for(let i=perm.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}
  const opts=perm.map(i=>q.opts[i]);
  const correct=Array.isArray(q.correct)?q.correct.map(c=>perm.indexOf(c)):perm.indexOf(q.correct);
  return Object.assign({},q,{opts,correct});
}
function buildQuizzes(){
  document.querySelectorAll('.quiz').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const qs0=QUIZ[el.dataset.q];if(!qs0)return;
    const qs=qs0.map(shuffleQ);
    el.innerHTML=`<div class="wtitle">Міні-вправа</div>`+qs.map((q,qi)=>{
      if(q.multi){
        return `<div class="qcard" data-qi="${qi}"><div class="qq">${q.q}</div><div class="q-multi">`+q.opts.map((o,oi)=>`<label><input type="checkbox" data-oi="${oi}"> ${o}</label>`).join('')+`</div><button class="q-check">Перевірити</button><div class="q-why">${q.why}</div></div>`;
      }
      return `<div class="qcard" data-qi="${qi}"><div class="qq">${q.q}</div>`+q.opts.map((o,oi)=>`<button class="q-opt" data-oi="${oi}">${o}</button>`).join('')+`<div class="q-why">${q.why}</div></div>`;
    }).join('');
    qs.forEach((q,qi)=>{
      const qel=el.querySelector(`.qcard[data-qi="${qi}"]`);
      if(q.multi)qel.querySelector('.q-check').onclick=()=>gradeMulti(qel,q);
      else qel.querySelectorAll('.q-opt').forEach(b=>b.onclick=()=>gradeSingle(qel,q,+b.dataset.oi));
    });
  });
}
function gradeSingle(qel,q,oi){
  qel.querySelectorAll('.q-opt').forEach((b,bi)=>{b.disabled=true;if(bi===q.correct)b.classList.add(bi===oi?'correct':'reveal');else if(bi===oi)b.classList.add('wrong');});
  qel.querySelector('.q-why').classList.add('show');
}
function gradeMulti(qel,q){
  qel.querySelectorAll('.q-multi label').forEach((lab,oi)=>{
    const checked=lab.querySelector('input').checked,should=q.correct.includes(oi);
    lab.classList.remove('correct','wrong');
    if(should)lab.classList.add('correct'); else if(checked)lab.classList.add('wrong');
    lab.querySelector('input').disabled=true;
  });
  qel.querySelector('.q-check').disabled=true;
  qel.querySelector('.q-why').classList.add('show');
}
let lcCur=0;
function lcPlace(z){
  lcCur=z;
  document.querySelectorAll('#lcZones .chiphold').forEach(h=>h.innerHTML='');
  document.querySelectorAll('#lcZones .zone').forEach(zz=>zz.classList.remove('lit'));
  const zone=document.querySelector(`#lcZones .zone[data-z="${z}"]`);if(!zone)return;
  zone.querySelector('.chiphold').innerHTML='<span class="filechip">model.tmdl</span>';zone.classList.add('lit');
}
const LC_EXP={add:'git add — зміни переміщено у Staging. Увійдуть у наступний коміт.',commit:'git commit — створено коміт у локальному репозиторії. Staging очищено.',push:'git push — коміти відправлено на сервер. Тепер їх бачить команда.',fetch:'git fetch — завантажено коміти з сервера, робочі файли не змінено.',restore:'git restore — зміни у робочій директорії відкинуто.',reset:'git reset — вказівник пересунуто; зміни повернулись у робочу директорію (mixed).'};
// звідки дозволена кожна дія (щоб віджет не вчив «push без коміту»)
const LC_REQ={add:[0],commit:[1],push:[2],fetch:[3],restore:[0],reset:[2]};
const LC_BLOCK={
  add:'git add бере зміни з Working Dir — зараз файл уже далі по циклу. Натисни git reset, щоб повернути його назад.',
  commit:'Нічого комітити: у Staging порожньо — спершу git add.',
  push:'Нема що відправляти: push шле КОМІТИ, а їх ще немає — спершу git add, потім git commit.',
  fetch:'git fetch забирає нове з сервера — спершу доведи файл до сервера (add → commit → push).',
  restore:'git restore відкидає незакомічені зміни у Working Dir — зараз файл не там.',
  reset:'git reset працює із закоміченим — спершу доведи файл до Repository (add → commit).'
};
function lc(z,act){
  const e=document.getElementById('lcExp');
  if(LC_REQ[act]&&LC_REQ[act].indexOf(lcCur)<0){if(e)e.textContent='⛔ '+LC_BLOCK[act];return;}
  lcPlace(z);if(e)e.textContent=LC_EXP[act];
}
const RS={
  soft:{head:['wipe','✕ скинуто'],stage:['keep','✓ збережено'],work:['keep','✓ збережено'],t:'--soft: пересуває лише вказівник. Зміни лишаються у Staging — готові до перезбірки в новий коміт.'},
  mixed:{head:['wipe','✕ скинуто'],stage:['wipe','✕ скинуто'],work:['keep','✓ збережено'],t:'--mixed (за замовч.): вказівник назад + очистка Staging. Зміни лишаються у робочій директорії як unstaged.'},
  hard:{head:['wipe','✕ скинуто'],stage:['wipe','✕ скинуто'],work:['wipe','✕ втрачено'],t:'--hard: вказівник + Staging + робоча директорія назад. Незакомічене ВТРАЧАЄТЬСЯ. Відновлення — лише через reflog.'}
};
function rs(mode){
  const m=RS[mode];
  ['head','stage','work'].forEach(k=>{const cell=document.querySelector(`#rsGrid .rz[data-r="${k}"]`);if(!cell)return;cell.className='rz '+m[k][0];cell.querySelector('.rs').textContent=m[k][1];});
  const e=document.getElementById('rsExp');if(e)e.textContent=m.t;
}
const TREE={
  root:{t:`PDP/`,d:`Коренева папка репозиторію. Містить проєкт + прихований .git з історією.`},
  pbip:{t:`PDP.pbip`,d:`Файл-вказівник (малий JSON). Точка входу: подвійний клік відкриває проєкт у Power BI Desktop. КОМІТИТИ.`},
  report:{t:`PDP.Report/`,d:`Папка визначення звіту.`},
  reportdef:{t:`definition/ (PBIR)`,d:`Модульний JSON-опис звіту: сторінки, візуали, закладки окремими файлами. Гранулярні діфи. КОМІТИТИ.`},
  model:{t:`PDP.SemanticModel/`,d:`Папка визначення семантичної моделі.`},
  modeldef:{t:`definition/ (TMDL)`,d:`Опис моделі мовою TMDL: таблиці, колонки, міри, звязки. Серце моделі. КОМІТИТИ.`},
  modeltmdl:{t:`model.tmdl`,d:`Кореневий файл моделі: культура, налаштування, посилання на таблиці. КОМІТИТИ.`},
  tables:{t:`tables/*.tmdl`,d:`По файлу на таблицю. Тут живуть DAX-міри й колонки. Основне місце правок і конфліктів. КОМІТИТИ.`},
  pbi:{t:`.pbi/`,d:`Прихована папка з локальними службовими файлами. Повністю ігнорувати в Git.`,ig:true},
  cache:{t:`cache.abf`,d:`Локальна копія моделі з даними (Analysis Services Backup). Важка, машинозалежна. Спричиняє type-conflict між ПК.`,ig:true},
  local:{t:`localSettings.json`,d:`Налаштування лише для поточного користувача й компютера.`,ig:true},
  gitignore:{t:`.gitignore`,d:`Список ігнорованих шляхів. Power BI Desktop створює автоматично. КОМІТИТИ.`}
};
function buildTree(){
  const tree=document.getElementById('tree');if(!tree||tree.dataset.built)return;tree.dataset.built='1';
  tree.querySelectorAll('.tnode').forEach(n=>{n.onclick=()=>{tree.querySelectorAll('.tnode').forEach(x=>x.classList.remove('sel'));n.classList.add('sel');const d=TREE[n.dataset.k];document.getElementById('treeDetail').innerHTML=`<h4>${d.t}</h4><p>${d.d}</p>`+(d.ig?'<span class="ig">.gitignore — не комітити</span>':'');};});
}
const O={A:{m:'додати форму логіну'},B:{m:'виправити друкарську помилку'},C:{m:'додати валідацію'},D:{m:'WIP: дебаг'}};
const RBSTEPS=[
 {head:'feature → D',det:false,base:null,todo:null,graph:[gn('D',['head','branch']),gn('C'),gn('B'),gn('A'),gbase()],exp:`<b>Крок 0 — вихідний стан.</b> feature = 4 коміти поверх M. HEAD → feature → D.`},
 {head:'detached @ M',det:true,base:'M',todo:[gt('pick','A','pending'),gt('pick','B','pending'),gt('pick','C','pending'),gt('pick','D','pending')],graph:[gbase(['head'])],exp:`<b>Крок 1 — git rebase -i M.</b> Git формує todo-list (усі pick), робить checkout бази M. HEAD у стані detached.`},
 {head:'detached @ M',det:true,base:'M',todo:[gt('pick','A','pending'),gt('fixup','B','pending'),gt('reword','C','pending'),gt('drop','D','pending')],graph:[gbase(['head'])],exp:`<b>Крок 2 — призначення дій.</b> A pick, B fixup, C reword, D drop.`},
 {head:"detached @ A'",det:true,base:'M',todo:[gt('pick','A','done'),gt('fixup','B','pending'),gt('reword','C','pending'),gt('drop','D','pending')],graph:[gnew("A'",O.A.m,['head']),gbase()],exp:`<b>Крок 3 — replay A.</b> Diff A накладено на M, створено новий коміт A' з НОВИМ SHA.`},
 {head:"detached @ A'",det:true,base:'M',todo:[gt('pick','A','done'),gt('fixup','B','squashed'),gt('reword','C','pending'),gt('drop','D','pending')],graph:[gnew("A'",'додати форму логіну · +B',['head']),gbase()],exp:`<b>Крок 4 — fixup B.</b> Зміни B влито в A', окремого коміту немає, повідомлення B відкинуто.`},
 {head:"detached @ C'",det:true,base:'M',todo:[gt('pick','A','done'),gt('fixup','B','squashed'),gt('reword','C','done'),gt('drop','D','pending')],graph:[gnew("C'",'додати валідацію полів форми',['head']),gnew("A'",'логін · +B'),gbase()],exp:`<b>Крок 5 — reword C.</b> Replay C, Git зупинився для зміни повідомлення. Створено C'.`},
 {head:"detached @ C'",det:true,base:'M',todo:[gt('pick','A','done'),gt('fixup','B','squashed'),gt('reword','C','done'),gt('drop','D','dropped')],graph:[gnew("C'",'додати валідацію полів форми',['head']),gnew("A'",'логін · +B'),gbase()],exp:`<b>Крок 6 — drop D.</b> Рядок D пропущено, коміт не створено. Ланцюг: M ← A' ← C'.`},
 {head:"feature → C'",det:false,base:null,todo:[gt('pick','A','done'),gt('fixup','B','squashed'),gt('reword','C','done'),gt('drop','D','dropped')],graph:[gnew("C'",'додати валідацію полів форми',['head','branch']),gnew("A'",'логін · +B'),gbase()],exp:`<b>Крок 7 — завершення.</b> feature → C', HEAD прив'язано назад. Старі A–D orphaned. Потрібен push --force-with-lease.`}
];
function gn(k,p){return {id:k,t:'orig',m:O[k].m,p:p||[]}}
function gbase(p){return {id:'M',t:'base',m:'base (main)',p:p||['branch']}}
function gnew(id,m,p){return {id,t:'new',m,p:p||[]}}
function gt(a,k,s){return {a,k,s}}
let rbCur=0;
function buildRebase(){
  const st=document.getElementById('rbStatus');if(!st||st.dataset.built)return;st.dataset.built='1';rbCur=0;
  document.getElementById('rbPrev').onclick=()=>{rbCur=Math.max(0,rbCur-1);rbRender();};
  document.getElementById('rbNext').onclick=()=>{rbCur=Math.min(RBSTEPS.length-1,rbCur+1);rbRender();};
  rbRender();
}
function rbPtr(p){const m={head:['head','HEAD'],branch:['branch','feature']};return p.map(x=>`<span class="rb-ptr ${m[x][0]}">${m[x][1]}</span>`).join('');}
function rbStLabel(s){return {pending:'очікує',done:'готово',squashed:'влито',dropped:'видалено'}[s]}
function rbRender(){
  const s=RBSTEPS[rbCur];
  document.getElementById('rbStatus').innerHTML=`<div class="rb-chip ${s.det?'detach':''}"><b>HEAD</b> ${s.head}</div><div class="rb-chip"><b>base</b> ${s.base?'M':'—'}</div>`;
  const todoEl=document.getElementById('rbTodo'),col=document.getElementById('rbTodoCol');
  if(!s.todo){col.style.opacity=.4;todoEl.innerHTML='<div style="color:var(--dim);font-size:12px;text-align:center;padding:12px">todo-list ще не створено</div>';}
  else{col.style.opacity=1;todoEl.innerHTML=s.todo.map(r=>{const drop=r.a==='drop'?'rb-drop':'';return `<div class="rb-trow ${drop}"><span class="rb-act ${r.a}">${r.a}</span><span class="rb-msg">${r.k}: ${O[r.k].m}</span><span class="rb-st ${r.s}">${rbStLabel(r.s)}</span></div>`;}).join('');}
  document.getElementById('rbGraph').innerHTML=s.graph.map(n=>`<div class="rb-node ${n.t}"><div>${n.id}: ${n.m}${rbPtr(n.p)}</div></div>`).join('');
  document.getElementById('rbExp').innerHTML=s.exp;
  document.getElementById('rbPrev').disabled=rbCur===0;
  document.getElementById('rbNext').disabled=rbCur===RBSTEPS.length-1;
  document.getElementById('rbCnt').textContent=`крок ${rbCur} / ${RBSTEPS.length-1}`;
}

/* === ініціалізація === */
/* === 7. ПОШУК ПО КУРСУ ТА ЗГОРТАННЯ МЕНЮ === */
const _strip=document.createElement('div');
function stripHTML(h){_strip.innerHTML=h;return (_strip.textContent||'').replace(/\s+/g,' ').trim();}
function escapeHTML(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function escapeRe(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function emph(text,q){return escapeHTML(text).replace(new RegExp('('+escapeRe(q)+')','gi'),'<b>$1</b>');}
function clearMarks(){document.querySelectorAll('mark.hl').forEach(m=>{const t=document.createTextNode(m.textContent);m.parentNode.replaceChild(t,m);});}
function inSvg(node,root){let a=node.parentNode;while(a&&a!==root){if(a.nodeName==='svg')return true;a=a.parentNode;}return false;}
function highlightIn(el,q){
  if(!el||!q)return;
  const ql=q.toLowerCase();
  const rx=new RegExp('('+escapeRe(q)+')','gi');
  const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
    if(!n.nodeValue||!n.nodeValue.trim())return NodeFilter.FILTER_REJECT;
    const p=n.parentNode&&n.parentNode.nodeName;
    if(p==='SCRIPT'||p==='STYLE'||p==='MARK')return NodeFilter.FILTER_REJECT;
    if(inSvg(n,el))return NodeFilter.FILTER_REJECT;
    return n.nodeValue.toLowerCase().indexOf(ql)>=0?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(n=>{
    const frag=document.createElement('span');
    frag.innerHTML=escapeHTML(n.nodeValue).replace(rx,'<mark class="hl">$1</mark>');
    const parent=n.parentNode;
    while(frag.firstChild)parent.insertBefore(frag.firstChild,n);
    parent.removeChild(n);
  });
}
function initCollapse(){
  const cb=document.getElementById('collapseBtn'),rb=document.getElementById('reopenBtn');
  if(cb)cb.addEventListener('click',()=>document.body.classList.add('nav-collapsed'));
  if(rb)rb.addEventListener('click',()=>document.body.classList.remove('nav-collapsed'));
}

/* === 8. ІНТЕРАКТИВНИЙ ГЛОСАРІЙ КОМАНД GIT === */
const GIT_CMDS=[
 {cat:`Старт і налаштування`,c:`git init`,d:`Перетворити поточну папку на Git-репозиторій (з'явиться прихована .git).`},
 {cat:`Старт і налаштування`,c:`git clone <url>`,d:`Завантажити віддалений репозиторій локально разом з усією історією.`,ex:`git clone https://dev.azure.com/org/PDP/_git/PDP`},
 {cat:`Старт і налаштування`,c:`git config --global user.name "Ім'я"`,d:`Задати ім'я автора, яке підписуватиме коміти.`},
 {cat:`Старт і налаштування`,c:`git config --global user.email "пошта"`,d:`Задати email автора комітів.`},
 {cat:`Старт і налаштування`,c:`git remote add origin <url>`,d:`Під'єднати віддалений репозиторій під стандартною назвою origin.`},
 {cat:`Старт і налаштування`,c:`git remote -v`,d:`Показати під'єднані віддалені репозиторії та їхні URL.`},
 {cat:`Старт і налаштування`,c:`git remote set-url origin <url>`,d:`Змінити URL віддаленого репозиторію origin.`},

 {cat:`Перегляд`,c:`git status`,d:`Показати, які файли змінено й у якій зоні (working dir / staging).`},
 {cat:`Перегляд`,c:`git log --oneline --graph`,d:`Компактна історія комітів з деревом гілок і злиттів.`},
 {cat:`Перегляд`,c:`git log -1`,d:`Показати лише останній коміт.`},
 {cat:`Перегляд`,c:`git diff`,d:`Незакомічені зміни: робоча директорія проти staging.`},
 {cat:`Перегляд`,c:`git diff --staged`,d:`Зміни, які вже у staging і увійдуть у наступний коміт.`},
 {cat:`Перегляд`,c:`git show <sha>`,d:`Повні деталі та зміни конкретного коміту.`},
 {cat:`Перегляд`,c:`git blame <файл>`,d:`Хто й коли востаннє змінив кожен рядок файлу.`},

 {cat:`Зміни та коміти`,c:`git add <файл>`,d:`Додати файл у staging — кошик наступного коміту.`},
 {cat:`Зміни та коміти`,c:`git add .`,d:`Додати всі зміни в поточній папці й нижче у staging.`},
 {cat:`Зміни та коміти`,c:`git restore --staged <файл>`,d:`Прибрати файл зі staging; самі зміни лишаються в робочій директорії.`},
 {cat:`Зміни та коміти`,c:`git commit -m "опис"`,d:`Зафіксувати вміст staging у новий коміт з описом.`},
 {cat:`Зміни та коміти`,c:`git commit --amend`,d:`Змінити останній коміт (вміст чи повідомлення). Переписує SHA.`},
 {cat:`Зміни та коміти`,c:`git rm --cached <файл>`,d:`Прибрати файл з відстеження Git, лишивши його на диску.`,ex:`git rm --cached "**/.pbi/cache.abf"`},

 {cat:`Гілки та злиття`,c:`git branch`,d:`Показати список локальних гілок.`},
 {cat:`Гілки та злиття`,c:`git branch <ім'я>`,d:`Створити гілку (без переходу на неї).`},
 {cat:`Гілки та злиття`,c:`git branch -d <ім'я>`,d:`Видалити вже злиту гілку.`},
 {cat:`Гілки та злиття`,c:`git switch <гілка>`,d:`Перейти на існуючу гілку.`},
 {cat:`Гілки та злиття`,c:`git switch -c <гілка>`,d:`Створити гілку й одразу перейти на неї (-c = create).`,ex:`git switch -c feature/svg-badge`},
 {cat:`Гілки та злиття`,c:`git checkout <гілка|sha>`,d:`Універсальний перехід (стара команда; switch/restore — новіші).`},
 {cat:`Гілки та злиття`,c:`git merge <гілка>`,d:`Влити вказану гілку в поточну (fast-forward або merge-коміт).`},
 {cat:`Гілки та злиття`,c:`git tag <ім'я>`,d:`Створити нерухому мітку на коміті (зазвичай реліз).`},

 {cat:`Локальний ↔ хмарний`,c:`git fetch`,d:`Завантажити коміти з сервера, НЕ змінюючи робочі файли.`},
 {cat:`Локальний ↔ хмарний`,c:`git pull`,d:`fetch + merge у поточну гілку за один крок.`},
 {cat:`Локальний ↔ хмарний`,c:`git pull --rebase`,d:`Забрати чужі коміти й перенести свої поверх них (лінійна історія).`},
 {cat:`Локальний ↔ хмарний`,c:`git push`,d:`Відправити локальні коміти на сервер.`},
 {cat:`Локальний ↔ хмарний`,c:`git push -u origin <гілка>`,d:`Перший push гілки із запам'ятовуванням зв'язку (-u = upstream).`,ex:`git push -u origin feature/okr`},
 {cat:`Локальний ↔ хмарний`,c:`git push --force-with-lease`,d:`Безпечніший примусовий push після rebase: не затре чужі коміти, про які ти не знаєш.`},
 {cat:`Локальний ↔ хмарний`,c:`git push origin --delete <гілка>`,d:`Видалити гілку на сервері.`},

 {cat:`Скасування`,c:`git restore <файл>`,d:`Відкинути незбережені зміни файлу в робочій директорії.`},
 {cat:`Скасування`,c:`git reset --soft <commit>`,d:`Пересунути гілку назад; зміни лишаються у staging.`},
 {cat:`Скасування`,c:`git reset --mixed <commit>`,d:`Пересунути назад + очистити staging (режим за замовчуванням).`},
 {cat:`Скасування`,c:`git reset --hard <commit>`,d:`Скинути гілку, staging і робочу директорію. Незакомічене ВТРАЧАЄТЬСЯ.`},
 {cat:`Скасування`,c:`git revert <commit>`,d:`Створити НОВИЙ коміт, що скасовує зміни. Безпечно для спільних гілок.`},

 {cat:`Rebase та історія`,c:`git rebase <гілка>`,d:`Перенести коміти поточної гілки поверх вказаної (нові SHA).`},
 {cat:`Rebase та історія`,c:`git rebase -i <commit>`,d:`Інтерактивний rebase: squash, reword, drop, зміна порядку комітів.`,ex:`git rebase -i main`},
 {cat:`Rebase та історія`,c:`git rebase --continue`,d:`Продовжити rebase після вирішення конфлікту.`},
 {cat:`Rebase та історія`,c:`git rebase --abort`,d:`Скасувати rebase й повернути все до початкового стану.`},
 {cat:`Rebase та історія`,c:`git cherry-pick <sha>`,d:`Скопіювати один конкретний коміт з іншої гілки в поточну.`},

 {cat:`Схованки та відновлення`,c:`git stash`,d:`Тимчасово сховати незакомічені зміни «у кишеню».`},
 {cat:`Схованки та відновлення`,c:`git stash pop`,d:`Повернути сховані зміни назад у робочу директорію.`},
 {cat:`Схованки та відновлення`,c:`git stash list`,d:`Показати список збережених схованок.`},
 {cat:`Схованки та відновлення`,c:`git reflog`,d:`Журнал усіх переміщень HEAD; рятує коміти після reset чи rebase.`},
 {cat:`Схованки та відновлення`,c:`git clean -fd`,d:`Видалити невідстежувані файли й папки. Обережно: без відновлення.`},

 {cat:`Інструменти та розширення`,c:`git lfs track "<шаблон>"`,d:`Відстежувати великі бінарні файли через Git LFS (окреме сховище).`,ex:`git lfs track "*.png"`},
 {cat:`Інструменти та розширення`,c:`git filter-repo --path <шлях> --invert-paths`,d:`Видалити файл або шлях з УСІЄЇ історії (напр. випадково закомічений секрет).`},
 {cat:`Старт і налаштування`,c:`git config --global core.autocrlf`,d:`Налаштувати автоматичну нормалізацію кінців рядків CRLF/LF між ОС.`},
 {cat:`Зміни та коміти`,c:`git add -p`,d:`Додати у staging вибрані блоки змін (hunks), а не весь файл — для атомарних комітів.`},
 {cat:`Зміни та коміти`,c:`git commit -am "опис"`,d:`Застейджити всі ВІДСТЕЖУВАНІ зміни й одразу закомітити (без нових файлів).`},
 {cat:`Перегляд`,c:`git diff --stat`,d:`Статистика: які файли й на скільки рядків змінились.`},
 {cat:`Перегляд`,c:`git diff --word-diff`,d:`Підсвітити змінені слова, а не цілі рядки (зручно для DAX).`},
 {cat:`Перегляд`,c:`git log -S "<текст>"`,d:`Знайти коміти, де з'явився або зник рядок із цим текстом (pickaxe).`},
 {cat:`Перегляд`,c:`git log --follow <файл>`,d:`Історія файлу з урахуванням перейменувань.`},
 {cat:`Rebase та історія`,c:`git bisect start | bad | good | reset`,d:`Бінарний пошук коміту, що вніс баг.`},
 {cat:`Схованки та відновлення`,c:`git worktree add <шлях> <гілка>`,d:`Створити окрему робочу директорію на іншій гілці без stash.`},
 {cat:`Інструменти та розширення`,c:`pre-commit / commit-msg / pre-push`,d:`Git hooks — локальні скрипти-перевірки на події коміту чи пушу.`}
];
/* ключ CMDANIM для команди глосарія (null, якщо для неї немає анімації) */
function caKeyFor(cmd){
  const s=(cmd||'').trim();
  if(!s)return null;
  if(/^git\s+commit\s+--amend\b/.test(s))return CMDANIM.git_amend?'git_amend':null;
  const parts=s.split(/\s+/);
  let base;
  if(parts[0]==='git')base=parts[1]?`git ${parts[1]}`:'git';
  else base=parts[0];
  const key=base.replace(/[-\s]+/g,'_');
  return CMDANIM[key]?key:null;
}
let glossCat='Усі';
function buildGlossary(){
  const list=document.getElementById('glossList');if(!list||list.dataset.built)return;list.dataset.built='1';
  const order=[...new Set(GIT_CMDS.map(x=>x.cat))];
  const cats=['Усі',...order];
  const catsEl=document.getElementById('glossCats'),searchEl=document.getElementById('glossSearch'),countEl=document.getElementById('glossCount');
  catsEl.innerHTML=cats.map(c=>`<button class="gloss-chip${c===glossCat?' on':''}" data-c="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
  function render(){
    const raw=(searchEl.value||'').trim(),q=raw.toLowerCase();
    const groups={};let shown=0;
    GIT_CMDS.forEach(x=>{
      if(glossCat!=='Усі'&&x.cat!==glossCat)return;
      if(q&&x.c.toLowerCase().indexOf(q)<0&&x.d.toLowerCase().indexOf(q)<0)return;
      (groups[x.cat]=groups[x.cat]||[]).push(x);shown++;
    });
    let html='';
    order.forEach(cat=>{
      if(!groups[cat])return;
      html+=`<div class="gloss-cat-h">${escapeHTML(cat)}</div>`;
      groups[cat].forEach(x=>{
        const cc=raw?emph(x.c,raw):escapeHTML(x.c);
        const dd=raw?emph(x.d,raw):escapeHTML(x.d);
        const caKey=caKeyFor(x.c);
        const anim=caKey?`<details class="gl-anim"><summary>▶ Анімація: що робить ця команда</summary><div class="cmdanim" data-ca="${caKey}"></div></details>`:'';
        html+=`<div class="gloss-item"><div class="gc">${cc}</div><div class="gd">${dd}${x.ex?`<span class="gex">${escapeHTML(x.ex)}</span>`:''}</div>${anim}</div>`;
      });
    });
    list.innerHTML=shown?html:`<div class="gloss-empty">Нічого не знайдено</div>`;
    countEl.textContent=`Показано ${shown} з ${GIT_CMDS.length}`;
    buildCmdanim();
  }
  catsEl.querySelectorAll('.gloss-chip').forEach(b=>b.onclick=()=>{glossCat=b.dataset.c;catsEl.querySelectorAll('.gloss-chip').forEach(x=>x.classList.toggle('on',x===b));render();});
  searchEl.addEventListener('input',render);
  render();
}

/* === 9. ІНЛАЙН МІНІ-ВПРАВИ (qcheck) === */
const QCHECKS={
  qc_intro:{q:`Навіщо потрібен Git?`,opts:[`Зберігати версії, повертатись назад і працювати в команді`,`Оптимізувати DAX-міри й прискорювати роботу моделі`,`Зберігати дані звіту, щоб не робити refresh із джерела`,`Планувати автоматичне оновлення звітів за розкладом`],correct:0,why:`Git — це контроль версій: історія змін, відкат назад і безпечна спільна робота над одним проєктом.`},
  qc_term_what:{q:`Що таке термінал?`,opts:[`Текстове вікно, де команди вводять словами`,`Провідник файлів із деревом папок і кнопками`,`Панель налаштувань операційної системи`,`Редактор коду з підсвіткою синтаксису`],correct:0,why:`Термінал (командний рядок) — текстовий інтерфейс: ти друкуєш команду, комп'ютер її виконує.`},
  qc_pwd:{q:`Що показує команда <code>pwd</code>?`,opts:[`Поточну папку, де ти зараз`,`Список файлів у поточній папці`,`Історію введених команд`,`Гілку, у якій ти зараз працюєш`],correct:0,why:`pwd = print working directory — повний шлях до папки, у якій ти зараз перебуваєш.`},
  qc_cd:{q:`Куди веде <code>cd ..</code>?`,opts:[`На одну папку вгору (до батьківської)`,`У домашню папку користувача`,`У корінь диска C:`,`У попередню папку, де ти був щойно`],correct:0,why:`Дві крапки .. означають «батьківська папка». cd .. піднімає на рівень вище.`},
  qc_ls:{q:`Що робить <code>ls</code>?`,opts:[`Показує вміст поточної папки`,`Виводить повний шлях поточної папки`,`Створює нову папку`,`Показує стан файлів у Git`],correct:0,why:`ls = list: перелік файлів і папок у поточній директорії (у Windows CMD аналог — dir).`},
  qc_mkdir:{q:`Якою командою створити нову папку <code>reports</code>?`,opts:[`mkdir reports`,`cd reports`,`touch reports`,`ls reports`],correct:0,why:`mkdir = make directory. «mkdir reports» створює нову папку reports.`},
  qc_touch_echo:{q:`Чим <code>echo "text" &gt; file.txt</code> відрізняється від <code>touch file.txt</code>?`,opts:[`echo записує текст у файл; touch лише створює порожній`,`touch кладе текст у файл, а echo лише оновлює дату зміни`,`echo додає текст у кінець, а touch перезаписує файл заново`,`echo працює лише з .txt, а touch — з будь-яким розширенням`],correct:0,why:`touch створює порожній файл; echo "..." &gt; file.txt створює файл і кладе в нього текст (&gt; перезаписує, &gt;&gt; додає).`},
  qc_paths:{q:`Що означає <code>.</code> (одна крапка) у шляху?`,opts:[`Поточна папка`,`Батьківська папка (на рівень вище)`,`Домашня папка користувача`,`Прихований файл або папка`],correct:0,why:`. — поточна папка; .. — на рівень вище; ~ — домашня папка.`},
  qc_tab:{q:`Навіщо тиснути клавішу Tab у терміналі?`,opts:[`Автодоповнення назв файлів і папок`,`Очистити екран`,`Скасувати команду`,`Закрити термінал`],correct:0,why:`Tab доповнює назву; стрілка ↑ повертає попередню команду. Це економить час і прибирає помилки в назвах.`},
  qc_install:{q:`Як перевірити, що Git встановлено?`,opts:[`git --version`,`git install`,`git status`,`git config --list`],correct:0,why:`git --version виводить встановлену версію. Якщо команда невідома — Git ще не встановлено.`},
  qc_a_zones:{q:`Яка правильна послідовність зон при коміті?`,opts:[`working dir → staging (add) → repo (commit)`,`commit → add → push`,`repo → staging → working`,`staging (add) → working dir → repo (commit)`],correct:0,why:`Спершу правки в робочій папці, потім git add у staging, потім git commit зберігає їх у репозиторій.`},
  qc_a_snapshot:{q:`Як Git зберігає коміт?`,opts:[`Як повний знімок стану (незмінні файли — посилання)`,`Лише різницю рядків від попереднього коміту`,`Як стиснутий zip-архів усіх файлів проєкту`,`Як запис у центральній базі даних на сервері`],correct:0,why:`Git — snapshot-based: знімок усього проєкту; незмінені файли зберігаються як посилання на попередні версії.`}
};
function buildQchecks(){
  document.querySelectorAll('.qcheck').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const q0=QCHECKS[el.dataset.qc];if(!q0)return;
    const q=shuffleQ(q0);
    el.innerHTML=`<div class="qc-q">${q.q}</div>`+q.opts.map((o,i)=>`<button class="qc-opt" data-i="${i}">${o}</button>`).join('')+`<div class="qc-why">${q.why}</div>`;
    const why=el.querySelector('.qc-why');let done=false;
    el.querySelectorAll('.qc-opt').forEach(b=>b.onclick=()=>{
      if(done)return;done=true;
      const i=+b.dataset.i;
      el.querySelectorAll('.qc-opt').forEach((x,xi)=>{x.disabled=true;if(xi===q.correct)x.classList.add('correct');});
      if(i!==q.correct)b.classList.add('wrong');
      why.classList.add('show');
    });
  });
}


/* === 10. ДОДАТКОВІ ДАНІ === */
Object.assign(QCHECKS,{
  qc_cp:{q:`Скопіювати файл <code>a.txt</code> у папку <code>backup/</code> — це...`,opts:[`cp a.txt backup/`,`mv a.txt backup/`,`rm a.txt`,`cd backup/`],correct:0,why:`cp копіює: оригінал лишається. mv — переміщає (оригінал зникає зі старого місця).`},
  qc_rm:{q:`Чим небезпечна команда <code>rm -r folder</code>?`,opts:[`Видаляє папку з усім вмістом без кошика`,`Переносить папку в кошик, звідки її важко дістати`,`Видаляє лише вкладені файли, а порожню папку лишає`,`Видаляє папку тільки з Git-історії, а на диску лишає`],correct:0,why:`rm видаляє безповоротно — «Кошика» немає. Перед rm -r двічі перевіряй шлях.`},
  qc_auth:{q:`Публічний SSH-ключ...`,opts:[`додається на сервер; приватний лишається тільки в тебе`,`лишається тільки в тебе, а приватний вантажиться на сервер`,`генерується сервером і надсилається тобі на пошту`,`діє один сеанс і оновлюється при кожному push`],correct:0,why:`Пара ключів: публічний (замок) — на сервер, приватний (ключ) — нікому й ніколи.`},
  qc_fetch:{q:`Чим <code>git fetch</code> відрізняється від <code>git pull</code>?`,opts:[`fetch лише завантажує зміни; pull = fetch + одразу merge у твою гілку`,`fetch одразу зливає зміни у твою гілку, а pull лише завантажує`,`fetch тягне лише поточну гілку, а pull — усі гілки репозиторію`,`fetch працює з локальним репозиторієм, а pull — із сервером`],correct:0,why:`fetch безпечно оновлює знання про сервер (origin/main), не чіпаючи твої файли; pull ще й зливає.`}
});

const CSIM={
  cs_pwd:{t:`Виведи повний шлях поточної папки.`,a:['^pwd$'],sol:'pwd'},
  cs_cd:{t:`Перейди на одну папку вгору.`,a:['^cd \\.\\.$'],sol:'cd ..'},
  cs_mkdir:{t:`Створи папку <code>reports</code>.`,a:['^mkdir reports$'],sol:'mkdir reports'},
  cs_touch:{t:`Створи порожній файл <code>notes.md</code>.`,a:['^touch notes\\.md$'],sol:'touch notes.md'},
  cs_init:{t:`Перетвори поточну папку на Git-репозиторій.`,a:['^git init$'],sol:'git init'},
  cs_status:{t:`Подивись стан файлів: що змінено, що у staging.`,a:['^git status$'],sol:'git status'},
  cs_addall:{t:`Додай у staging усі зміни.`,a:['^git add \\.$','^git add -A$','^git add --all$'],sol:'git add .'},
  cs_commit:{t:`Зроби коміт з повідомленням <code>add sales measure</code>.`,a:['^git commit -m "add sales measure"$',"^git commit -m 'add sales measure'$"],sol:'git commit -m "add sales measure"'},
  cs_branch:{t:`Однією командою створи гілку <code>feature/sales</code> і перейди в неї.`,a:['^git switch -c feature/sales$','^git checkout -b feature/sales$'],sol:'git switch -c feature/sales'},
  cs_clone:{t:`Клонуй репозиторій <code>https://dev.azure.com/org/repo</code>.`,a:['^git clone \\S+$'],sol:'git clone https://dev.azure.com/org/repo'},
  cs_push:{t:`Відправ коміти поточної гілки на сервер.`,a:['^git push$','^git push -u origin \\S+$'],sol:'git push'}
};

const ORDERS={
  or_zones:{title:`Віднови порядок: шлях зміни до сервера`,steps:[`Редагуєш файл у робочій папці`,`git add — зміна у staging`,`git commit — у локальну історію`,`git push — на сервер`]},
  or_feature:{title:`Порядок роботи з фічею (процес команди)`,steps:[`git switch -c feature/x`,`Правки + коміти у гілці`,`git switch main і git pull`,`git merge feature/x`,`git push у main`]},
  or_conflict:{title:`Порядок вирішення конфлікту`,steps:[`git pull → CONFLICT`,`Відкрити файл, прибрати маркери <<< === >>>`,`git add файл`,`git commit`,`git push`]},
  or_deploy:{title:`Шлях зміни у прод`,steps:[`Merge у main + push`,`Git sync (Update from Git) оновлює робочу область — звіт опубліковано`,`Опційно: deployment pipeline промоутить Dev → Prod`,`Перевірка звіту після публікації`]}
};


Object.assign(QCHECKS,{
  qc_why_git:{q:`Головна проблема, яку Git знімає для Power BI-розробника?`,opts:[`Копії "v7_final_FINAL" і страх зламати звіт без вороття`,`Повільний рендер візуалів на важких сторінках звіту`,`Довгий refresh великої моделі з повільного джерела`,`Перевищення ліміту розміру датасету в Power BI Service`],correct:0,why:`Git дає історію версій і безпечні експерименти в гілках — копії файлів і страх зникають.`},
  qc_terms:{q:`Коміт — це...`,opts:[`збережений знімок стану проєкту з описом`,`окрема лінія розробки, паралельна до main`,`відправлення локальних змін на сервер`,`копія репозиторію на твоєму компʼютері`],correct:0,why:`Коміт = знімок усього проєкту в момент часу + повідомлення, хто/що/навіщо.`},
  qc_config:{q:`Навіщо в PBIP-репозиторії .gitattributes з <code>* text=auto</code>?`,opts:[`Вирівнює кінці рядків (CRLF/LF) — зникають фантомні diff між машинами`,`Позначає бінарні файли, щоб Git не показував для них diff`,`Приховує технічні файли моделі з git status`,`Стискає TMDL-файли, щоб репозиторій важив менше`],correct:0,why:`Різні ОС/редактори пишуть різні кінці рядків; без нормалізації diff показує «змінився весь файл».`},
  qc_addp:{q:`<code>git add -p</code> дозволяє...`,opts:[`додати у staging лише частину змін файлу (по шматках)`,`додати у staging усі файли проєкту одразу`,`переглянути зміни у файлі перед комітом, не додаючи їх`,`скасувати додавання файлу зі staging назад у робочу папку`],correct:0,why:`-p (patch) проходить по шматках змін і питає, які саме класти в коміт — основа атомарних комітів.`},
  qc_irebase:{q:`Дія <code>squash</code> в interactive rebase — це...`,opts:[`злити кілька комітів в один`,`змінити повідомлення коміту, не чіпаючи зміни`,`викинути коміт зовсім, разом із його змінами`,`поміняти коміти місцями в історії гілки`],correct:0,why:`squash склеює коміт із попереднім — так «wip, wip, fix» перетворюється на один чистий коміт.`},
  qc_pbip_what:{q:`Чому PBIP дружить із Git, а .pbix — ні?`,opts:[`PBIP — текстові файли (JSON/TMDL), які порівнюються построково; .pbix — бінарний архів`,`PBIP важить менше, тож у нього швидший push і pull`,`.pbix не можна відкрити у Power BI Desktop після коміту`,`PBIP шифрується Git-ом автоматично, а .pbix — ні`],correct:0,why:`Git ефективний лише з текстом: видно diff, працює merge. Бінарник — чорна скринька.`},
  qc_tmdl_fmt:{q:`Семантична модель у PBIP описується у форматі...`,opts:[`TMDL — текстовому, окремий файл на таблицю`,`PBIR — тому самому форматі, що й візуали звіту`,`XMLA — бінарному дампі всієї моделі одним файлом`,`M — скриптах Power Query для кожної таблиці`],correct:0,why:`TMDL (Tabular Model Definition Language) — читабельний текст: таблиці, міри, зв'язки по файлах.`},
  qc_limits:{q:`Про яке обмеження PBIP треба пам'ятати?`,opts:[`Дані (кеш) не версіонуються — у Git лише визначення моделі та звіту`,`PBIP зберігає лише модель, а візуали звіту доводиться робити окремо`,`PBIP підтримує тільки імпорт, а DirectQuery-моделі не зберігає`,`PBIP працює лише в Power BI Service, а не в Desktop`],correct:0,why:`У репозиторії — «креслення» (метадані). Дані тягнуться з джерел при refresh.`},
  qc_te:{q:`Роль BPA (Best Practice Analyzer) у Tabular Editor:`,opts:[`автоматична перевірка моделі на анти-патерни за набором правил`,`масове перейменування обʼєктів моделі за шаблоном`,`оптимізація DAX-мір для швидшого обрахунку`,`генерація документації по таблицях і мірах моделі`],correct:0,why:`BPA проганяє модель по правилах (назви, формати, зайві колонки…) — зручно і локально, і в CI.`},
  qc_ignore:{q:`Що з цього МАЄ бути у .gitignore PBIP-репозиторію?`,opts:[`Кеш і локальне: cache.abf, localSettings.json, *.pbix`,`definition/*.tmdl`,`сам файл .pbip`,`папка pages/`],correct:0,why:`Версіонуємо визначення; кеш даних і персональні налаштування — шум і зайві мегабайти.`},
  qc_conflict_pbip:{q:`Конфлікт у measure.tmdl: маркери &lt;&lt;&lt;&lt;&lt;&lt;&lt; ======= &gt;&gt;&gt;&gt;&gt;&gt;&gt; прибрано, лишилась потрібна версія міри. Наступний крок?`,opts:[`git add файл, потім git commit`,`git push одразу`,`видалити файл`,`git revert`],correct:0,why:`Вирішений конфлікт треба зафіксувати: add позначає «вирішено», commit завершує merge.`},
  qc_ref30:{q:`Симптом «модель не відкривається після merge» найчастіше означає...`,opts:[`дубль lineageTag — GUID має бути унікальним (кейс 1)`,`незняті маркери конфлікту &lt;&lt;&lt; === &gt;&gt;&gt; лишились у .tmdl`,`несумісна версія Power BI Desktop у колеги`,`пошкоджений кеш cache.abf після синхронізації`],correct:0,why:`При merge двох гілок легко отримати два об'єкти з однаковим lineageTag — Desktop відмовляється відкривати.`},
  qc_conv:{q:`Добре повідомлення коміту:`,opts:[`fix: correct YTD filter in Sales measure`,`оновив звіт і трохи попрацював над мірами`,`зміни за сьогодні перед виходом на вихідні`,`правки після зустрічі, деталі питати в Олега`],correct:0,why:`Тип (fix/feat/chore) + що саме змінено. Через рік це єдина документація.`},
  qc_flows:{q:`Для невеликої PBI-команди зазвичай достатньо...`,opts:[`Feature Branch: короткі гілки від main і назад у main`,`повного Gitflow з develop/release/hotfix`,`пушити всім напряму в main`,`окремих форків на кожного`],correct:0,why:`Простий цикл гілка → merge → деплой покриває потреби; Gitflow — для великих релізних циклів.`},
  qc_devops:{q:`Build validation policy в Azure DevOps — це...`,opts:[`автоматичний запуск pipeline (напр., BPA) перед злиттям у main`,`ручний перегляд колегою`,`деплой у Prod`,`нічне резервне копіювання`],correct:0,why:`Політика ганяє перевірки автоматично — бар'єр якості без обов'язкового людського рев'ю.`},
  qc_security:{q:`Секрет потрапив у коміт і вже на сервері. Найперший крок:`,opts:[`Негайно ротувати (замінити) сам секрет`,`видалити файл наступним комітом`,`додати файл із секретом у .gitignore`,`переписати історію через git rebase і force-push`],correct:0,why:`Історія зберігає все — секрет уже скомпрометований. Спершу ротація, потім чистка історії (кейс 26).`},
  qc_hooks:{q:`pre-commit hook спрацьовує...`,opts:[`локально перед створенням коміту — і може його заблокувати`,`на сервері після push — і може відхилити зміни`,`після коміту, коли зміни вже збережено в історії`,`під час git pull перед злиттям чужих змін`],correct:0,why:`Hook — скрипт-«охоронець» на твоїй машині: не пройшла перевірка — коміт не створюється.`},
  qc_worktree:{q:`<code>git worktree add</code> дозволяє...`,opts:[`мати другу робочу папку з іншою гілкою одночасно`,`тимчасово сховати незакомічені зміни, щоб перемкнути гілку`,`зробити повну копію репозиторію в новій папці`,`під'єднати другий віддалений репозиторій як джерело`],correct:0,why:`Термінові hotfix без stash: main в одній папці, feature — в іншій, репозиторій один.`}
});

/* дані модуля 00: інструменти та інфраструктура */
Object.assign(QCHECKS,{
  qc_toolmap:{q:`Git, Azure DevOps Repos і Sourcetree — це відповідно...`,opts:[`двигун версій · сервер-сховище репозиторіїв · графічний клієнт`,`три назви одного продукту`,`редактор звітів · база даних · месенджер`,`термінал · редактор · хмарний диск`],correct:0,why:`Git робить усю роботу з версіями локально; хостинг (Azure DevOps або GitHub) зберігає спільну копію; Sourcetree — лише зручні кнопки поверх Git.`},
  qc_gitbash:{q:`Git Bash — це...`,opts:[`термінал для Windows з Unix-командами, який встановлюється разом із Git`,`графічний клієнт Git із кнопками для commit і push`,`розширення Git для роботи з великими бінарними файлами`,`вебінтерфейс для перегляду історії репозиторію`],correct:0,why:`Git Bash дає на Windows той самий термінал, що й на Linux/macOS: усі команди курсу вводяться саме тут.`},
  qc_hosting:{q:`GitHub і Azure DevOps Repos — це...`,opts:[`хостинги Git-репозиторіїв: сервер-сховище і вебінтерфейс поверх того самого Git`,`окремі системи контролю версій, конкуренти Git`,`графічні клієнти Git, які ставляться на компʼютер`,`сервіси для публікації та поширення звітів Power BI`],correct:0,why:`Обидва зберігають ту саму Git-історію. Різниця — в екосистемі довкола: у компаніях з Microsoft-стеком зазвичай Azure DevOps.`},
  qc_vscode:{q:`Навіщо Power BI-розробнику VS Code?`,opts:[`переглядати diff, правити TMDL/JSON і вирішувати конфлікти у merge-редакторі`,`будувати візуали замість Power BI Desktop`,`оновлювати дані семантичної моделі`,`публікувати звіти у Prod`],correct:0,why:`Модель і звіт у PBIP — це текстові файли, а VS Code — найзручніший інструмент для роботи з текстом і конфліктами.`},
  qc_gui:{q:`Sourcetree зручний тим, що...`,opts:[`показує історію та зміни наочно, а stage, commit і push робляться кнопками`,`замінює Azure DevOps`,`редагує міри DAX`,`сам публікує звіти в Power BI Service`],correct:0,why:`Sourcetree не додає нових можливостей до Git — він показує те саме наочно. Для щоденної рутини це часто швидше за термінал.`},
  qc_chain:{q:`Правильний ланцюжок доставки зміни користувачам:`,opts:[`Power BI Desktop (PBIP) → commit і push → Git sync оновлює робочу область (за потреби далі deployment pipeline у Prod)`,`кнопка Publish з Desktop одразу в Prod`,`копія .pbix на SharePoint`,`експорт звіту в PDF`],correct:0,why:`Зміна їде через Git: так є історія, відкат і контроль. Publish напряму оминає версіонування. Deployment pipeline — опційний рівень для команд з окремими Dev і Prod.`},
  qc_pbip_ignore:{q:`У git status видно cache.abf на 200 МБ. Що робити?`,opts:[`переконатись, що **/.pbi/cache.abf у .gitignore, і не комітити його`,`закомітити — в історії має бути все`,`видалити файл з диска`,`заархівувати і закомітити архів`],correct:0,why:`cache.abf — локальний кеш даних моделі. В історії мають жити лише визначення (текст); кеш перегенерується при відкритті проєкту.`}
});
Object.assign(CSIM,{
  cs_gitversion:{t:`Перевір, що Git встановлено: виведи його версію.`,a:['^git --version$'],sol:'git --version'}
});

/* дані уроків: revert / reflog / amend / detached HEAD */
Object.assign(QCHECKS,{
  qc_detached:{q:`Ти зробив <code>git checkout a1b2c3d</code>, щоб глянути стару версію звіту, і випадково закомітив правку. Як не втратити цей коміт?`,opts:[`git switch -c rescue — закріпити коміт новою гілкою, поки не перемкнувся`,`нічого робити не треба — коміт і так у безпеці`,`git switch main — повернутись на гілку, коміт переїде за тобою`,`git push — відправити коміт на сервер прямо звідси`],correct:0,why:`У detached HEAD новий коміт не належить жодній гілці: перемкнешся — і він осиротіє. Гілка-закладка (switch -c) робить його видимим назавжди.`},
  qc_revert_deep:{q:`Коміт зі зламаною мірою вже в main і на сервері. Чому саме revert, а не reset?`,opts:[`revert додає новий коміт-скасування і не переписує спільну історію — колеги просто заберуть його через pull`,`revert прибирає коміт з історії повністю, а reset лишає його слід`,`reset скасовує лише локальні коміти й не діє на гілку main`,`revert можна застосувати до будь-якого коміту, а reset — тільки до останнього`],correct:0,why:`reset пересунув би main назад — а колеги вже мають старі коміти, і їхні копії розійдуться з сервером. revert рухає історію лише вперед.`},
  qc_reflog_deep:{q:`Після <code>git reset --hard</code> зник коміт з готовою сторінкою звіту. Перший крок порятунку?`,opts:[`git reflog — знайти SHA зниклого коміту в журналі переміщень HEAD`,`git pull — стягнути зниклий коміт назад із сервера`,`git revert HEAD — скасувати reset новим комітом`,`git checkout -- . — відновити файли з останнього коміту`],correct:0,why:`reflog памʼятає кожну позицію HEAD близько 90 днів. Знайшов SHA — і повертаєшся: git reset --hard &lt;sha&gt; або git branch rescue &lt;sha&gt;.`},
  qc_amend:{q:`Щойно закомітив, але забув один файл, а push ще не робив. Найчистіший спосіб?`,opts:[`git add файл → git commit --amend — файл доїде тим самим комітом`,`ще один коміт з повідомленням "забув файл"`,`git reset --hard і зробити весь коміт заново з нуля`,`git stash файл, а потім розпакувати його в наступний коміт`],correct:0,why:`--amend переробляє останній коміт (з новим SHA). Поки коміт не запушено — це безпечно й тримає історію чистою.`}
});
Object.assign(CSIM,{
  cs_revert:{t:`Безпечно скасуй коміт <code>a1b2c3d</code> у спільній гілці.`,a:['^git revert a1b2c3d$'],sol:'git revert a1b2c3d'},
  cs_reflog:{t:`Виведи журнал усіх переміщень HEAD.`,a:['^git reflog$'],sol:'git reflog'},
  cs_amend:{t:`Додай щойно проіндексований файл до останнього коміту, не змінюючи повідомлення.`,a:['^git commit --amend --no-edit$'],sol:'git commit --amend --no-edit'}
});
Object.assign(ORDERS,{
  or_reflog_rescue:{title:`Порятунок коміту після reset --hard`,steps:[`Помітив: потрібний коміт зник з git log`,`git reflog — знайшов рядок з описом зниклого коміту`,`Скопіював його SHA`,`git branch rescue &lt;sha&gt; — закріпив коміт гілкою`,`Перевірив вміст і злив rescue куди треба`]}
});

/* дані уроків: Fabric Git integration, дані після публікації, capstone, diff-читання, міграція, blame */
Object.assign(QCHECKS,{
  qc_fabric_sync:{q:`У панелі Source control робочої області видно статус «Update required». Що це означає?`,opts:[`у гілці зʼявились нові коміти, яких ще немає в області — натисни Update from Git`,`в області є зміни, яких немає в гілці — їх треба закомітити`,`область і гілка розійшлися — потрібен ручний merge конфлікту`,`дані застаріли — датасету потрібен refresh із джерела`],correct:0,why:`Статуси Source control порівнюють область із гілкою: Update required = гілка попереду. Update from Git підтягне зміни — це і є звичайна публікація.`},
  qc_ws_uncommitted:{q:`Панель Source control показує Uncommitted changes: хтось відредагував звіт прямо у Power BI Service. Безпечна реакція?`,opts:[`зʼясувати, чия зміна: потрібну — Commit у гілку, випадкову — Undo; не лишати висіти`,`одразу Update from Git — свіжа гілка перезапише зайві зміни`,`закомітити зміну в гілку, не дивлячись, чия вона і що робить`,`відключити область від Git, щоб зміна більше не заважала`],correct:0,why:`Незакомічені зміни в області конфліктуватимуть із наступною синхронізацією. Джерело правди — Git, тож зміну або повертають у гілку, або відкидають.`},
  qc_diff_noise:{q:`Після збереження у Power BI Desktop diff показує зміну <code>lineageTag</code> у таблиці, якої ти не торкався. Що це?`,opts:[`технічний шум перегенерації — логіка не змінилась; головне переконатися, що змістовних правок у файлі немає`,`справжня зміна зв'язку між таблицями — її треба відкотити`,`конфлікт злиття, який Git не показав маркерами`,`збій збереження — файл треба перезаписати ще раз`],correct:0,why:`lineageTag — службовий GUID, Desktop подекуди перегенеровує його при збереженні. Навчись відрізняти такий шум від справжніх змін DAX чи структури.`},
  qc_diff_real:{q:`У diff файлу <code>tables/Sales.tmdl</code>: рядок <code>- SUM(Sales[Amount])</code> замінено на <code>+ CALCULATE(SUM(Sales[Amount]), USERELATIONSHIP(…))</code>. Це...`,opts:[`справжня зміна логіки міри — саме її треба описати в повідомленні коміту`,`технічний шум перегенерації lineageTag при збереженні`,`зміна форматної рядкової властивості міри, а не її обрахунку`,`переміщення міри в іншу таблицю без зміни формули`],correct:0,why:`Зміна DAX-виразу — зміст. Шум (lineageTag, координати візуалів) у повідомленні не описують, а от зміну логіки — обовʼязково.`},
  qc_pbix_migrate:{q:`Опублікований звіт переводять із .pbix на PBIP. Правильний порядок?`,opts:[`відкрити .pbix у Desktop → Save As → PBIP у папку репозиторію → commit і push → підключити робочу область до гілки`,`видалити звіт із Service і створити з нуля`,`просто перейменувати файл .pbix на .pbip`,`експортувати звіт у PDF і закомітити його`],correct:0,why:`Save As створює текстову структуру PBIP; далі звичайний Git-цикл. Якщо назви елементів збігаються, підключення області до гілки збереже наявний звіт і його налаштування.`},
  qc_thin_report:{q:`Тонкий звіт (live connection до спільної моделі) зберегли як PBIP. Що зʼявиться в репозиторії?`,opts:[`лише папка .Report із definition.pbir — власної семантичної моделі тонкий звіт не має`,`і .Report, і .SemanticModel`,`один бінарний файл`,`нічого: тонкі звіти не підтримують PBIP`],correct:0,why:`Модель у тонкого звіту живе окремо (спільний датасет), тож у PBIP комітиться тільки звітна частина з посиланням на модель.`},
  qc_refresh_creds:{q:`Після першої синхронізації робочої області звіт порожній, а датасет просить credentials. Чому?`,opts:[`так і має бути: Git привіз лише визначення — дані зʼявляться після налаштування credentials і refresh`,`синхронізація перенесла лише звіт без моделі — треба закомітити .SemanticModel`,`у гілці бракує коміту з даними — хтось забув їх запушити`,`визначення моделі пошкодилось при merge — треба відкотити коміт`],correct:0,why:`У репозиторії — «креслення» моделі та звіту. Дані наповнюються в Service: credentials джерел, за потреби gateway, потім refresh.`},
  qc_capstone:{q:`У практикумі після git init команда git status показує cache.abf серед untracked-файлів. Про що це сигналить?`,opts:[`.gitignore відсутній або не збережений — кеш мав бути прихований від Git`,`усе гаразд: кеш даних теж має версіонуватись разом із моделлю`,`git init запустили не в тій папці — репозиторій треба перестворити`,`файл заблокований Power BI Desktop — перед комітом його треба закрити`],correct:0,why:`Desktop створює .gitignore разом із PBIP. Якщо кеш видно у status — перевір, що .gitignore лежить у корені й містить **/.pbi/cache.abf.`},
  qc_blame:{q:`Міра тиждень тому рахувала інакше. Найшвидший шлях зʼясувати, хто і коли її змінив?`,opts:[`git blame файлу міри або History / Annotate у веб-інтерфейсі Azure DevOps`,`git log без аргументів — гортати всі коміти репозиторію підряд`,`git diff між двома гілками, щоб побачити всі відмінності`,`git revert останнього коміту, щоб перевірити, чи справа в ньому`],correct:0,why:`blame показує автора й коміт для кожного рядка файлу; у вебі те саме дає Annotate — без термінала.`}
});
Object.assign(CSIM,{
  cs_blame:{t:`Подивись, хто і коли змінював кожен рядок файлу <code>Sales.tmdl</code>.`,a:['^git blame Sales\\.tmdl$'],sol:'git blame Sales.tmdl'}
});
Object.assign(ORDERS,{
  or_fabric_connect:{title:`Підключення робочої області до Git`,steps:[`Workspace settings → Git integration`,`Обрати організацію, проєкт і репозиторій Azure DevOps`,`Вказати гілку (main) і папку`,`Connect — область підключено`,`Update from Git — вміст гілки зʼявився в області`]},
  or_capstone:{title:`Практикум: від .pbix до опублікованого звіту`,steps:[`Save As: .pbix → PBIP у папці репозиторію`,`git init + перший commit`,`Створити віддалений репозиторій і push`,`feature-гілка: зміна міри + commit`,`merge у main + push`,`Підключити робочу область і Update from Git`]}
});
Object.assign(ORDERS,{
  or_setup:{title:`Розгортання інфраструктури з нуля`,steps:[`Встановити Git (разом із ним зʼявиться Git Bash)`,`git config: вказати імʼя та email`,`Створити репозиторій на GitHub або в Azure DevOps`,`git clone на свій компʼютер`,`Відкрити папку у VS Code і додати репозиторій у Sourcetree`]},
  or_toolchain:{title:`Шлях однієї зміни: від Power BI Desktop до користувачів`,steps:[`Відкрив PBIP у Power BI Desktop, вніс зміну, зберіг`,`Переглянув diff у Sourcetree або VS Code`,`Stage + Commit (кнопкою в Sourcetree або git commit у терміналі)`,`Push в Azure DevOps`,`Git sync опублікував зміну в робочій області`,`За потреби: deployment pipeline промоутить Dev → Prod`]}
});

/* === 11. СИМУЛЯТОР КОМАНД === */
function buildCsim(){
  document.querySelectorAll('.csim').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const c=CSIM[el.dataset.cs];if(!c)return;
    el.innerHTML=`<div class="cs-task">${c.t}</div>
      <div class="cs-row"><span class="cs-prompt">$</span><input class="cs-inp" type="text" spellcheck="false" autocomplete="off" placeholder="введи команду…"><button class="cs-check">Перевірити</button></div>
      <div class="cs-fb"></div><button class="cs-show ghost">Показати відповідь</button>`;
    const inp=el.querySelector('.cs-inp'),fb=el.querySelector('.cs-fb'),chk=el.querySelector('.cs-check'),show=el.querySelector('.cs-show');
    function test(){
      const norm=inp.value.trim().replace(/\s+/g,' ');
      if(!norm){fb.className='cs-fb';fb.textContent='';return;}
      const ok=c.a.some(rx=>new RegExp(rx).test(norm));
      fb.className='cs-fb '+(ok?'ok':'err');
      fb.textContent=ok?'Правильно.':'Не те. Порівняй з уроком або натисни «Показати відповідь».';
      if(ok){inp.disabled=true;chk.disabled=true;show.style.display='none';el.classList.add('solved');}
    }
    chk.onclick=test;
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')test();});
    show.onclick=()=>{fb.className='cs-fb';fb.innerHTML=`Відповідь: <code>${c.sol}</code>`;};
  });
}

/* === 12. ВПОРЯДКУВАННЯ КРОКІВ === */
function buildOrders(){
  document.querySelectorAll('.order').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const o=ORDERS[el.dataset.o];if(!o)return;
    let pool=o.steps.map((s,i)=>({s,i}));
    for(let k=0;k<20;k++){pool.sort(()=>Math.random()-.5);if(pool.some((p,idx)=>p.i!==idx))break;}
    let picked=[];
    el.innerHTML=`<div class="wtitle">Впорядкуй кроки</div><div class="or-title">${o.title}</div>
      <div class="or-seq"></div><div class="or-pool"></div>
      <div class="or-btns"><button class="or-check">Перевірити</button><button class="or-reset ghost">Скинути</button></div><div class="or-fb"></div>`;
    const seq=el.querySelector('.or-seq'),poolEl=el.querySelector('.or-pool'),fb=el.querySelector('.or-fb');
    function render(){
      seq.innerHTML=picked.length?picked.map((p,idx)=>`<div class="or-chip in" data-i="${p.i}"><span class="n">${idx+1}</span>${p.s}</div>`).join(''):`<div class="or-empty">натискай кроки внизу у правильному порядку</div>`;
      poolEl.innerHTML=pool.map(p=>`<button class="or-chip" data-i="${p.i}">${p.s}</button>`).join('');
      poolEl.querySelectorAll('.or-chip').forEach(b=>b.onclick=()=>{
        const i=+b.dataset.i;const idx=pool.findIndex(p=>p.i===i);
        picked.push(pool[idx]);pool.splice(idx,1);fb.className='or-fb';fb.textContent='';render();
      });
      seq.querySelectorAll('.or-chip').forEach(ch=>ch.onclick=()=>{
        const i=+ch.dataset.i;const idx=picked.findIndex(p=>p.i===i);
        pool.push(picked[idx]);picked.splice(idx,1);render();
      });
    }
    el.querySelector('.or-check').onclick=()=>{
      if(pool.length){fb.className='or-fb err';fb.textContent='Спершу розстав усі кроки.';return;}
      const ok=picked.every((p,idx)=>p.i===idx);
      fb.className='or-fb '+(ok?'ok':'err');
      fb.textContent=ok?'Правильний порядок.':'Порядок не той — клікни на кроки згори, щоб повернути їх, і спробуй ще.';
      if(ok)el.classList.add('solved');
    };
    el.querySelector('.or-reset').onclick=()=>{pool=pool.concat(picked);picked=[];fb.className='or-fb';fb.textContent='';render();};
    render();
  });
}

/* === 12a. ДРУКОВАНА ШПАРГАЛКА === */
function buildCheatsheet(){
  const list=document.getElementById('cheatList');if(!list||list.dataset.built)return;list.dataset.built='1';
  const cats=[...new Set(GIT_CMDS.map(x=>x.cat))];
  list.innerHTML=cats.map(cat=>{
    const rows=GIT_CMDS.filter(x=>x.cat===cat).map(x=>`<tr><td class="ch-c"><code>${escapeHTML(x.c)}</code></td><td class="ch-d">${escapeHTML(x.d)}${x.ex?`<div class="ch-ex">${escapeHTML(x.ex)}</div>`:''}</td></tr>`).join('');
    return `<div class="ch-cat">${escapeHTML(cat)}</div><table class="ch-tbl">${rows}</table>`;
  }).join('');
  const btn=document.getElementById('printBtn');
  if(btn)btn.onclick=()=>window.print();
}

/* === 12aa. САМОДІАГНОСТИКА РІВНЯ (головна) === */
const DIAG=[
  {topic:`Інструменти`,page:`modules/00-start.html`,label:`Модуль 00 · Старт та інструменти`,
   q:`Де найчастіше вводять git-команди на Windows у цьому курсі?`,
   opts:[`У Git Bash (терміналі)`,`У вікні Power BI Desktop`,`У формулах DAX`,`У налаштуваннях Windows`],correct:0},
  {topic:`Термінал`,page:`modules/01-terminal.html`,label:`Модуль 01 · Термінал і файли`,
   q:`Ти відкрив термінал у папці проєкту. Що зробить команда <code>cd ..</code>?`,
   opts:[`Перейде на одну папку вгору`,`Створить нову папку з назвою «..»`,`Покаже вміст поточної папки`,`Закриє термінал`],correct:0},
  {topic:`Три зони Git`,page:`modules/02-osnovy.html`,label:`Модуль 02 · Основи Git`,
   q:`Ти змінив <code>model.tmdl</code> і виконав <code>git add model.tmdl</code>. Де тепер ця зміна?`,
   opts:[`У staging — підготовлена до наступного коміту`,`Уже в історії комітів`,`Уже на сервері`,`Ніде — add лише перевіряє файл на помилки`],correct:0},
  {topic:`Щоденні команди`,page:`modules/03-komandy.html`,label:`Модуль 03 · Щоденні команди`,
   q:`Яка послідовність доставить твою зміну з робочої теки аж на сервер?`,
   opts:[`git add → git commit → git push`,`git push → git commit → git add`,`git commit → git add → git sync`,`git save → git upload → git publish`],correct:0},
  {topic:`Fetch і pull`,page:`modules/03-komandy.html`,label:`Модуль 03 · Щоденні команди`,
   q:`Чим <code>git fetch</code> відрізняється від <code>git pull</code>?`,
   opts:[`fetch лише оновлює знання про сервер; pull — ще й застосовує зміни до твоєї гілки`,`fetch швидший, але робить те саме`,`fetch працює лише з гілкою main`,`Нічим — це синоніми`],correct:0},
  {topic:`Скасування`,page:`modules/04-vypravlennia.html`,label:`Модуль 04 · Виправлення помилок`,
   q:`Поганий коміт УЖЕ запушено на спільну гілку. Як правильно прибрати його вплив?`,
   opts:[`git revert — новий коміт-скасування`,`git reset --hard і force push`,`Видалити репозиторій і склонувати заново`,`git stash`],correct:0},
  {topic:`Rebase`,page:`modules/05-rebase.html`,label:`Модуль 05 · Rebase та історія`,
   q:`Що робить <code>git rebase main</code>, виконаний у твоїй фіче-гілці?`,
   opts:[`Переграє твої коміти поверх свіжої main, створюючи нові коміти з новими SHA`,`Зливає main у фічу merge-комітом`,`Видаляє твої коміти безповоротно`,`Перейменовує гілку на main`],correct:0},
  {topic:`PBIP`,page:`modules/06-pbip.html`,label:`Модуль 06 · PBIP / PBIR / TMDL`,
   q:`Що з переліченого НЕ комітять у Git у PBIP-проєкті?`,
   opts:[`cache.abf — локальний кеш даних`,`definition/model.tmdl`,`Файли звіту report/…`,`Файл .pbip`],correct:0},
  {topic:`Fabric Git sync`,page:`modules/07-komanda.html`,label:`Модуль 07 · Робота в команді`,
   q:`Що робить «Update from Git» у робочій області Fabric?`,
   opts:[`Підтягує поточний стан гілки з Git у робочу область`,`Відправляє звіти з робочої області в Git`,`Оновлює дані звіту з джерела`,`Створює резервну копію робочої області`],correct:0},
  {topic:`Просунуте`,page:`modules/08-advanced.html`,label:`Модуль 08 · Просунуті техніки`,
   q:`Навіщо потрібна команда <code>git cherry-pick C8</code>?`,
   opts:[`Перенести один конкретний коміт C8 у поточну гілку`,`Видалити коміт C8 з історії`,`Позначити C8 тегом «перевірено»`,`Створити гілку з назвою C8`],correct:0}
];
function buildDiag(){
  const box=document.getElementById('diagBox');if(!box||box.dataset.built)return;box.dataset.built='1';
  const qs=DIAG.map(d=>{const s=shuffleQ({q:d.q,opts:d.opts,correct:d.correct});return {topic:d.topic,page:d.page,label:d.label,q:s.q,opts:s.opts,correct:s.correct};});
  let idx=0;const answers=[];
  function renderQ(){
    const d=qs[idx];
    box.innerHTML=`<div class="dg-head"><span class="dg-cnt">Питання ${idx+1} / ${qs.length}</span><span class="dg-topic">${d.topic}</span></div>
      <div class="dg-q">${d.q}</div>
      <div class="dg-opts">${d.opts.map((o,i)=>`<button class="dg-opt" data-i="${i}">${o}</button>`).join('')}</div>
      <div class="dg-note">Відповідай чесно — правильні відповіді тут не показуються, це не іспит, а навігатор.</div>`;
    box.querySelectorAll('.dg-opt').forEach(b=>b.onclick=()=>{
      answers.push(+b.dataset.i===d.correct);
      idx++;
      if(idx<qs.length)renderQ();else renderResult();
    });
  }
  function renderResult(){
    const firstWrong=answers.indexOf(false);
    const rec=firstWrong<0
      ?{page:`modules/pr1-osnovy.html`,label:`Практикум · Основи й коміти`,why:`Уся драбина теорії без прогалин — рушай одразу до задач і тренажера терміналу. Модулі завжди поруч як довідник.`}
      :{page:qs[firstWrong].page,label:qs[firstWrong].label,why:`Перша прогалина — тема «${qs[firstWrong].topic}». Стартуй із цього модуля: далі теми спираються одна на одну.`};
    const rows=qs.map((d,i)=>`<span class="dg-row ${answers[i]?'ok':'no'}">${answers[i]?'✓':'✗'} ${d.topic}</span>`).join('');
    box.innerHTML=`<div class="dg-res"><div class="dg-res-t">Рекомендація для тебе</div>
      <a class="dg-rec" href="${rec.page}">${rec.label} →</a>
      <div class="dg-why">${rec.why}</div>
      <div class="dg-break">${rows}</div>
      <button class="dg-again">Пройти ще раз</button></div>`;
    box.querySelector('.dg-again').onclick=()=>{idx=0;answers.length=0;renderQ();};
    lsSet('gfp:diag',rec.label);
  }
  renderQ();
}
window.__DIAG__={count:DIAG.length,pages:DIAG.map(d=>d.page)};

/* === 12ab. DIFF-ВІДЖЕТ: прочитай diff === */
const DIFFQ={
  dq_format_noise:{file:`definition/tables/Sales.tmdl`,
    diff:[`@@ -12,9 +12,9 @@`,`   measure 'Total Sales' = SUM(Sales[Amount])`,`-      formatString: #,0.00`,`+      formatString: #,0`,`-      displayFolder: Міри`,`+      displayFolder: Міри\\Продажі`,`-      lineageTag: 4f21-88ab`,`+      lineageTag: 9c03-12ef`],
    q:`Що з цього diff РЕАЛЬНО побачить користувач звіту?`,
    opts:[`Числа міри показуватимуться без копійок — формат змінився з #,0.00 на #,0`,`Зміниться сама формула розрахунку Total Sales`,`Зламається звʼязок таблиці Sales з іншими`,`Нічого: усі три зміни — технічний шум`],
    correct:0,
    why:`formatString — видима зміна (зникнуть копійки). displayFolder — лише організація полів для розробника, lineageTag — технічний шум. А формулу SUM(...) diff не чіпав: рядок без +/− ліворуч — це незмінений контекст.`},
  dq_measure_rename:{file:`definition/tables/Sales.tmdl`,
    diff:[`@@ -20,7 +20,7 @@`,`-  measure 'Маржа' =`,`+  measure 'Маржа %' =`,`       DIVIDE([Прибуток], [Дохід])`,`       formatString: 0.0%`],
    q:`Міру перейменовано з «Маржа» на «Маржа %» прямо у TMDL. Що станеться з візуалами звіту, які використовували стару назву?`,
    opts:[`Вони зламаються: у файлах звіту поля привʼязані за НАЗВОЮ міри, а старої назви більше не існує`,`Нічого: Power BI автоматично оновить назву в усіх візуалах`,`Візуали покажуть нулі замість значень`,`Зламаються лише візуали на прихованих сторінках`],
    correct:0,
    why:`PBIR-файли звіту посилаються на міру за назвою. Перейменування лише в моделі = биті посилання у visual.json. Тому перейменовуй через Power BI Desktop (він каскадно оновлює звіт) і завжди переглядай ПОВНИЙ diff перед комітом.`},
  dq_gitignore_late:{file:`.gitignore`,
    diff:[`@@ -1,2 +1,4 @@`,`   *.pbix`,`   .DS_Store`,`+  cache.abf`,`+  localSettings.json`],
    q:`У .gitignore додали cache.abf — але цей файл УЖЕ відстежується Git (його закомітили раніше). Що станеться після цього коміту?`,
    opts:[`Git продовжить відстежувати cache.abf: ignore діє лише на нові (untracked) файли — потрібен ще git rm --cached cache.abf`,`Git одразу перестане бачити зміни cache.abf`,`Git видалить cache.abf з диска`,`Git видалить cache.abf з усієї історії комітів`],
    correct:0,
    why:`.gitignore — фільтр для файлів, яких Git ЩЕ не відстежує. Уже закомічений файл лишається під наглядом, доки не виконати git rm --cached — тоді він піде з відстеження, але залишиться на диску.`},
  dq_visual_type:{file:`report/pages/sales/visuals/chart1/visual.json`,
    diff:[`@@ -4,8 +4,8 @@`,`   "visual": {`,`-    "visualType": "barChart",`,`+    "visualType": "columnChart",`,`     "position": {`,`-      "width": 480,`,`+      "width": 640,`],
    q:`Що зміниться на сторінці звіту після цього коміту?`,
    opts:[`Візуал стане стовпчиковим (вертикальним) замість смугового і ширшим — 640 пікселів замість 480`,`Зміняться дані, які показує візуал`,`Візуал переїде на іншу сторінку звіту`,`Нічого: visual.json — технічний файл, який не впливає на вигляд`],
    correct:0,
    why:`visualType задає тип візуала (barChart — горизонтальні смуги, columnChart — вертикальні стовпці), width — ширину. Поля й дані цей diff не чіпав. PBIR-файли — це і Є звіт: їхній diff читається як «що зміниться на сторінці».`}
};
function buildDiffq(){
  document.querySelectorAll('.diffq').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const d=DIFFQ[el.dataset.dq];if(!d)return;
    const lines=d.diff.map(l=>{
      const cls=l.indexOf('+')===0?'dl-add':l.indexOf('-')===0?'dl-del':l.indexOf('@@')===0?'dl-hunk':'dl-ctx';
      return `<div class="dl ${cls}">${escapeHTML(l)}</div>`;
    }).join('');
    const s=shuffleQ({q:d.q,opts:d.opts,correct:d.correct});
    el.innerHTML=`<div class="dq-file">${escapeHTML(d.file)}</div><div class="dq-diff">${lines}</div>
      <div class="dq-q">${s.q}</div>${s.opts.map((o,i)=>`<button class="dq-opt" data-i="${i}">${o}</button>`).join('')}
      <div class="dq-why">${d.why}</div>`;
    let done=false;
    el.querySelectorAll('.dq-opt').forEach(b=>b.onclick=()=>{
      if(done)return;done=true;
      el.querySelectorAll('.dq-opt').forEach(x=>{x.disabled=true;if(+x.dataset.i===s.correct)x.classList.add('correct');});
      if(+b.dataset.i!==s.correct)b.classList.add('wrong');
      el.querySelector('.dq-why').classList.add('show');
      el.classList.add('solved');
    });
  });
}
function colorizeDiffPre(root){
  root.querySelectorAll('pre').forEach(pre=>{
    if(pre.dataset.dc)return;
    const ls=pre.textContent.split('\n');
    const hasA=ls.some(l=>l.indexOf('+')===0),hasD=ls.some(l=>l.indexOf('-')===0);
    if(!hasA||!hasD)return;
    pre.dataset.dc='1';
    pre.innerHTML=ls.map(l=>{
      const cls=l.indexOf('+')===0?'dl-add':l.indexOf('-')===0?'dl-del':l.indexOf('@@')===0?'dl-hunk':'';
      return cls?`<span class="dl ${cls}">${escapeHTML(l)}</span>`:escapeHTML(l);
    }).join('\n');
  });
}

/* === 12b. TERMLAB: ІНТЕРАКТИВНИЙ ТРЕНАЖЕР ТЕРМІНАЛУ === */
const TL_LANE_COLORS=['feature','feat2','hotfix'];
function tlTokens(s){
  const out=[];let cur='',q=null;
  for(const ch of s){
    if(q){if(ch===q)q=null;else cur+=ch;}
    else if(ch==='"'||ch==="'")q=ch;
    else if(/\s/.test(ch)){if(cur){out.push(cur);cur='';}}
    else cur+=ch;
  }
  if(cur)out.push(cur);
  return {tokens:out,open:!!q};
}
function tlNewState(init){
  init=init||{};
  const st={initialized:init.initialized!==false,commits:{},order:[],branches:{},head:null,
    files:{},stash:[],remote:null,tracking:{},conflict:null,conflictSnap:null,conflictOn:init.conflictOn||null,hadConflict:false,mergeAborted:false,rebasing:null,
    cseq:0,mseq:0,brMeta:{main:{lane:0,color:'main'}}};
  Object.keys(init.files||{}).forEach(f=>st.files[f]=init.files[f]);
  if(!st.initialized)return st;
  const brNames=init.branches?Object.keys(init.branches):['main'];
  let li=0;
  brNames.forEach(b=>{if(!st.brMeta[b]){li++;st.brMeta[b]={lane:li,color:TL_LANE_COLORS[(li-1)%TL_LANE_COLORS.length]};}});
  const defs=init.commits||[{id:'C1',msg:`початкова версія проєкту`}];
  defs.forEach(c=>{
    const meta=c.br&&st.brMeta[c.br]?st.brMeta[c.br]:{lane:0,color:'main'};
    st.commits[c.id]={id:c.id,parents:c.p||[],msg:c.msg||c.id,color:c.col||meta.color,lane:c.lane!=null?c.lane:meta.lane,known:c.known!==false,files:c.files||[],br:c.br||null};
    st.order.push(c.id);
    const m=c.id.match(/^C(\d+)/);if(m)st.cseq=Math.max(st.cseq,+m[1]);
  });
  if(init.branches)Object.keys(init.branches).forEach(b=>st.branches[b]=init.branches[b]);
  else st.branches.main=defs[defs.length-1].id;
  const h=init.head||'main';
  st.head=typeof h==='string'?{type:'branch',ref:h}:{type:'commit',id:h.detached};
  if(init.remote)st.remote={branches:Object.assign({},init.remote)};
  if(init.tracking)st.tracking=Object.assign({},init.tracking);
  else if(st.remote)Object.keys(st.remote.branches).forEach(b=>{const t=st.remote.branches[b];if(st.commits[t]&&st.commits[t].known)st.tracking[b]=t;});
  return st;
}
function tlTip(st,b){return st.branches[b]||null;}
function tlCurBranch(st){return st.head&&st.head.type==='branch'?st.head.ref:null;}
function tlHeadCommit(st){if(!st.head)return null;return st.head.type==='branch'?tlTip(st,st.head.ref):st.head.id;}
function tlReach(st,id,set){set=set||new Set();if(!id||set.has(id)||!st.commits[id])return set;set.add(id);st.commits[id].parents.forEach(p=>tlReach(st,p,set));return set;}
function tlIsAncestor(st,a,b){return a===b||tlReach(st,b).has(a);}
function tlMergeBase(st,a,b){
  const ra=tlReach(st,a),rb=tlReach(st,b);
  let best=null,bi=-1;
  st.order.forEach((id,i)=>{if(ra.has(id)&&rb.has(id)&&i>bi){bi=i;best=id;}});
  return best;
}
function tlTouchedSince(st,tip,base){
  const rb=tlReach(st,base),rt=tlReach(st,tip),out=new Set();
  st.order.forEach(id=>{if(rt.has(id)&&!rb.has(id))st.commits[id].files.forEach(f=>out.add(f));});
  return out;
}
function tlRebaseStep(st){
  const R=st.rebasing,out=[];
  while(R.queue.length){
    const c=R.queue[0];
    const confl=(c.files||[]).filter(f=>R.remoteTouched.indexOf(f)>=0);
    if(confl.length&&!c._resolved){
      confl.forEach(f=>{st.files[f]='conflict';});
      st.conflict={files:confl,from:`rebase`,edited:{},resolved:false,rebase:true};
      st.hadConflict=true;
      confl.forEach(f=>{out.push(`Auto-merging ${f}`);out.push(`CONFLICT (content): Merge conflict in ${f}`);});
      out.push(`error: could not apply ${c.id} (${c.msg})`);
      out.push(`підказка: edit → git add для кожного файлу, потім git rebase --continue (або git rebase --abort)`);
      return out;
    }
    R.queue.shift();
    const nid=c.id+`'`;
    st.commits[nid]={id:nid,parents:[R.base],msg:c.msg,color:'rebased',lane:c.lane,known:true,files:c.files,br:c.br};
    st.order.push(nid);R.created.push(nid);R.base=nid;
  }
  st.branches[R.branch]=R.base;
  const made=R.created.join(', ');
  st.rebasing=null;
  out.push(`Successfully rebased and updated refs/heads/${tlCurBranch(st)}.`);
  if(made)out.push(`(коміти переграно поверх серверних: ${made})`);
  return out;
}
function tlDirtyFiles(st){return Object.keys(st.files).filter(f=>['modified','staged','stagedNew','conflict'].indexOf(st.files[f])>=0);}
function tlStagedFiles(st){return Object.keys(st.files).filter(f=>st.files[f]==='staged'||st.files[f]==='stagedNew');}
function tlNewCommit(st,id,msg,parents,color,lane,files){
  st.commits[id]={id,parents,msg,color,lane,known:true,files:files||[],br:tlCurBranch(st)};
  st.order.push(id);
  const b=tlCurBranch(st);
  if(b)st.branches[b]=id;else st.head={type:'commit',id};
  return id;
}
function tlPrompt(st){
  if(!st.initialized)return `~/PDP$`;
  const b=tlCurBranch(st);
  return b?`~/PDP (${b})$`:`~/PDP (HEAD@${st.head?st.head.id:'?'})$`;
}
function tlRefsAt(st,id){
  const refs=[];
  Object.keys(st.branches).forEach(b=>{if(st.branches[b]===id)refs.push(b);});
  const hb=tlCurBranch(st);
  if(hb&&st.branches[hb]===id)refs.splice(refs.indexOf(hb)+1,0,'HEAD');
  if(st.head&&st.head.type==='commit'&&st.head.id===id)refs.unshift('HEAD');
  Object.keys(st.tracking).forEach(b=>{if(st.tracking[b]===id)refs.push('origin/'+b);});
  return refs;
}
function tlGraph(st){
  const reach=new Set();
  Object.keys(st.branches).forEach(b=>{if(st.branches[b])tlReach(st,st.branches[b],reach);});
  Object.keys(st.tracking).forEach(b=>{if(st.tracking[b])tlReach(st,st.tracking[b],reach);});
  const hc=tlHeadCommit(st);if(hc)tlReach(st,hc,reach);
  const nodes=[];
  for(let i=st.order.length-1;i>=0;i--){
    const c=st.commits[st.order[i]];
    if(!c.known)continue;
    nodes.push(N(c.id,c.lane,c.color,c.parents.filter(p=>st.commits[p]&&st.commits[p].known),tlRefsAt(st,c.id),!reach.has(c.id)));
  }
  return {nodes};
}
const TL_ST_LABEL={untracked:`новий`,modified:`змінено`,staged:`у staging`,stagedNew:`у staging`,clean:`закомічено`,conflict:`конфлікт`};
function tlFilesHtml(st){
  const fs=Object.keys(st.files);
  const chips=fs.length?fs.map(f=>{const s=st.files[f];return `<span class="tl-file st-${s==='stagedNew'?'staged':s}"><b>${escapeHTML(f)}</b>${TL_ST_LABEL[s]||s}</span>`;}).join(''):`<span class="tl-file st-none">файлів немає</span>`;
  let extra='';
  if(st.stash.length)extra+=`<span class="tl-badge">📦 stash: ${st.stash.length}</span>`;
  if(st.remote)Object.keys(st.remote.branches).forEach(b=>{extra+=`<span class="tl-badge">☁ сервер: ${b} → ${st.remote.branches[b]}</span>`;});
  return `<div class="tl-files-row">${chips}</div>`+(extra?`<div class="tl-badges">${extra}</div>`:'');
}
const TL_KNOWN_OTHER=['cherry-pick','blame','diff','tag','remote','clone','config','show','rm','mv','reflog','commit-tree'];
function tlHelp(){
  return [
    `Команди тренажера:`,
    `  git init | status | add <файл>|. | commit -m "..." | log [--oneline]`,
    `  git branch [<назва>] | switch [-c] <гілка> | checkout [-b] <гілка|коміт>`,
    `  git merge <гілка> [--abort] | fetch | pull [--rebase] | rebase --continue|--abort | push [-u origin <гілка>]`,
    `  git reset --soft|--mixed|--hard HEAD~1 | revert HEAD | restore [--staged] <файл>`,
    `  git stash [pop]`,
    `Не git: touch <файл> (створити), edit <файл> (змінити), ls, clear, help`
  ];
}
function tlStatusOut(st){
  const out=[];
  const b=tlCurBranch(st);
  if(b)out.push(`On branch ${b}`);
  else out.push(`HEAD detached at ${st.head.id}`);
  if(b&&st.remote&&st.tracking[b]){
    const L=tlTip(st,b),T=st.tracking[b];
    if(L&&T){
      const rl=tlReach(st,L),rt=tlReach(st,T);
      const ahead=[...rl].filter(x=>!rt.has(x)).length,behind=[...rt].filter(x=>!rl.has(x)).length;
      if(ahead&&behind)out.push(`Your branch and 'origin/${b}' have diverged, ${ahead} and ${behind} commits each.`);
      else if(ahead)out.push(`Your branch is ahead of 'origin/${b}' by ${ahead} commit${ahead>1?'s':''}.`);
      else if(behind)out.push(`Your branch is behind 'origin/${b}' by ${behind} commit${behind>1?'s':''}.`);
      else out.push(`Your branch is up to date with 'origin/${b}'.`);
    }
  }
  if(st.rebasing)out.push(`(rebase у процесі — заверши git rebase --continue або скасуй git rebase --abort)`);
  const conf=Object.keys(st.files).filter(f=>st.files[f]==='conflict');
  const staged=Object.keys(st.files).filter(f=>st.files[f]==='staged');
  const stagedNew=Object.keys(st.files).filter(f=>st.files[f]==='stagedNew');
  const mod=Object.keys(st.files).filter(f=>st.files[f]==='modified');
  const untr=Object.keys(st.files).filter(f=>st.files[f]==='untracked');
  if(conf.length){
    out.push(`You have unmerged paths.`);
    out.push(`Unmerged paths:`);
    conf.forEach(f=>out.push(`        both modified:   ${f}`));
  }
  if(staged.length||stagedNew.length){
    out.push(`Changes to be committed:`);
    stagedNew.forEach(f=>out.push(`        new file:   ${f}`));
    staged.forEach(f=>out.push(`        modified:   ${f}`));
  }
  if(mod.length){
    out.push(`Changes not staged for commit:`);
    mod.forEach(f=>out.push(`        modified:   ${f}`));
  }
  if(untr.length){
    out.push(`Untracked files:`);
    untr.forEach(f=>out.push(`        ${f}`));
  }
  if(!conf.length&&!staged.length&&!stagedNew.length&&!mod.length&&!untr.length)out.push(`nothing to commit, working tree clean`);
  return out;
}
function tlDoCommit(st,msg){
  if(st.conflict&&st.conflict.rebase)return [`підказка: під час rebase крок завершують командою git rebase --continue, а не commit`];
  if(st.conflict&&!st.conflict.resolved)return [`error: Committing is not possible because you have unmerged files.`];
  const b=tlCurBranch(st);
  if(st.conflict&&st.conflict.resolved){
    const from=st.conflict.from;
    const id='M'+(++st.mseq);
    const p1=tlTip(st,b),p2=tlTip(st,from);
    const fls=tlStagedFiles(st);
    st.commits[id]={id,parents:[p1,p2],msg:msg||`Merge branch '${from}'`,color:'merge',lane:st.brMeta[b]?st.brMeta[b].lane:0,known:true,files:fls,br:b};
    st.order.push(id);st.branches[b]=id;
    fls.forEach(f=>st.files[f]='clean');
    st.conflict=null;st.conflictSnap=null;
    return [`[${b} ${id}] ${st.commits[id].msg}`];
  }
  const fls=tlStagedFiles(st);
  if(!fls.length){
    const mod=Object.keys(st.files).filter(f=>st.files[f]==='modified');
    return mod.length?[`no changes added to commit (use "git add <файл>")`]:[`nothing to commit, working tree clean`];
  }
  if(!msg)return [`підказка: додай повідомлення: git commit -m "опис змін"`];
  const tip=tlHeadCommit(st);
  let color='main',lane=0;
  if(b&&st.brMeta[b]){color=st.brMeta[b].color;lane=st.brMeta[b].lane;}
  else if(tip&&st.commits[tip]){color=st.commits[tip].color;lane=st.commits[tip].lane;}
  const id='C'+(++st.cseq);
  tlNewCommit(st,id,msg,tip?[tip]:[],color,lane,fls);
  fls.forEach(f=>st.files[f]='clean');
  return [`[${b||'detached HEAD'} ${id}] ${msg}`,` ${fls.length} file${fls.length>1?'s':''} changed`];
}
function tlRun(st,line){
  const raw=(line||'').trim();
  if(!raw)return {out:[]};
  const tk=tlTokens(raw);
  if(tk.open)return {out:[`помилка: незакриті лапки в команді`]};
  const T=tk.tokens,c0=T[0];
  if(c0==='clear')return {out:[],clear:true};
  if(c0==='help')return {out:tlHelp()};
  if(c0==='ls'){const fs=Object.keys(st.files);return {out:[fs.length?fs.join('  '):`(порожньо)`]};}
  if(c0==='touch'){
    if(!T[1])return {out:[`usage: touch <файл>`]};
    if(st.files[T[1]]===undefined)st.files[T[1]]='untracked';
    return {out:[]};
  }
  if(c0==='edit'){
    const f=T[1];
    if(!f)return {out:[`usage: edit <файл>`]};
    if(st.files[f]===undefined)return {out:[`bash: edit: файл '${f}' не знайдено (створи його: touch ${f})`]};
    const s=st.files[f];
    if(s==='conflict'){
      if(st.conflict)st.conflict.edited[f]=true;
      return {out:[`(конфліктні маркери у ${f} прибрано — тепер git add ${f})`]};
    }
    if(s==='clean'){st.files[f]='modified';return {out:[`(файл ${f} змінено)`]};}
    if(s==='staged'||s==='stagedNew'){st.files[f]='modified';return {out:[`(файл ${f} змінено після git add — зміни знову поза staging)`]};}
    return {out:[`(файл ${f} змінено)`]};
  }
  if(c0!=='git')return {out:[`bash: ${c0}: command not found (доступні: git, touch, edit, ls, help, clear)`]};
  const sub=T[1];
  if(!sub)return {out:tlHelp()};
  if(sub!=='init'&&!st.initialized)return {out:[`fatal: not a git repository (or any of the parent directories): .git`,`підказка: спершу git init`]};
  switch(sub){
    case 'init':{
      if(st.initialized)return {out:[`Reinitialized existing Git repository in ~/PDP/.git/`]};
      st.initialized=true;st.branches={main:null};st.head={type:'branch',ref:'main'};
      return {out:[`Initialized empty Git repository in ~/PDP/.git/`]};
    }
    case 'status':return {out:tlStatusOut(st)};
    case 'add':{
      const arg=T[2];
      if(!arg)return {out:[`Nothing specified, nothing added.`,`підказка: git add <файл> або git add .`]};
      const all=arg==='.'||arg==='-A'||arg==='--all';
      const targets=all?Object.keys(st.files):[arg];
      if(!all&&st.files[arg]===undefined)return {out:[`fatal: pathspec '${arg}' did not match any files`]};
      const out=[];
      for(const f of targets){
        const s=st.files[f];
        if(s==='conflict'){
          if(!st.conflict||!st.conflict.edited[f]){out.push(`підказка: спершу відредагуй файл (edit ${f}), щоб прибрати конфліктні маркери`);continue;}
          st.files[f]='staged';
          st.conflict.resolved=st.conflict.files.every(cf=>st.files[cf]==='staged');
        }
        else if(s==='untracked')st.files[f]='stagedNew';
        else if(s==='modified')st.files[f]='staged';
      }
      return {out};
    }
    case 'commit':{
      const mi=T.indexOf('-m');
      let msg=null;
      if(mi>=0){msg=T[mi+1];if(!msg)return {out:[`error: після -m має бути повідомлення в лапках`]};}
      return {out:tlDoCommit(st,msg)};
    }
    case 'log':{
      const hc=tlHeadCommit(st);
      if(!hc)return {out:[`fatal: your current branch '${tlCurBranch(st)||'main'}' does not have any commits yet`]};
      const reach=tlReach(st,hc);
      const ids=st.order.filter(id=>reach.has(id)).reverse();
      const oneline=T.indexOf('--oneline')>=0;
      const out=[];
      ids.forEach(id=>{
        const c=st.commits[id];
        const refs=tlRefsAt(st,id);
        const hb=tlCurBranch(st);
        let decStr='';
        if(refs.length){
          const parts=refs.filter(r=>r!=='HEAD');
          if(refs.indexOf('HEAD')>=0)decStr=hb?`HEAD -> ${hb}${parts.filter(p=>p!==hb).length?', '+parts.filter(p=>p!==hb).join(', '):''}`:`HEAD${parts.length?', '+parts.join(', '):''}`;
          else decStr=parts.join(', ');
        }
        if(oneline)out.push(`${id} ${decStr?'('+decStr+') ':''}${c.msg}`);
        else{out.push(`commit ${id}${decStr?' ('+decStr+')':''}`);out.push(`Author: Ти <ty@company.ua>`);out.push(``);out.push(`    ${c.msg}`);out.push(``);}
      });
      return {out};
    }
    case 'branch':{
      const name=T[2];
      if(!name){
        const out=[];const cur=tlCurBranch(st);
        if(!cur)out.push(`* (HEAD detached at ${st.head.id})`);
        Object.keys(st.branches).forEach(b=>out.push((b===cur?'* ':'  ')+b));
        return {out};
      }
      if(name.charAt(0)==='-')return {out:[`підказка: у тренажері підтримується лише git branch [<назва>]`]};
      if(st.branches[name]!==undefined)return {out:[`fatal: a branch named '${name}' already exists`]};
      const tip=tlHeadCommit(st);
      if(!tip)return {out:[`fatal: not a valid object name: 'main'`]};
      st.branches[name]=tip;
      if(!st.brMeta[name]){const li=Math.max(...Object.keys(st.brMeta).map(b=>st.brMeta[b].lane))+1;st.brMeta[name]={lane:li,color:TL_LANE_COLORS[(li-1)%TL_LANE_COLORS.length]};}
      return {out:[]};
    }
    case 'switch':case 'checkout':{
      let create=false,name=T[2];
      if(name==='-c'||name==='-b'){create=true;name=T[3];}
      if(!name)return {out:[`usage: git ${sub} ${sub==='switch'?'[-c]':'[-b]'} <гілка>`]};
      const dirty=Object.keys(st.files).some(f=>['modified','staged','stagedNew','conflict'].indexOf(st.files[f])>=0);
      if(create){
        if(st.branches[name]!==undefined)return {out:[`fatal: a branch named '${name}' already exists`]};
        const tip=tlHeadCommit(st);
        if(!tip)return {out:[`fatal: not a valid object name: 'main'`]};
        st.branches[name]=tip;
        if(!st.brMeta[name]){const li=Math.max(...Object.keys(st.brMeta).map(b=>st.brMeta[b].lane))+1;st.brMeta[name]={lane:li,color:TL_LANE_COLORS[(li-1)%TL_LANE_COLORS.length]};}
        st.head={type:'branch',ref:name};
        return {out:[`Switched to a new branch '${name}'`]};
      }
      if(st.branches[name]!==undefined){
        if(tlCurBranch(st)===name)return {out:[`Already on '${name}'`]};
        if(dirty&&st.branches[name]!==tlHeadCommit(st))return {out:[
          `error: Your local changes to the following files would be overwritten by checkout:`,
          ...tlDirtyFiles(st).map(f=>`        ${f}`),
          `Please commit your changes or stash them before you switch branches.`,
          `підказка: git stash — тимчасово сховати зміни`]};
        st.head={type:'branch',ref:name};
        return {out:[`Switched to branch '${name}'`]};
      }
      if(sub==='checkout'&&st.commits[name]&&st.commits[name].known){
        if(dirty&&name!==tlHeadCommit(st))return {out:[
          `error: Your local changes would be overwritten by checkout.`,
          `Please commit your changes or stash them before you switch.`]};
        st.head={type:'commit',id:name};
        return {out:[`Note: switching to '${name}'.`,``,`You are in 'detached HEAD' state. Експериментуй вільно;`,`щоб зберегти коміти звідси — створи гілку: git branch <назва>`]};
      }
      return {out:sub==='switch'
        ?[`fatal: invalid reference: ${name}`,`підказка: створити нову гілку — git switch -c ${name}`]
        :[`error: pathspec '${name}' did not match any file(s) known to git`]};
    }
    case 'merge':{
      const name=T[2];
      if(!name)return {out:[`usage: git merge <гілка> | git merge --abort`]};
      if(name==='--abort'){
        if(!st.conflict)return {out:[`fatal: There is no merge to abort (MERGE_HEAD missing).`]};
        Object.keys(st.conflictSnap||{}).forEach(f=>{st.files[f]=st.conflictSnap[f];});
        st.conflict=null;st.conflictSnap=null;st.mergeAborted=true;
        return {out:[`(злиття скасовано — файли повернуто до стану перед merge)`]};
      }
      const b=tlCurBranch(st);
      if(!b)return {out:[`fatal: у detached HEAD мержити не можна — спершу git switch <гілка>`]};
      if(st.branches[name]===undefined)return {out:[`merge: ${name} - not something we can merge`]};
      if(st.conflict)return {out:[`error: Merging is not possible because you have unmerged files.`,`підказка: заверши розвʼязання (add + commit) або git merge --abort`]};
      const tipT=tlTip(st,b),tipF=tlTip(st,name);
      if(!tipF)return {out:[`Already up to date.`]};
      if(tipT===tipF||tlIsAncestor(st,tipF,tipT))return {out:[`Already up to date.`]};
      if(tlIsAncestor(st,tipT,tipF)){
        st.branches[b]=tipF;
        return {out:[`Updating ${tipT}..${tipF}`,`Fast-forward`]};
      }
      let confFiles;
      if(st.conflictOn&&st.conflictOn.branch===name)confFiles=[st.conflictOn.file];
      else{
        const base=tlMergeBase(st,tipT,tipF);
        const tT=tlTouchedSince(st,tipT,base),tF=tlTouchedSince(st,tipF,base);
        confFiles=[...tT].filter(f=>tF.has(f));
      }
      if(confFiles.length){
        st.conflictSnap={};
        confFiles.forEach(f=>{st.conflictSnap[f]=st.files[f]||'clean';st.files[f]='conflict';});
        st.conflict={files:confFiles,from:name,edited:{},resolved:false};
        st.hadConflict=true;
        const out=[];
        confFiles.forEach(f=>{out.push(`Auto-merging ${f}`);out.push(`CONFLICT (content): Merge conflict in ${f}`);});
        out.push(`Automatic merge failed; fix conflicts and then commit the result.`);
        out.push(`підказка: для кожного файлу edit → git add, потім git commit (або git merge --abort)`);
        return {out};
      }
      const id='M'+(++st.mseq);
      st.commits[id]={id,parents:[tipT,tipF],msg:`Merge branch '${name}'`,color:'merge',lane:st.brMeta[b]?st.brMeta[b].lane:0,known:true,files:[],br:b};
      st.order.push(id);st.branches[b]=id;
      return {out:[`Merge made by the 'ort' strategy.`]};
    }
    case 'rebase':{
      const sub2=T[2];
      if(sub2==='--continue'){
        if(!st.rebasing)return {out:[`fatal: no rebase in progress`]};
        if(st.conflict&&!st.conflict.resolved)return {out:[`error: спершу розвʼяжи конфліктні файли (edit → git add), тоді git rebase --continue`]};
        if(st.conflict&&st.conflict.resolved){
          st.rebasing.queue[0]._resolved=true;
          st.conflict.files.forEach(f=>{if(st.files[f]==='staged')st.files[f]='clean';});
          st.conflict=null;
        }
        return {out:tlRebaseStep(st)};
      }
      if(sub2==='--abort'){
        if(!st.rebasing)return {out:[`fatal: no rebase in progress`]};
        const R=st.rebasing;
        R.created.forEach(id=>{st.order.splice(st.order.indexOf(id),1);delete st.commits[id];});
        R.orig.forEach(c=>{delete c._resolved;st.commits[c.id]=c;st.order.push(c.id);});
        st.branches[R.branch]=R.origTip;
        st.files=Object.assign({},R.filesSnap);
        st.conflict=null;st.rebasing=null;st.mergeAborted=true;
        return {out:[`(rebase скасовано — стан повернуто до початкового)`]};
      }
      return {out:[`підказка: у тренажері rebase запускається через git pull --rebase; тут підтримуються git rebase --continue і git rebase --abort`]};
    }
    case 'fetch':{
      if(!st.remote)return {out:[`fatal: 'origin' does not appear to be a git repository`]};
      const out=[];
      Object.keys(st.remote.branches).forEach(b=>{
        const rt=st.remote.branches[b];
        tlReach(st,rt).forEach(id=>{if(st.commits[id])st.commits[id].known=true;});
        if(st.tracking[b]!==rt){
          if(!out.length)out.push(`From origin`);
          out.push(`   ${st.tracking[b]||'···'}..${rt}  ${b} -> origin/${b}`);
          st.tracking[b]=rt;
        }
      });
      if(!out.length)out.push(`(нових комітів на сервері немає)`);
      return {out};
    }
    case 'pull':{
      if(!st.remote)return {out:[`fatal: 'origin' does not appear to be a git repository`]};
      const b=tlCurBranch(st);
      if(!b)return {out:[`fatal: у detached HEAD робити pull не можна`]};
      const rt=st.remote.branches[b];
      if(rt===undefined)return {out:[`fatal: на origin немає гілки '${b}'`]};
      tlReach(st,rt).forEach(id=>{if(st.commits[id])st.commits[id].known=true;});
      st.tracking[b]=rt;
      const L=tlTip(st,b);
      if(L===rt||tlIsAncestor(st,rt,L))return {out:[`Already up to date.`]};
      if(tlIsAncestor(st,L,rt)){
        st.branches[b]=rt;
        return {out:[`Updating ${L}..${rt}`,`Fast-forward`]};
      }
      if(T.indexOf('--rebase')>=0){
        const rl=tlReach(st,L),rr=tlReach(st,rt);
        const localOnly=st.order.filter(id=>rl.has(id)&&!rr.has(id));
        const base=tlMergeBase(st,L,rt);
        const remoteTouched=[...tlTouchedSince(st,rt,base)];
        const orig=localOnly.map(id=>st.commits[id]);
        localOnly.forEach(id=>{st.order.splice(st.order.indexOf(id),1);delete st.commits[id];});
        st.rebasing={branch:b,base:rt,queue:orig.slice(),orig,origTip:L,created:[],filesSnap:Object.assign({},st.files),remoteTouched};
        return {out:tlRebaseStep(st)};
      }
      return {out:[`fatal: Need to specify how to reconcile divergent branches.`,`підказка: git pull --rebase — переграти твої коміти поверх серверних`]};
    }
    case 'push':{
      if(!st.remote)return {out:[`fatal: у цій задачі віддаленого репозиторію немає`]};
      const b=tlCurBranch(st);
      if(!b)return {out:[`fatal: у detached HEAD робити push не можна`]};
      const L=tlTip(st,b);
      if(!L)return {out:[`error: unable to push: гілка ${b} порожня`]};
      const R=st.remote.branches[b];
      if(R===undefined){
        const hasU=T.indexOf('-u')>=0||T.indexOf('--set-upstream')>=0;
        if(hasU){
          st.remote.branches[b]=L;st.tracking[b]=L;
          return {out:[`To origin`,` * [new branch]      ${b} -> ${b}`,`branch '${b}' set up to track 'origin/${b}'.`]};
        }
        return {out:[`fatal: The current branch ${b} has no upstream branch.`,`To push the current branch and set the remote as upstream, use`,``,`    git push -u origin ${b}`]};
      }
      if(R===L)return {out:[`Everything up-to-date`]};
      if(tlIsAncestor(st,R,L)){
        st.remote.branches[b]=L;st.tracking[b]=L;
        return {out:[`To origin`,`   ${R}..${L}  ${b} -> ${b}`]};
      }
      return {out:[`To origin`,` ! [rejected]        ${b} -> ${b} (non-fast-forward)`,`error: failed to push some refs to 'origin'`,`hint: Updates were rejected because the remote contains work that you do not have locally.`,`підказка: git pull --rebase, потім git push`]};
    }
    case 'reset':{
      const b=tlCurBranch(st);
      if(!b)return {out:[`fatal: у detached HEAD reset у тренажері недоступний`]};
      let mode='--mixed',target=null;
      for(let i=2;i<T.length;i++){
        if(T[i]==='--soft'||T[i]==='--mixed'||T[i]==='--hard')mode=T[i];
        else target=T[i];
      }
      if(!target)return {out:[`usage: git reset --soft|--mixed|--hard HEAD~1`]};
      let newTip=null;
      const m=target.match(/^HEAD~(\d+)$/);
      if(m){
        let cur=tlTip(st,b);
        for(let k=0;k<+m[1];k++){
          if(!cur||!st.commits[cur]||!st.commits[cur].parents.length)return {out:[`fatal: ambiguous argument '${target}': історія коротша`]};
          cur=st.commits[cur].parents[0];
        }
        newTip=cur;
      }else if(st.commits[target]&&st.commits[target].known)newTip=target;
      else return {out:[`fatal: ambiguous argument '${target}': unknown revision`]};
      const oldTip=tlTip(st,b);
      const ro=tlReach(st,oldTip),rn=tlReach(st,newTip);
      const undone=st.order.filter(id=>ro.has(id)&&!rn.has(id));
      st.branches[b]=newTip;
      const out=[];
      const touched=[];
      undone.forEach(id=>st.commits[id].files.forEach(f=>{if(touched.indexOf(f)<0)touched.push(f);}));
      if(mode==='--soft'){
        touched.forEach(f=>st.files[f]='staged');
        out.push(`(HEAD тепер на ${newTip}; зміни з відкочених комітів — у staging)`);
      }else if(mode==='--mixed'){
        touched.forEach(f=>st.files[f]='modified');
        if(touched.length){out.push(`Unstaged changes after reset:`);touched.forEach(f=>out.push(`M\t${f}`));}
        else out.push(`(HEAD тепер на ${newTip})`);
      }else{
        touched.forEach(f=>st.files[f]='clean');
        Object.keys(st.files).forEach(f=>{if(st.files[f]==='modified'||st.files[f]==='staged')st.files[f]='clean';});
        out.push(`HEAD is now at ${newTip} ${st.commits[newTip]?st.commits[newTip].msg:''}`);
      }
      if(undone.length)out.push(`(коміти ${undone.join(', ')} осиротіли — на схемі стали пунктирними)`);
      return {out};
    }
    case 'revert':{
      if(T[2]!=='HEAD')return {out:[`підказка: у тренажері підтримується лише git revert HEAD`]};
      const tip=tlHeadCommit(st);
      if(!tip)return {out:[`fatal: bad revision 'HEAD'`]};
      const c=st.commits[tip];
      if(c.parents.length>1)return {out:[`error: commit ${tip} is a merge but no -m option was given.`]};
      const b=tlCurBranch(st);
      let color='main',lane=0;
      if(b&&st.brMeta[b]){color=st.brMeta[b].color;lane=st.brMeta[b].lane;}
      const id='C'+(++st.cseq);
      tlNewCommit(st,id,`Revert "${c.msg}"`,[tip],color,lane,c.files.slice());
      return {out:[`[${b||'detached HEAD'} ${id}] Revert "${c.msg}"`]};
    }
    case 'restore':{
      const stagedFlag=T[2]==='--staged';
      const f=stagedFlag?T[3]:T[2];
      if(!f)return {out:[`usage: git restore [--staged] <файл>`]};
      const s=st.files[f];
      if(s===undefined)return {out:[`error: pathspec '${f}' did not match any file(s) known to git`]};
      if(stagedFlag){
        if(s==='staged'){st.files[f]='modified';return {out:[]};}
        if(s==='stagedNew'){st.files[f]='untracked';return {out:[]};}
        return {out:[`(файл ${f} і так не у staging)`]};
      }
      if(s==='modified'){st.files[f]='clean';return {out:[`(незакомічені зміни у ${f} відкинуто)`]};}
      if(s==='staged'||s==='stagedNew')return {out:[`підказка: файл у staging — спершу git restore --staged ${f}`]};
      if(s==='untracked')return {out:[`error: pathspec '${f}' did not match any file(s) known to git`]};
      return {out:[`(у ${f} немає змін)`]};
    }
    case 'stash':{
      if(T[2]==='pop'){
        if(!st.stash.length)return {out:[`No stash entries found.`]};
        const sn=st.stash.pop();
        Object.keys(sn.files).forEach(f=>st.files[f]='modified');
        return {out:[`Dropped refs/stash@{0}`]};
      }
      if(T[2]&&T[2]!=='push')return {out:[`підказка: у тренажері підтримується git stash і git stash pop`]};
      const dirty=Object.keys(st.files).filter(f=>['modified','staged','stagedNew'].indexOf(st.files[f])>=0);
      if(!dirty.length)return {out:[`No local changes to save`]};
      const snap={files:{}};
      dirty.forEach(f=>{snap.files[f]=st.files[f];st.files[f]='clean';});
      st.stash.push(snap);
      const b=tlCurBranch(st),tip=tlHeadCommit(st);
      return {out:[`Saved working directory and index state WIP on ${b||'HEAD'}: ${tip||''} ${tip&&st.commits[tip]?st.commits[tip].msg:''}`]};
    }
    default:
      if(TL_KNOWN_OTHER.indexOf(sub)>=0)return {out:[`Команда git ${sub} існує, але в цьому тренажері вона не потрібна.`,`Список доступних команд: help`]};
      return {out:[`git: '${sub}' is not a git command. See 'git --help'.`]};
  }
}
const TL_GOAL_KEYS=['initialized','branch','branchAt','branchCommitsAtLeast','commitsOnBranch','headOn','headDetached','commitsAtLeast','commitsExactly','fileStatus','merged','lastCommitParents','lastMsgMatch','pushed','remoteBranch','stashEmpty','noMergeCommits','conflictSeen','mergeAborted'];
function tlCheckGoal(st,goal){
  for(const k of Object.keys(goal)){
    const v=goal[k];
    if(k==='initialized'){if(st.initialized!==v)return false;}
    else if(k==='branch'){if(st.branches[v]===undefined)return false;}
    else if(k==='branchAt'){for(const b of Object.keys(v))if(st.branches[b]!==v[b])return false;}
    else if(k==='branchCommitsAtLeast'){for(const b of Object.keys(v)){const t=tlTip(st,b);if(!t||tlReach(st,t).size<v[b])return false;}}
    else if(k==='commitsOnBranch'){let n=0;Object.keys(st.commits).forEach(id=>{if(st.commits[id].br===v.branch)n++;});if(n<v.atLeast)return false;}
    else if(k==='conflictSeen'){if((!!st.hadConflict)!==v)return false;}
    else if(k==='mergeAborted'){if((!!st.mergeAborted)!==v)return false;}
    else if(k==='headOn'){if(tlCurBranch(st)!==v)return false;}
    else if(k==='headDetached'){if((st.head&&st.head.type==='commit')!==v)return false;}
    else if(k==='commitsAtLeast'){const h=tlHeadCommit(st);if(!h||tlReach(st,h).size<v)return false;}
    else if(k==='commitsExactly'){const h=tlHeadCommit(st);if((h?tlReach(st,h).size:0)!==v)return false;}
    else if(k==='fileStatus'){for(const f of Object.keys(v)){const s=st.files[f];const want=v[f];if(want==='staged'){if(s!=='staged'&&s!=='stagedNew')return false;}else if(s!==want)return false;}}
    else if(k==='merged'){const tf=tlTip(st,v.from),ti=tlTip(st,v.into);if(!tf||!ti||!tlIsAncestor(st,tf,ti))return false;}
    else if(k==='lastCommitParents'){const h=tlHeadCommit(st);if(!h||st.commits[h].parents.length!==v)return false;}
    else if(k==='lastMsgMatch'){const h=tlHeadCommit(st);if(!h||!new RegExp(v).test(st.commits[h].msg))return false;}
    else if(k==='pushed'){const b=typeof v==='string'?v:tlCurBranch(st);if(!b||!st.remote||st.remote.branches[b]===undefined||st.remote.branches[b]!==st.branches[b])return false;}
    else if(k==='remoteBranch'){if(!st.remote||st.remote.branches[v]===undefined)return false;}
    else if(k==='stashEmpty'){if((st.stash.length===0)!==v)return false;}
    else if(k==='noMergeCommits'){const h=tlHeadCommit(st);if(h){const r=tlReach(st,h);for(const id of r)if(st.commits[id].parents.length>1)return false;}}
    else return false; // невідомий ключ goal-DSL — задача некоректна
  }
  return true;
}
function buildTermlab(){
  document.querySelectorAll('.termlab').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const key=el.dataset.tl,t=TERMLAB[key];
    if(!t){el.innerHTML=`<div class="tl-task">Задачу не знайдено</div>`;return;}
    el.innerHTML=`<div class="tl-task"><b>${t.title}</b><div class="tl-task-text">${t.task}</div></div>
      <div class="tl-grid">
        <div class="term-win tl-term"><div class="tw-bar"><span class="tw-dot" style="background:#ff5f57"></span><span class="tw-dot" style="background:#febc2e"></span><span class="tw-dot" style="background:#28c840"></span><span class="tw-title">PBIP — Git Bash</span></div>
          <div class="tw-body tl-scroll"></div>
          <div class="tl-row"><span class="tw-p tl-ps"></span><input class="tl-inp" type="text" spellcheck="false" autocomplete="off" placeholder="команда + Enter (help — список)"></div></div>
        <div class="tl-state"><div class="tl-gwrap"></div><div class="tl-files"></div></div>
      </div>
      <div class="tl-btns"><button class="tl-hint ghost">Підказка</button><button class="tl-show ghost">Показати розв'язок</button><button class="tl-reset ghost">Скинути</button></div>
      <div class="tl-sol"></div><div class="tl-fb"></div>`;
    const scroll=el.querySelector('.tl-scroll'),inp=el.querySelector('.tl-inp'),ps=el.querySelector('.tl-ps'),
      gwrap=el.querySelector('.tl-gwrap'),filesEl=el.querySelector('.tl-files'),fb=el.querySelector('.tl-fb'),sol=el.querySelector('.tl-sol');
    let st=tlNewState(t.init),hintIdx=0,hist=[],histPos=-1,solved=false;
    function paint(){
      gwrap.innerHTML=drawGraph(tlGraph(st));
      filesEl.innerHTML=tlFilesHtml(st);
      ps.textContent=tlPrompt(st);
    }
    function print(html){const d=document.createElement('div');d.className='tl-line';d.innerHTML=html;scroll.appendChild(d);scroll.scrollTop=scroll.scrollHeight;}
    function exec(line){
      if(!line.trim())return;
      print(`<span class="tw-p">${escapeHTML(tlPrompt(st))}</span> <span class="tw-c">${escapeHTML(line)}</span>`);
      const res=tlRun(st,line);
      if(res.clear)scroll.innerHTML='';
      (res.out||[]).forEach(l=>print(`<span class="tw-o">${escapeHTML(l)}</span>`));
      paint();
      hist.push(line);histPos=hist.length;
      if(!solved&&tlCheckGoal(st,t.goal)){
        solved=true;
        fb.className='tl-fb ok';fb.innerHTML=`✔ ${t.ok||`Задачу розв'язано!`}`;
        el.classList.add('solved');
        lsSet('gfp:tl:'+key,'1');
      }
    }
    el.querySelector('.tl-term').addEventListener('click',e=>{
      if(e.target.closest('.tl-inp'))return;
      const s=window.getSelection&&window.getSelection();
      if(s&&String(s).length)return; // користувач виділяє текст виводу — фокус не крадемо
      inp.focus();
    });
    inp.addEventListener('keydown',e=>{
      if(e.key==='Enter'){exec(inp.value);inp.value='';}
      else if(e.key==='ArrowUp'){if(histPos>0){histPos--;inp.value=hist[histPos];e.preventDefault();}}
      else if(e.key==='ArrowDown'){if(histPos<hist.length-1){histPos++;inp.value=hist[histPos];}else{histPos=hist.length;inp.value='';}}
    });
    el.querySelector('.tl-hint').onclick=()=>{
      const h=(t.hints||[])[Math.min(hintIdx,(t.hints||[]).length-1)];
      if(h){fb.className='tl-fb hint';fb.innerHTML=`💡 ${h}`;hintIdx++;}
    };
    el.querySelector('.tl-show').onclick=()=>{
      sol.innerHTML=`<div class="tl-sol-t">Розв'язок:</div>`+(t.sol||[]).map(c=>`<code>${escapeHTML(c)}</code>`).join('');
      sol.classList.add('show');
    };
    el.querySelector('.tl-reset').onclick=()=>{
      st=tlNewState(t.init);solved=false;hintIdx=0;hist=[];histPos=0;
      scroll.innerHTML='';fb.className='tl-fb';fb.innerHTML='';sol.classList.remove('show');sol.innerHTML='';
      el.classList.remove('solved');
      print(`<span class="tw-cm"># стан скинуто до початкового</span>`);
      paint();inp.focus();
    };
    if(lsGet('gfp:tl:'+key)==='1')el.classList.add('solved-before');
    print(`<span class="tw-cm"># вводь команди; help — список, «Скинути» — почати заново</span>`);
    paint();
  });
}

/* === 12ba. CMDANIM: анімація «що робить команда» (два вікна — термінал + контекст) === */
const CMDANIM={
  mkdir:{
    title:`mkdir — нова папка в Провіднику`,
    panel:'explorer',
    fs0:{path:`C:\\PBI`,items:[{n:`Sales.pbip`,k:'file'}]},
    steps:[
      {t:'type',s:`mkdir zvit`},
      {t:'fx',op:'add',n:`zvit`,k:'folder'},
      {t:'fx',op:'mark',n:`zvit`},
      {t:'note',s:`Це те саме, що в Провіднику Windows натиснути правою кнопкою миші → «Створити» → «Папку» і назвати її zvit.`}
    ]
  },
  git_commit:{
    title:`git commit — новий знімок в історії репозиторію`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git commit -m "нова міра Total Sales"`},
      {t:'out',s:[`[main c3f1a02] нова міра Total Sales`,` 1 file changed, 1 insertion(+)`]},
      {t:'fx',op:'commit',id:'c3',msg:`нова міра Total Sales`,par:['c2'],br:'main'},
      {t:'fx',op:'mark',id:'c3'},
      {t:'note',s:`git commit зберігає знімок staging-зони як новий коміт c3. Гілка main і HEAD одразу переїжджають на нього.`}
    ]
  },
  cd:{
    title:`cd — перейти в іншу папку`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit`,items:[{n:`report.pbip`,k:'file'},{n:`definition`,k:'folder'}]},
    steps:[
      {t:'type',s:`cd definition`},
      {t:'fx',op:'cwd',path:`C:\\PBI\\zvit\\definition`,items:[{n:`model.tmdl`,k:'file'},{n:`relationships.tmdl`,k:'file'},{n:`tables`,k:'folder'}]},
      {t:'note',s:`Те саме, що двічі клікнути по папці definition в Провіднику: вікно показує вже її вміст, а заголовок угорі змінюється на новий шлях.`}
    ]
  },
  ls:{
    title:`ls — показати вміст поточної папки`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit\\definition`,items:[{n:`model.tmdl`,k:'file'},{n:`relationships.tmdl`,k:'file'},{n:`tables`,k:'folder'}]},
    steps:[
      {t:'type',s:`ls`},
      {t:'out',s:[`model.tmdl  relationships.tmdl  tables/`]},
      {t:'fx',op:'mark',n:`model.tmdl`},
      {t:'fx',op:'mark',n:`relationships.tmdl`},
      {t:'fx',op:'mark',n:`tables`},
      {t:'note',s:`ls — той самий список, що ти бачиш у вікні Провідника, тільки текстом: не треба відкривати окреме вікно, щоб перевірити, що лежить поруч.`}
    ]
  },
  pwd:{
    title:`pwd — де я зараз`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit\\definition\\tables`,items:[{n:`Sales.tmdl`,k:'file'},{n:`Customer.tmdl`,k:'file'}]},
    steps:[
      {t:'type',s:`pwd`},
      {t:'out',s:[`/c/PBI/zvit/definition/tables`]},
      {t:'fx',op:'mark',n:`Sales.tmdl`},
      {t:'note',s:`pwd друкує повний шлях до поточної папки — так само, як рядок з адресою (breadcrumb) вгорі вікна Провідника показує, де ти перебуваєш. Підсвічене праворуч — вміст саме цієї папки.`}
    ]
  },
  cp:{
    title:`cp — скопіювати файл`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit\\definition\\tables`,items:[{n:`Sales.tmdl`,k:'file'},{n:`Customer.tmdl`,k:'file'}]},
    steps:[
      {t:'type',s:`cp Sales.tmdl Sales_backup.tmdl`},
      {t:'fx',op:'add',n:`Sales_backup.tmdl`,k:'file'},
      {t:'note',s:`Те саме, що Ctrl+C → Ctrl+V у Провіднику: оригінал Sales.tmdl лишається на місці, а поруч з'являється його копія з новою назвою.`}
    ]
  },
  mv:{
    title:`mv — перейменувати або перемістити файл`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit\\definition\\tables`,items:[{n:`Sales.tmdl`,k:'file'},{n:`Customer.tmdl`,k:'file'},{n:`Sales_backup.tmdl`,k:'file'}]},
    steps:[
      {t:'type',s:`mv Sales_backup.tmdl Sales_old.tmdl`},
      {t:'fx',op:'ren',from:`Sales_backup.tmdl`,to:`Sales_old.tmdl`},
      {t:'note',s:`mv вміє і перейменовувати (як F2 у Провіднику), і переносити файл в іншу папку — залежно від того, що вказано другим аргументом.`}
    ]
  },
  rm:{
    title:`rm — видалити файл`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit\\definition\\tables`,items:[{n:`Sales.tmdl`,k:'file'},{n:`Customer.tmdl`,k:'file'},{n:`Sales_old.tmdl`,k:'file'}]},
    steps:[
      {t:'type',s:`rm Sales_old.tmdl`},
      {t:'fx',op:'del',n:`Sales_old.tmdl`},
      {t:'note',s:`На відміну від Delete у Провіднику, rm не кладе файл у кошик — він зникає одразу і безповоротно. Подумай двічі, перш ніж тиснути Enter.`}
    ]
  },
  git_init:{
    title:`git init — почати відстежувати папку Git-ом`,
    panel:'explorer',
    fs0:{path:`C:\\PBI\\zvit`,items:[{n:`report.pbip`,k:'file'},{n:`definition`,k:'folder'}]},
    steps:[
      {t:'type',s:`git init`},
      {t:'out',s:[`Initialized empty Git repository in C:/PBI/zvit/.git/`]},
      {t:'fx',op:'add',n:`.git`,k:'folder'},
      {t:'note',s:`Git створив папку .git — вона прихована і в Провіднику зазвичай не видна, але саме в ній зберігається вся історія проєкту. Не видаляй її: без неї немає репозиторію.`}
    ]
  },
  git_status:{
    title:`git status — що змінилось`,
    panel:'files',
    files0:{'definition/model.tmdl':'modified','definition/tables/Sales.tmdl':'untracked','report/report.json':'clean'},
    steps:[
      {t:'type',s:`git status`},
      {t:'out',s:[
        `On branch main`,
        `Changes not staged for commit:`,
        `        modified:   definition/model.tmdl`,
        `Untracked files:`,
        `        definition/tables/Sales.tmdl`
      ]},
      {t:'fx',op:'mark',n:`definition/model.tmdl`},
      {t:'fx',op:'mark',n:`definition/tables/Sales.tmdl`},
      {t:'fx',op:'mark',n:`report/report.json`},
      {t:'note',s:`status — це фотографія поточного стану: що ти чіпав (modified), що зовсім нове (untracked) і що вже збережено й не змінювалось (clean).`}
    ]
  },
  git_add:{
    title:`git add — покласти зміни в кошик staging`,
    panel:'files',
    files0:{'definition/model.tmdl':'modified','definition/tables/Sales.tmdl':'untracked'},
    steps:[
      {t:'type',s:`git add .`},
      {t:'fx',op:'set',n:`definition/model.tmdl`,to:'staged'},
      {t:'fx',op:'set',n:`definition/tables/Sales.tmdl`,to:'staged'},
      {t:'note',s:`git add складає файли у «кошик» staging — це список того, що потрапить у наступний коміт. Сам коміт цим ще не створюється.`}
    ]
  },
  git_restore:{
    title:`git restore — відкинути незакомічені зміни`,
    panel:'files',
    files0:{'definition/model.tmdl':'modified'},
    steps:[
      {t:'type',s:`git restore definition/model.tmdl`},
      {t:'fx',op:'set',n:`definition/model.tmdl`,to:'clean'},
      {t:'note',s:`Увага: зміни, яких не було у staging чи коміті, ЗНИКАЮТЬ безповоротно — файл повертається до останньої збереженої версії, ніби ти нічого й не міняв.`}
    ]
  },
  git_stash:{
    title:`git stash — тимчасово прибрати зміни зі столу`,
    panel:'files',
    files0:{'report/pages/kpi/visual.json':'modified'},
    steps:[
      {t:'type',s:`git stash`},
      {t:'out',s:[`Saved working directory and index state WIP on feature/kpi-cards: 3f1a02 нова міра Total Sales`]},
      {t:'fx',op:'set',n:`report/pages/kpi/visual.json`,to:'clean'},
      {t:'note',s:`Це як прибрати недороблені нотатки в шухляду: файли знову чисті, але зміни нікуди не зникли — git stash pop поверне їх звідти ж, де ти їх лишив.`}
    ]
  },
  git_log:{
    title:`git log — історія комітів`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`нова міра Total Sales`,par:['c2'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git log --oneline`},
      {t:'out',s:[`c3f1a02 нова міра Total Sales`,`a92e771 нова таблиця Sales`,`d10f4ab перша версія звіту`]},
      {t:'fx',op:'mark',id:'c3'},
      {t:'fx',op:'mark',id:'c2'},
      {t:'fx',op:'mark',id:'c1'},
      {t:'note',s:`log читається згори вниз — від найновішого коміту до найстарішого, як стрічка нотаток у щоденнику.`}
    ]
  },
  git_branch:{
    title:`git branch — нова гілка`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git branch feature/kpi`},
      {t:'fx',op:'branch',n:`feature/kpi`,at:'c2'},
      {t:'note',s:`git branch лише чіпляє нову табличку-закладку на поточний коміт. Жоден файл не змінився, HEAD і досі на main — щоб перейти на нову гілку, потрібен git switch.`}
    ]
  },
  git_switch:{
    title:`git switch — перейти на іншу гілку`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'f1',msg:`чернетка KPI-картки`,par:['c1'],br:'feature/kpi'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git switch feature/kpi`},
      {t:'out',s:[`Switched to branch 'feature/kpi'`]},
      {t:'fx',op:'head',to:'feature/kpi'},
      {t:'note',s:`HEAD — це вказівник «де я зараз». switch просто переставляє його на іншу гілку; файли в робочій папці підлаштовуються під той коміт.`}
    ]
  },
  git_merge:{
    title:`git merge — злити гілку в main`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'f1',msg:`KPI-картка`,par:['c1'],br:'feature/kpi'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git merge feature/kpi`},
      {t:'out',s:[`Merge made by the 'ort' strategy.`,` report/pages/kpi/visual.json | 40 ++++++++++++++++++++++`]},
      {t:'fx',op:'commit',id:'m1',msg:`Merge branch 'feature/kpi'`,par:['c2','f1'],br:'main'},
      {t:'fx',op:'head',to:'main'},
      {t:'note',s:`Merge-коміт особливий: у нього ДВА батьки — останній коміт main і останній коміт feature/kpi. Так в історії видно, що дві лінії розробки з'єднались.`}
    ]
  },
  git_reset:{
    title:`git reset --hard — відкотити гілку назад`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`експериментальна міра (не працює)`,par:['c2'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git reset --hard HEAD~1`},
      {t:'out',s:[`HEAD is now at a92e771 нова таблиця Sales`]},
      {t:'fx',op:'tip',br:'main',to:'c2'},
      {t:'fx',op:'mark',id:'c3'},
      {t:'note',s:`Гілка main тепер вказує на c2, а c3 лишився в базі, але до нього більше не веде жодна стрілка — на схемі він напівпрозорий. Якщо c3 вже потрапив на сервер до інших, reset --hard небезпечний: у колег історія розійдеться з твоєю.`}
    ]
  },
  git_revert:{
    title:`git revert — безпечно скасувати коміт`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`експериментальна міра (не працює)`,par:['c2'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git revert HEAD`},
      {t:'out',s:[`[main c4a1f9e] Revert "експериментальна міра (не працює)"`,` 1 file changed, 1 deletion(-)`]},
      {t:'fx',op:'commit',id:'c4',msg:`revert: експериментальна міра (не працює)`,par:['c3'],br:'main'},
      {t:'fx',op:'mark',id:'c4'},
      {t:'note',s:`revert не стирає c3 з історії — він додає новий коміт c4, який скасовує його зміни. Це безпечніше за reset: історія лише росте вперед, і колеги, які вже мають c3, спокійно підтягнуть c4 звичайним pull.`}
    ]
  },
  git_clone:{
    title:`git clone — скачати повну копію репозиторію`,
    panel:'remote',
    remote0:{local:0,remote:3},
    steps:[
      {t:'type',s:`git clone https://github.com/team/pbi-reports.git`},
      {t:'out',s:[`Cloning into 'pbi-reports'...`,`remote: Enumerating objects: 12, done.`,`Receiving objects: 100% (12/12), done.`]},
      {t:'fx',op:'recv',n:3},
      {t:'note',s:`clone — це не «підписка» на зміни, а повна копія: увесь репозиторій разом з усією історією комітів опиняється на твоєму комп'ютері.`}
    ]
  },
  git_push:{
    title:`git push — відправити коміти на сервер`,
    panel:'remote',
    remote0:{local:3,remote:1},
    steps:[
      {t:'type',s:`git push`},
      {t:'out',s:[`To https://github.com/team/pbi-reports.git`,`   a1b2c3d..f9e8d7c  main -> main`]},
      {t:'fx',op:'send',n:2},
      {t:'note',s:`push доганяє GitHub твоїми новими комітами. Локальні коміти нікуди не зникають — просто тепер вони є і на сервері, і колеги зможуть їх забрати.`}
    ]
  },
  git_pull:{
    title:`git pull — забрати нові коміти з сервера`,
    panel:'remote',
    remote0:{local:1,remote:3},
    steps:[
      {t:'type',s:`git pull`},
      {t:'out',s:[`Updating a1b2c3d..f9e8d7c`,`Fast-forward`]},
      {t:'fx',op:'recv',n:2},
      {t:'note',s:`pull підтягує коміти, яких на GitHub з'явилось більше, ніж у тебе, і одразу вливає їх у поточну гілку — робочі файли теж оновлюються.`}
    ]
  },
  git_fetch:{
    title:`git fetch — подивитись на нові коміти, не вливаючи їх`,
    panel:'remote',
    remote0:{local:1,remote:3},
    steps:[
      {t:'type',s:`git fetch`},
      {t:'out',s:[`From https://github.com/team/pbi-reports`,`   a1b2c3d..f9e8d7c  main -> origin/main`]},
      {t:'fx',op:'recv',n:2},
      {t:'note',s:`fetch і pull відрізняються так: fetch лише розвідує, що нового на сервері (подивитись), а pull ще й одразу вливає ці зміни у твою гілку (влити). Після fetch робочі файли не зміняться, поки ти сам не зробиш merge чи pull.`}
    ]
  },
  git_rebase:{
    title:`git rebase main — переносить гілку на нову основу`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`нова міра Total Sales`,par:['c2'],br:'main'},
      {id:'f1',msg:`чернетка KPI-картки`,par:['c1'],br:'feature'}
    ],head:'feature'},
    steps:[
      {t:'type',s:`git rebase main`},
      {t:'out',s:[`First, rewinding head to replay your work on top of it...`,`Applying: чернетка KPI-картки`]},
      {t:'fx',op:'commit',id:'f1r',msg:`чернетка KPI-картки`,par:['c3'],br:'feature'},
      {t:'fx',op:'mark',id:'f1r'},
      {t:'note',s:`rebase «переносить» коміт на нову основу — але насправді це КОПІЯ з новим SHA: f1r замінив f1 на гілці feature, а старий f1 лишився сірим у минулому, бо на нього більше не веде жодна гілка. Тому rebase вже запушених гілок небезпечний: у колег, які мали старий f1, історія розійдеться з твоєю.`}
    ]
  },
  git_cherry_pick:{
    title:`git cherry-pick — забирає один коміт з іншої гілки`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'f1',msg:`чернетка KPI-картки`,par:['c1'],br:'feature'},
      {id:'f2',msg:`виправлення кольору KPI-картки`,par:['f1'],br:'feature'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git cherry-pick a1b2c3d`},
      {t:'out',s:[`[main 9f3e21a] виправлення кольору KPI-картки`,` 1 file changed, 1 insertion(+)`]},
      {t:'fx',op:'commit',id:'f2c',msg:`виправлення кольору KPI-картки`,par:['c2'],br:'main'},
      {t:'fx',op:'mark',id:'f2c'},
      {t:'note',s:`cherry-pick бере лише ОДНУ «вишеньку» з чужої гілки: f2c — новий коміт із власним SHA і батьком c2 (не f1), хоча вміст той самий, що й у f2. Гілка feature лишається незмінною — f1 у main так і не потрапив.`}
    ]
  },
  git_amend:{
    title:`git commit --amend — підміняє останній коміт`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`fix: crrect YTD fitler in Sales`,par:['c2'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git commit --amend -m "fix: correct YTD filter in Sales"`},
      {t:'out',s:[`[main f9e2a1c] fix: correct YTD filter in Sales`,` 1 file changed, 1 insertion(+), 1 deletion(-)`]},
      {t:'fx',op:'commit',id:'c3a',msg:`fix: correct YTD filter in Sales`,par:['c2'],br:'main'},
      {t:'fx',op:'mark',id:'c3a'},
      {t:'note',s:`amend ПІДМІНЯЄ останній коміт новим: c3a має новий SHA і виправлене повідомлення, а старий c3 (з одруківкою) лишився в базі даних Git, тільки на нього вже не вказує жодна гілка — на схемі він сірий. Це працює лише до push: якщо c3 вже потрапив на GitHub, amend ламає історію для колег.`}
    ]
  },
  git_bisect:{
    title:`git bisect — шукає винний коміт навпіл`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`нова міра Total Sales`,par:['c2'],br:'main'},
      {id:'c4',msg:`рефактор моделі`,par:['c3'],br:'main'},
      {id:'c5',msg:`реліз: числа не сходяться`,par:['c4'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git bisect start`},
      {t:'out',s:[`status: waiting for both good and bad commits`]},
      {t:'type',s:`git bisect bad`},
      {t:'type',s:`git bisect good c1`},
      {t:'out',s:[`Bisecting: 1 revision left to test after this (roughly 2 steps)`,`[f0a35e2] нова міра Total Sales`]},
      {t:'fx',op:'mark',id:'c3'},
      {t:'type',s:`git bisect bad`},
      {t:'out',s:[`Bisecting: 0 revisions left to test after this (roughly 1 step)`,`[b7e4f21] нова таблиця Sales`]},
      {t:'fx',op:'mark',id:'c2'},
      {t:'type',s:`git bisect good`},
      {t:'out',s:[`f0a35e2 is the first bad commit`,`commit f0a35e2`,`    нова міра Total Sales`]},
      {t:'fx',op:'mark',id:'c3'},
      {t:'note',s:`git bisect — це знайома гра «відгадай число»: кожна відповідь good/bad ділить залишок навпіл. З 5 комітів вистачило 2 перевірок; зі 128 комітів вистачило б лише 7 — бо 2 в сьомому степені дає 128. Двійковий пошук завжди швидший за перегляд комітів поспіль.`}
    ]
  },
  git_worktree:{
    title:`git worktree add — друга робоча папка тієї самої історії`,
    panel:'explorer',
    fs0:{path:`C:\\PBI`,items:[{n:`report.pbip`,k:'file'},{n:`definition`,k:'folder'}]},
    steps:[
      {t:'type',s:`git worktree add ../hotfix main`},
      {t:'out',s:[`Preparing worktree (checking out 'main')`,`HEAD is now at 3f1a02d нова міра Total Sales`]},
      {t:'fx',op:'add',n:`hotfix (друга робоча копія)`,k:'folder'},
      {t:'fx',op:'mark',n:`hotfix (друга робоча копія)`},
      {t:'note',s:`Це та сама історія — просто друга незалежна папка на диску. У hotfix можна лагодити терміновий баг, не чіпаючи report.pbip, який уже відкритий у Power BI Desktop у первинній папці.`}
    ]
  },
  git_diff:{
    title:`git diff — що саме зміниться до коміту`,
    panel:'files',
    files0:{'definition/model.tmdl':'modified'},
    steps:[
      {t:'type',s:`git diff`},
      {t:'out',s:[
        `--- a/definition/model.tmdl`,
        `+++ b/definition/model.tmdl`,
        `@@ -14,1 +14,1 @@`,
        `-  SUM(Sales[Amount])`,
        `+  SUMX(Sales, Sales[Amount] * (1 - Sales[Discount]))`
      ]},
      {t:'fx',op:'mark',n:`definition/model.tmdl`},
      {t:'note',s:`diff показує ЩО саме зміниться ще ДО коміту: рядки з "-" зникнуть, з "+" з'являться. Звичка дивитись сюди перед кожним git add рятує від випадкових правок у коміті.`}
    ]
  },
  git_tag:{
    title:`git tag — нерухома закладка на коміті`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`нова міра Total Sales`,par:['c2'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git tag v3.0`},
      {t:'fx',op:'branch',n:`v3.0`,at:'c3'},
      {t:'fx',op:'mark',id:'c3'},
      {t:'type',s:`git commit -m "нова таблиця Inventory"`},
      {t:'out',s:[`[main f2b7a19] нова таблиця Inventory`,` 1 file changed, 1 insertion(+)`]},
      {t:'fx',op:'commit',id:'c4',msg:`нова таблиця Inventory`,par:['c3'],br:'main'},
      {t:'fx',op:'mark',id:'c3'},
      {t:'note',s:`У цьому й суть: гілка main поїхала далі на c4, а тег v3.0 лишився стояти на c3 — як закладка на релізі. v3.0 = «звіт, який пішов керівництву в липні»: хоч скільки нових комітів зʼявиться пізніше, до цього стану завжди можна повернутися за іменем тега.`}
    ]
  },
  git_reflog:{
    title:`git reflog — журнал усіх рухів HEAD`,
    panel:'repo',
    repo0:{commits:[
      {id:'c1',msg:`перша версія звіту`,par:[],br:'main'},
      {id:'c2',msg:`нова таблиця Sales`,par:['c1'],br:'main'},
      {id:'c3',msg:`нова міра Total Sales`,par:['c2'],br:'main'}
    ],head:'main'},
    steps:[
      {t:'type',s:`git reset --hard HEAD~1`},
      {t:'out',s:[`HEAD is now at a92e771 нова таблиця Sales`]},
      {t:'fx',op:'tip',br:'main',to:'c2'},
      {t:'pause',ms:500},
      {t:'note',s:`Ой... коміт зник? main тепер вказує на c2, і на схемі c3 посірів — до нього більше не веде жодна стрілка від гілки.`},
      {t:'type',s:`git reflog`},
      {t:'out',s:[`a92e771 HEAD@{0}: reset: moving to HEAD~1`,`c3f1a02 HEAD@{1}: commit: нова міра Total Sales`]},
      {t:'type',s:`git reset --hard HEAD@{1}`},
      {t:'out',s:[`HEAD is now at c3f1a02 нова міра Total Sales`]},
      {t:'fx',op:'tip',br:'main',to:'c3'},
      {t:'fx',op:'mark',id:'c3'},
      {t:'note',s:`reflog пам'ятає КОЖЕН рух HEAD близько 90 днів — це «чорна скринька» Git. Навіть коли коміт здається втраченим, його SHA ще тут, і git reset --hard на цей SHA повертає все як було.`}
    ]
  }
};
const CA_SPEED=1.5; // глобальний множник темпу анімацій (більше = повільніше)
function caWait(ms){return new Promise(res=>setTimeout(res,ms*CA_SPEED));}
function caReduced(){try{return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return false;}}
async function caType(bodyEl,text,reduced){
  const line=document.createElement('div');line.className='ca-line';
  if(reduced){line.innerHTML=`<span class="tw-p">$</span> <span class="tw-c">${escapeHTML(text)}</span>`;bodyEl.appendChild(line);return;}
  line.innerHTML=`<span class="tw-p">$</span> <span class="tw-c"></span><span class="ca-cursor">▌</span>`;
  bodyEl.appendChild(line);
  const cmdSpan=line.querySelector('.tw-c'),cur=line.querySelector('.ca-cursor');
  let shown='';
  for(let i=0;i<text.length;i++){shown+=text[i];cmdSpan.textContent=shown;bodyEl.scrollTop=bodyEl.scrollHeight;await caWait(35);}
  if(cur)cur.remove();
  await caWait(280);
}
function caOutLine(l){
  const cls=l.indexOf('+')===0?'dl-add':l.indexOf('-')===0?'dl-del':l.indexOf('@@')===0?'dl-hunk':'';
  return cls?`<span class="dl ${cls}">${escapeHTML(l)}</span>`:escapeHTML(l);
}
async function caOut(bodyEl,lines,reduced){
  if(reduced){(lines||[]).forEach(l=>{bodyEl.insertAdjacentHTML('beforeend',`<div class="ca-line tw-o">${caOutLine(l)}</div>`);});return;}
  for(const l of (lines||[])){
    bodyEl.insertAdjacentHTML('beforeend',`<div class="ca-line tw-o">${caOutLine(l)}</div>`);
    bodyEl.scrollTop=bodyEl.scrollHeight;
    await caWait(200);
  }
}
function caExplorerHtml(items){
  if(!items||!items.length)return `<div class="ca-eempty">папка порожня</div>`;
  return `<div class="ca-elist">${items.map(it=>`<div class="ca-erow" data-n="${escapeHTML(it.n)}"><span class="ca-eicon">${it.k==='folder'?'📁':'📄'}</span><span class="ca-ename">${escapeHTML(it.n)}</span></div>`).join('')}</div>`;
}
function caFindRowIn(appBody,sel,name){return Array.prototype.find.call(appBody.querySelectorAll(sel),r=>r.dataset.n===name)||null;}
function caFindRow(appBody,name){return caFindRowIn(appBody,'.ca-erow',name);}
function caDoAdd(appBody,items,step,reduced){
  items.push({n:step.n,k:step.k||'file'});
  let wrap=appBody.querySelector('.ca-elist');
  if(!wrap){appBody.innerHTML='<div class="ca-elist"></div>';wrap=appBody.querySelector('.ca-elist');}
  const row=document.createElement('div');
  row.className='ca-erow'+(reduced?'':' ca-enter');
  row.dataset.n=step.n;
  row.innerHTML=`<span class="ca-eicon">${step.k==='folder'?'📁':'📄'}</span><span class="ca-ename">${escapeHTML(step.n)}</span>`;
  wrap.appendChild(row);
  return reduced?Promise.resolve():caWait(420);
}
function caDoDel(appBody,items,step,reduced){
  const idx=items.findIndex(x=>x.n===step.n);if(idx>=0)items.splice(idx,1);
  const row=caFindRow(appBody,step.n);
  if(!row)return Promise.resolve();
  if(reduced){row.remove();return Promise.resolve();}
  row.classList.add('ca-leaving');
  return caWait(380).then(()=>row.remove());
}
function caDoRen(appBody,items,step,reduced){
  const it=items.find(x=>x.n===step.from);if(it)it.n=step.to;
  const row=caFindRow(appBody,step.from);
  if(!row)return Promise.resolve();
  if(reduced){row.dataset.n=step.to;const nm=row.querySelector('.ca-ename');if(nm)nm.textContent=step.to;return Promise.resolve();}
  row.classList.add('ca-renaming');
  return caWait(360).then(()=>{row.dataset.n=step.to;const nm=row.querySelector('.ca-ename');if(nm)nm.textContent=step.to;row.classList.remove('ca-renaming');});
}
function caDoMark(appBody,step,reduced,sel){
  const row=caFindRowIn(appBody,sel||'.ca-erow',step.n);
  if(!row||reduced)return Promise.resolve();
  row.classList.remove('ca-markpulse');void row.offsetWidth;row.classList.add('ca-markpulse');
  return caWait(700);
}
function caDoCwd(appBody,items,step,reduced,titleEl){
  const newItems=(step.items||[]).map(x=>({n:x.n,k:x.k||'file'}));
  function apply(){
    items.length=0;newItems.forEach(x=>items.push(x));
    if(titleEl)titleEl.textContent=`Провідник — ${step.path}`;
    appBody.innerHTML=caExplorerHtml(items);
  }
  if(reduced){apply();return Promise.resolve();}
  appBody.classList.add('ca-fading');
  return caWait(220).then(()=>{apply();appBody.classList.remove('ca-fading');return caWait(240);});
}
function caApplyExplorerFx(appBody,items,step,reduced,titleEl){
  if(step.op==='add')return caDoAdd(appBody,items,step,reduced);
  if(step.op==='del')return caDoDel(appBody,items,step,reduced);
  if(step.op==='ren')return caDoRen(appBody,items,step,reduced);
  if(step.op==='mark')return caDoMark(appBody,step,reduced);
  if(step.op==='cwd')return caDoCwd(appBody,items,step,reduced,titleEl);
  return Promise.resolve();
}
function caRepoStateInit(repo0){
  const commits={},order=[],branches={};
  (repo0.commits||[]).forEach(c=>{commits[c.id]={id:c.id,msg:c.msg,par:(c.par||[]).slice(),br:c.br||'main'};order.push(c.id);branches[c.br||'main']=c.id;});
  return {commits,order,branches,head:repo0.head||'main'};
}
function caReachable(state){
  const seen={};
  const stack=Object.keys(state.branches).map(br=>state.branches[br]);
  while(stack.length){
    const id=stack.pop();
    if(!id||seen[id])continue;
    seen[id]=true;
    const c=state.commits[id];
    if(c)(c.par||[]).forEach(p=>stack.push(p));
  }
  return seen;
}
function caRepoSvg(state,pulseId){
  const ids=state.order;
  if(!ids.length)return `<div class="ca-rempty">історія порожня</div>`;
  const reach=caReachable(state);
  const laneOf={};let laneSeq=0;
  ids.forEach(id=>{const br=state.commits[id].br;if(!(br in laneOf))laneOf[br]=laneSeq++;});
  const r=13,colW=74,rowH=52,topPad=32,leftPad=28;
  const pos={};
  ids.forEach((id,i)=>{const c=state.commits[id];pos[id]={x:leftPad+i*colW,y:topPad+laneOf[c.br]*rowH};});
  let edges='';
  ids.forEach(id=>{
    const c=state.commits[id];
    const ghostEdge=!reach[id];
    (c.par||[]).forEach(pid=>{
      const a=pos[id],b=pos[pid];if(!b)return;
      const col=BR[c.br]||'#556';
      const op=ghostEdge?' opacity="0.3"':'';
      if(a.y===b.y)edges+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="2"${op}/>`;
      else{const mx=(a.x+b.x)/2;edges+=`<path d="M${a.x} ${a.y} C ${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}" fill="none" stroke="${col}" stroke-width="2"${op}/>`;}
    });
  });
  let circ='';
  ids.forEach(id=>{
    const c=state.commits[id],p=pos[id],col=BR[c.br]||'#556';
    const ghost=!reach[id];
    const cls='ca-cnode'+(id===pulseId?' ca-pulse':'')+(ghost?' ca-cnode-ghost':'');
    circ+=`<circle class="${cls}" cx="${p.x}" cy="${p.y}" r="${r}" fill="${col}" stroke="#ffffff" stroke-width="2"${ghost?' opacity="0.35"':''}/>`;
    circ+=`<text x="${p.x}" y="${p.y+3}" text-anchor="middle" font-size="9" font-weight="700" fill="#16202d" font-family="JetBrains Mono,monospace"${ghost?' opacity="0.55"':''}>${escapeHTML(id)}</text>`;
  });
  let badges='';
  Object.keys(state.branches).forEach(br=>{
    const tip=state.branches[br],p=pos[tip];if(!p)return;
    const isHead=state.head===br,label=br+(isHead?' • HEAD':'');
    const w=label.length*6.6+16,by=p.y-r-24,col=BR[br]||'#889';
    badges+=`<line x1="${p.x}" y1="${by+18}" x2="${p.x}" y2="${p.y-r}" stroke="${col}" stroke-width="1.2" stroke-dasharray="2 2"/>`;
    badges+=`<rect x="${p.x-w/2}" y="${by}" width="${w}" height="18" rx="9" fill="${isHead?col:'none'}" stroke="${col}" stroke-width="1.4"/>`;
    badges+=`<text x="${p.x}" y="${by+13}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${isHead?'#0c0f14':col}" font-family="JetBrains Mono,monospace">${escapeHTML(label)}</text>`;
  });
  const maxLane=Math.max(...Object.values(laneOf));
  const width=leftPad*2+(ids.length-1)*colW+r*2+30;
  const height=topPad+maxLane*rowH+r*2+30;
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${Math.round(width)}px" xmlns="http://www.w3.org/2000/svg">${edges}${badges}${circ}</svg>`;
}
function caApplyRepoFx(appBody,state,step,reduced){
  if(step.op==='commit'){
    state.commits[step.id]={id:step.id,msg:step.msg||'',par:(step.par||[]).slice(),br:step.br||state.head};
    state.order.push(step.id);
    state.branches[step.br||state.head]=step.id;
    appBody.innerHTML=caRepoSvg(state,null);
    return reduced?Promise.resolve():caWait(420);
  }
  if(step.op==='branch'){
    state.branches[step.n]=step.at||state.branches[state.head];
    appBody.innerHTML=caRepoSvg(state,null);
    return reduced?Promise.resolve():caWait(420);
  }
  if(step.op==='head'){
    state.head=step.to;
    appBody.innerHTML=caRepoSvg(state,null);
    return reduced?Promise.resolve():caWait(420);
  }
  if(step.op==='tip'){
    state.branches[step.br]=step.to;
    appBody.innerHTML=caRepoSvg(state,null);
    return reduced?Promise.resolve():caWait(420);
  }
  if(step.op==='mark'){
    appBody.innerHTML=caRepoSvg(state,step.id);
    return reduced?Promise.resolve():caWait(700);
  }
  return Promise.resolve();
}
const CA_FILE_LABEL={untracked:`новий`,modified:`змінено`,staged:`у кошику staging`,clean:`збережено`};
function caFilesHtml(files){
  const names=Object.keys(files||{});
  if(!names.length)return `<div class="ca-eempty">файлів немає</div>`;
  return `<div class="ca-flist">${names.map(n=>`<div class="ca-frow" data-n="${escapeHTML(n)}"><span class="ca-fname">${escapeHTML(n)}</span><span class="ca-fbadge st-${files[n]}">${escapeHTML(CA_FILE_LABEL[files[n]]||files[n])}</span></div>`).join('')}</div>`;
}
function caDoSet(appBody,files,step,reduced){
  files[step.n]=step.to;
  const row=caFindRowIn(appBody,'.ca-frow',step.n);
  if(!row)return Promise.resolve();
  const badge=row.querySelector('.ca-fbadge');
  if(!badge)return Promise.resolve();
  badge.className='ca-fbadge st-'+step.to;
  badge.textContent=CA_FILE_LABEL[step.to]||step.to;
  if(reduced)return Promise.resolve();
  badge.classList.remove('ca-fpulse');void badge.offsetWidth;badge.classList.add('ca-fpulse');
  return caWait(700);
}
function caApplyFilesFx(appBody,files,step,reduced){
  if(step.op==='set')return caDoSet(appBody,files,step,reduced);
  if(step.op==='mark')return caDoMark(appBody,step,reduced,'.ca-frow');
  return Promise.resolve();
}
function caCommitWord(n){
  const n10=n%10,n100=n%100;
  if(n100>=11&&n100<=14)return `комітів`;
  if(n10===1)return `коміт`;
  if(n10>=2&&n10<=4)return `коміти`;
  return `комітів`;
}
function caRemoteHtml(state,dir){
  const ico=dir==='send'?'→':(dir==='recv'?'←':'⇄');
  const dots=n=>Array.from({length:n}).map(()=>`<span class="ca-rdot"></span>`).join('');
  return `<div class="ca-remote">
    <div class="ca-rbox" data-side="local"><div class="ca-rlabel">Твій ПК</div><div class="ca-rdots">${dots(state.local)}</div><div class="ca-rcount">${state.local} ${caCommitWord(state.local)}</div></div>
    <div class="ca-rarrow${dir?' ca-rarrow-active':''}" data-dir="${dir||'none'}"><span class="ca-rarrow-ico">${ico}</span></div>
    <div class="ca-rbox" data-side="remote"><div class="ca-rlabel">GitHub</div><div class="ca-rdots">${dots(state.remote)}</div><div class="ca-rcount">${state.remote} ${caCommitWord(state.remote)}</div></div>
  </div>`;
}
function caDoTransfer(appBody,state,step,dir,reduced){
  const n=Math.max(1,step.n||1);
  if(dir==='send')state.remote+=n;else state.local+=n;
  appBody.innerHTML=caRemoteHtml(state,dir);
  if(reduced)return Promise.resolve();
  const destSel=dir==='send'?'.ca-rbox[data-side="remote"] .ca-rdot':'.ca-rbox[data-side="local"] .ca-rdot';
  const dots=appBody.querySelectorAll(destSel);
  for(let i=Math.max(0,dots.length-n);i<dots.length;i++)dots[i].classList.add('ca-rdot-in');
  return caWait(650);
}
function caDoMarkRemote(appBody,reduced){
  const boxes=appBody.querySelectorAll('.ca-rbox');
  if(!boxes.length||reduced)return Promise.resolve();
  boxes.forEach(b=>b.classList.remove('ca-markpulse'));
  void appBody.offsetWidth;
  boxes.forEach(b=>b.classList.add('ca-markpulse'));
  return caWait(700);
}
function caApplyRemoteFx(appBody,state,step,reduced){
  if(step.op==='send')return caDoTransfer(appBody,state,step,'send',reduced);
  if(step.op==='recv')return caDoTransfer(appBody,state,step,'recv',reduced);
  if(step.op==='mark')return caDoMarkRemote(appBody,reduced);
  return Promise.resolve();
}
function buildCmdanim(){
  document.querySelectorAll('.cmdanim').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const key=el.dataset.ca,t=CMDANIM[key];
    if(!t){el.innerHTML=`<div class="ca-title">Анімацію не знайдено</div>`;return;}
    let appName;
    if(t.panel==='repo')appName=`Історія репозиторію`;
    else if(t.panel==='files')appName=`Файли проєкту`;
    else if(t.panel==='remote')appName=`Твій ПК ⇄ GitHub`;
    else appName=`Провідник — ${t.fs0?t.fs0.path:''}`;
    el.innerHTML=`<div class="ca-title">${escapeHTML(t.title)}</div>
      <div class="ca-desk">
        <div class="term-win ca-term"><div class="tw-bar"><span class="tw-dot" style="background:#ff5f57"></span><span class="tw-dot" style="background:#febc2e"></span><span class="tw-dot" style="background:#28c840"></span><span class="tw-title">Git Bash</span></div>
          <div class="tw-body ca-body"></div></div>
        <div class="ca-app"><div class="tw-bar"><span class="tw-title">${escapeHTML(appName)}</span></div>
          <div class="ca-app-body"></div></div>
      </div>
      <div class="ca-note"></div>
      <button class="ca-play">▶ Показати, що робить команда</button>`;
    const bodyTerm=el.querySelector('.ca-body'),appBody=el.querySelector('.ca-app-body'),noteEl=el.querySelector('.ca-note'),btn=el.querySelector('.ca-play'),titleEl=el.querySelector('.ca-app .tw-title');
    let items=null,repoState=null,filesState=null,remoteState=null;
    function resetVisual(){
      items=t.fs0?t.fs0.items.map(x=>({n:x.n,k:x.k})):null;
      repoState=t.repo0?caRepoStateInit(t.repo0):null;
      filesState=t.files0?Object.assign({},t.files0):null;
      remoteState=t.remote0?Object.assign({},t.remote0):null;
      bodyTerm.innerHTML=`<div class="ca-line"><span class="tw-p">$</span> <span class="ca-cursor">▌</span></div>`;
      noteEl.innerHTML=`Натисни кнопку нижче — побачиш анімацію по кроках.`;
      if(titleEl)titleEl.textContent=appName;
      if(t.panel==='repo')appBody.innerHTML=caRepoSvg(repoState,null);
      else if(t.panel==='files')appBody.innerHTML=caFilesHtml(filesState);
      else if(t.panel==='remote')appBody.innerHTML=caRemoteHtml(remoteState);
      else appBody.innerHTML=caExplorerHtml(items);
    }
    resetVisual();
    btn.addEventListener('click',async()=>{
      btn.disabled=true;
      resetVisual();
      bodyTerm.innerHTML='';
      const reduced=caReduced();
      const notes=[];
      for(const step of (t.steps||[])){
        if(step.t==='type')await caType(bodyTerm,step.s,reduced);
        else if(step.t==='out')await caOut(bodyTerm,step.s,reduced);
        else if(step.t==='pause'){if(!reduced)await caWait(step.ms||500);}
        else if(step.t==='note'){
          if(reduced){notes.push(step.s);noteEl.innerHTML=notes.map(escapeHTML).join('<br>');}
          else noteEl.innerHTML=escapeHTML(step.s);
        }
        else if(step.t==='fx'){
          switch(t.panel){
            case 'repo':await caApplyRepoFx(appBody,repoState,step,reduced);break;
            case 'files':await caApplyFilesFx(appBody,filesState,step,reduced);break;
            case 'remote':await caApplyRemoteFx(appBody,remoteState,step,reduced);break;
            default:await caApplyExplorerFx(appBody,items,step,reduced,titleEl);
          }
        }
      }
      btn.disabled=false;btn.textContent='⟲ Ще раз';
    });
  });
}

/* === 12c. ДАНІ ПРАКТИКУМУ === */
const TERMLAB={
  tl_pbip_init:{
    title:`Перший репозиторій для PBIP-проєкту`,
    task:`Ти зберіг звіт як PBIP: у папці лежать <code>report.pbip</code> і <code>definition/model.tmdl</code>, але Git про них ще не знає. Перетвори папку на репозиторій і зроби перший коміт з усіма файлами.`,
    init:{initialized:false,files:{'report.pbip':'untracked','definition/model.tmdl':'untracked'}},
    goal:{initialized:true,headOn:'main',commitsAtLeast:1,fileStatus:{'report.pbip':'clean','definition/model.tmdl':'clean'}},
    hints:[`Спершу репозиторій має зʼявитися: одна команда. Потім — стандартний шлях зміни: staging → коміт.`,`git init → git add . → git commit -m "..."`],
    sol:[`git init`,`git add .`,`git commit -m "перша версія звіту"`],
    ok:`Репозиторій створено, обидва файли в історії. Тепер кожна зміна звіту може стати комітом.`},
  tl_status_flow:{
    title:`Два осмислені коміти замість одного великого`,
    task:`Ти змінив модель (<code>definition/model.tmdl</code>) і додав нову таблицю (<code>definition/tables/Sales.tmdl</code>). Зроби ДВА окремі коміти: спершу зміни моделі, потім нову таблицю — щоб в історії було видно, що і навіщо змінилось.`,
    init:{files:{'definition/model.tmdl':'modified','definition/tables/Sales.tmdl':'untracked'}},
    goal:{commitsAtLeast:3,fileStatus:{'definition/model.tmdl':'clean','definition/tables/Sales.tmdl':'clean'}},
    hints:[`git add вміє брати один конкретний файл — цим і користуйся.`,`git add definition/model.tmdl → git commit → git add definition/tables/Sales.tmdl → git commit`],
    sol:[`git add definition/model.tmdl`,`git commit -m "оновлення моделі"`,`git add definition/tables/Sales.tmdl`,`git commit -m "нова таблиця Sales"`],
    ok:`Дві логічні зміни — два коміти. Колега (і ти через місяць) скаже дякую.`},
  tl_partial_stage:{
    title:`Закомітити лише частину змін`,
    task:`Змінені два файли: <code>definition/model.tmdl</code> (нова міра — готова) і <code>diagramLayout.json</code> (просто посовав таблички на діаграмі — комітити не хочеш). Закоміть ЛИШЕ зміну моделі; diagramLayout.json має лишитися незакоміченим.`,
    init:{files:{'definition/model.tmdl':'modified','diagramLayout.json':'modified'}},
    goal:{commitsExactly:2,fileStatus:{'definition/model.tmdl':'clean','diagramLayout.json':'modified'}},
    hints:[`Не використовуй git add . — він забере все.`,`git add definition/model.tmdl → git commit -m "..."`],
    sol:[`git add definition/model.tmdl`,`git commit -m "нова міра Total Sales"`],
    ok:`Staging — це фільтр: у коміт пішло тільки те, що ти свідомо вибрав.`},
  tl_branch_kpi:{
    title:`Гілка для нових KPI-карток`,
    task:`Керівник просить нові KPI-картки. У тебе вже змінений <code>report/pages/kpi/visual.json</code>. Створи гілку <code>feature/kpi-cards</code>, перейди на неї й закоміть зміну там. main чіпати не можна.`,
    init:{files:{'report/pages/kpi/visual.json':'modified'}},
    goal:{branch:'feature/kpi-cards',headOn:'feature/kpi-cards',branchAt:{main:'C1'},fileStatus:{'report/pages/kpi/visual.json':'clean'},commitsAtLeast:2},
    hints:[`Створити гілку і перейти на неї можна однією командою.`,`git switch -c feature/kpi-cards, далі add + commit`],
    sol:[`git switch -c feature/kpi-cards`,`git add report/pages/kpi/visual.json`,`git commit -m "KPI-картки"`],
    ok:`Фіча живе у своїй гілці, main стабільна — саме так працює команда.`},
  tl_ff_merge:{
    title:`Fast-forward: main просто доганяє`,
    task:`Гілка <code>feature/date-table</code> пішла на два коміти вперед, а в main нових комітів немає. Влий фічу в main. Зверни увагу: merge-коміт не зʼявиться — main просто «доїде» вперед.`,
    init:{commits:[{id:'C1',msg:`базова модель`},{id:'C2',p:['C1'],br:'feature/date-table',msg:`таблиця дат`},{id:'C3',p:['C2'],br:'feature/date-table',msg:`звʼязки таблиці дат`}],branches:{main:'C1','feature/date-table':'C3'},head:'main'},
    goal:{merged:{from:'feature/date-table',into:'main'},headOn:'main',lastCommitParents:1},
    hints:[`Merge виконують СТОЯЧИ на гілці, КУДИ вливаєш. Ти вже на main.`,`git merge feature/date-table`],
    sol:[`git merge feature/date-table`],
    ok:`Fast-forward: main пересунулась на C3 без нового коміту, бо власних комітів у неї не було.`},
  tl_merge_commit:{
    title:`Merge-коміт: гілки розійшлися`,
    task:`Поки ти робив KPI-картки у <code>feature/kpi-cards</code>, у main зʼявився коміт колеги. Гілки розійшлися. Влий фічу в main — цього разу Git створить merge-коміт із двома батьками.`,
    init:{commits:[{id:'C1',msg:`базова модель`},{id:'C2',p:['C1'],msg:`хедер звіту (колега)`},{id:'C3',p:['C1'],br:'feature/kpi-cards',msg:`KPI-картки`}],branches:{main:'C2','feature/kpi-cards':'C3'},head:'main'},
    goal:{merged:{from:'feature/kpi-cards',into:'main'},headOn:'main',lastCommitParents:2},
    hints:[`Команда та сама, що і при fast-forward, — Git сам вирішує, який тип злиття потрібен.`,`git merge feature/kpi-cards`],
    sol:[`git merge feature/kpi-cards`],
    ok:`M1 має двох батьків — C2 і C3. Обидві лінії роботи збережені в історії.`},
  tl_merge_conflict:{
    title:`Конфлікт у model.tmdl`,
    task:`Ти і колега змінили ОДНУ й ту саму міру: ти — в main, колега — у <code>feature/new-calc</code>. Спробуй влити гілку, отримай конфлікт у <code>definition/model.tmdl</code> і розвʼяжи його: відредагуй файл, додай у staging і заверши merge комітом.`,
    init:{commits:[{id:'C1',msg:`базова модель`},{id:'C2',p:['C1'],msg:`твоя версія міри`,files:['definition/model.tmdl']},{id:'C3',p:['C1'],br:'feature/new-calc',msg:`версія міри колеги`,files:['definition/model.tmdl']}],branches:{main:'C2','feature/new-calc':'C3'},head:'main',files:{'definition/model.tmdl':'clean'}},
    goal:{merged:{from:'feature/new-calc',into:'main'},lastCommitParents:2,fileStatus:{'definition/model.tmdl':'clean'}},
    hints:[`Конфлікт — не помилка, а питання: «яку версію лишити?». Відповідаєш ти, редагуючи файл.`,`git merge feature/new-calc → edit definition/model.tmdl → git add definition/model.tmdl → git commit`],
    sol:[`git merge feature/new-calc`,`edit definition/model.tmdl`,`git add definition/model.tmdl`,`git commit`],
    ok:`Конфлікт розвʼязано свідомо: ти сам вирішив, яка формула міри правильна. Це і є суть merge-конфлікту.`},
  tl_merge_abort:{
    title:`Merge --abort: конфлікт — не зобовʼязання`,
    task:`Ти починаєш зливати експериментальну гілку <code>feature/experiment</code> — і отримуєш конфлікт у <code>definition/model.tmdl</code>. Розбиратися з ним зараз не час. Скасуй злиття командою <code>git merge --abort</code> — робоча тека має повернутися до чистого стану, а main лишитися на своєму коміті.`,
    init:{commits:[{id:'C1',msg:`базова модель`},{id:'C2',p:['C1'],msg:`стабільна версія міри`,files:['definition/model.tmdl']},{id:'C3',p:['C1'],br:'feature/experiment',msg:`експеримент з мірою`,files:['definition/model.tmdl']}],branches:{main:'C2','feature/experiment':'C3'},head:'main',files:{'definition/model.tmdl':'clean'}},
    goal:{conflictSeen:true,mergeAborted:true,branchAt:{main:'C2'},headOn:'main',fileStatus:{'definition/model.tmdl':'clean'}},
    hints:[`Спершу спровокуй конфлікт звичайним merge — потім скасуй його.`,`git merge feature/experiment → git merge --abort`],
    sol:[`git merge feature/experiment`,`git merge --abort`],
    ok:`Злиття скасовано без сліду: файли чисті, main на місці. Конфлікт можна відкласти — це нормальна робоча опція.`},
  tl_detached_rescue:{
    title:`Порятунок коміту з detached HEAD`,
    task:`Ти перемкнувся на старий коміт «подивитись, як було», зробив там новий коміт C3 — і тепер HEAD відірваний (detached), а C3 не належить жодній гілці. Врятуй його: створи гілку <code>rescue</code> на цьому коміті й повернись на main.`,
    init:{commits:[{id:'C1',msg:`перша версія`},{id:'C2',p:['C1'],msg:`друга версія`},{id:'C3',p:['C1'],col:'feat2',lane:1,msg:`експеримент зі старої версії`}],branches:{main:'C2'},head:{detached:'C3'}},
    goal:{branchAt:{rescue:'C3'},headOn:'main',headDetached:false},
    hints:[`Гілка — це просто іменований вказівник на коміт. Постав його, поки стоїш на C3.`,`git branch rescue → git switch main`],
    sol:[`git branch rescue`,`git switch main`],
    ok:`C3 тепер тримається за гілку rescue і не загубиться. Detached HEAD безпечний, якщо знати цей трюк.`},
  tl_restore_file:{
    title:`Відкинути незакомічені зміни`,
    task:`Ти експериментував із формулою міри в <code>definition/model.tmdl</code> і зрозумів, що все зіпсував. Коміту ще не було. Поверни файл до останньої закоміченої версії.`,
    init:{files:{'definition/model.tmdl':'modified'}},
    goal:{commitsExactly:1,fileStatus:{'definition/model.tmdl':'clean'}},
    hints:[`Потрібна команда, що «відновлює» файл з останнього коміту.`,`git restore definition/model.tmdl`],
    sol:[`git restore definition/model.tmdl`],
    ok:`Зміни відкинуто, файл як у останньому коміті. Обережно: restore незворотний для незакомічених правок.`},
  tl_unstage:{
    title:`Прибрати зайве зі staging`,
    task:`Ти випадково виконав <code>git add cache.abf</code> — а це кеш даних, його НЕ комітять. Прибери файл зі staging так, щоб він лишився на диску (стане знову untracked).`,
    init:{files:{'cache.abf':'stagedNew'}},
    goal:{commitsExactly:1,fileStatus:{'cache.abf':'untracked'}},
    hints:[`Це «протилежність git add». Файл видаляти не треба.`,`git restore --staged cache.abf`],
    sol:[`git restore --staged cache.abf`],
    ok:`Файл вийшов зі staging, але лишився на диску. Наступний крок у житті — додати його в .gitignore.`},
  tl_reset_soft:{
    title:`Скасувати передчасний коміт, зберігши зміни`,
    task:`Ти закомітив зміну моделі з повідомленням «wip» — занадто рано і з поганим описом. Коміт ще НЕ запушений. Скасуй його так, щоб зміни лишилися у staging — готові до нормального коміту.`,
    init:{commits:[{id:'C1',msg:`базова модель`},{id:'C2',p:['C1'],msg:`wip`,files:['definition/model.tmdl']}],branches:{main:'C2'},files:{'definition/model.tmdl':'clean'}},
    goal:{commitsExactly:1,fileStatus:{'definition/model.tmdl':'staged'}},
    hints:[`reset має три режими; тобі потрібен той, що НЕ чіпає staging.`,`git reset --soft HEAD~1`],
    sol:[`git reset --soft HEAD~1`],
    ok:`Коміт зник, зміни в staging. --soft — найлагідніший режим reset. Для запушених комітів так робити не можна.`},
  tl_revert_shared:{
    title:`Скасувати запушений коміт безпечно`,
    task:`Останній коміт зламав міру, і він УЖЕ на сервері — історію переписувати не можна. Зроби коміт-скасування і відправ його на сервер.`,
    init:{commits:[{id:'C1',msg:`базова модель`},{id:'C2',p:['C1'],msg:`заміна формули маржі`,files:['definition/model.tmdl']}],branches:{main:'C2'},remote:{main:'C2'}},
    goal:{lastMsgMatch:'^Revert',pushed:true,commitsAtLeast:3},
    hints:[`Для спільної історії — тільки revert: він ДОДАЄ новий коміт, а не стирає старий.`,`git revert HEAD → git push`],
    sol:[`git revert HEAD`,`git push`],
    ok:`Історія не переписана: C2 лишився, але його вплив скасовано новим комітом. Сервер прийняв push без конфліктів.`},
  tl_stash_switch:{
    title:`Stash: терміновий фікс посеред роботи`,
    task:`Ти працюєш у <code>feature/kpi-cards</code> з незакоміченими правками у <code>visual.json</code>, аж тут — терміновий фікс у main. Git не пустить перемкнутися: цей файл відрізняється між гілками, і перемикання перезаписало б твої незбережені правки (саме в такому разі Git блокує switch; якби файл між гілками не відрізнявся — Git перемкнув би гілку й просто переніс правки з собою). Сховай зміни у stash, перейди на main, зроби фікс у <code>definition/model.tmdl</code> (edit → add → commit), повернись у свою гілку й дістань зміни зі stash.`,
    init:{commits:[{id:'C1',msg:`база`},{id:'C2',p:['C1'],br:'feature/kpi-cards',msg:`початок KPI-карток`,files:['report/pages/kpi/visual.json']}],branches:{main:'C1','feature/kpi-cards':'C2'},head:'feature/kpi-cards',files:{'report/pages/kpi/visual.json':'modified','definition/model.tmdl':'clean'}},
    goal:{stashEmpty:true,headOn:'feature/kpi-cards',branchCommitsAtLeast:{main:2},fileStatus:{'report/pages/kpi/visual.json':'modified','definition/model.tmdl':'clean'}},
    hints:[`Спробуй git switch main одразу — побачиш, чому потрібен stash.`,`git stash → git switch main → edit definition/model.tmdl → git add … → git commit -m "…" → git switch feature/kpi-cards → git stash pop`],
    sol:[`git stash`,`git switch main`,`edit definition/model.tmdl`,`git add definition/model.tmdl`,`git commit -m "терміновий фікс міри"`,`git switch feature/kpi-cards`,`git stash pop`],
    ok:`Фікс у main зроблено, а твоя незавершена робота повернулася зі stash цілою. Класичний робочий сценарій.`},
  tl_first_push:{
    title:`Відправити коміти на сервер`,
    task:`Локально ти зробив два коміти, а сервер (Azure DevOps) досі бачить лише перший. Подивись <code>git status</code> — і синхронізуй сервер зі своєю роботою.`,
    init:{commits:[{id:'C1',msg:`перша версія`},{id:'C2',p:['C1'],msg:`нова міра`},{id:'C3',p:['C2'],msg:`формат карток`}],branches:{main:'C3'},remote:{main:'C1'},tracking:{main:'C1'}},
    goal:{pushed:true},
    hints:[`status підкаже: ahead of origin/main by 2 commits.`,`git push`],
    sol:[`git push`],
    ok:`Сервер отримав C2 і C3. Тепер Git sync у Fabric зможе підтягнути ці зміни в робочу область.`},
  tl_branch_push:{
    title:`Перший push нової гілки`,
    task:`Ти створив гілку <code>feature/refresh-fix</code> і зробив у ній коміт. На сервері цієї гілки ще немає — простий <code>git push</code> відмовить. Опублікуй гілку на сервері.`,
    init:{commits:[{id:'C1',msg:`база`},{id:'C2',p:['C1'],br:'feature/refresh-fix',msg:`фікс оновлення даних`}],branches:{main:'C1','feature/refresh-fix':'C2'},head:'feature/refresh-fix',remote:{main:'C1'}},
    goal:{remoteBranch:'feature/refresh-fix',pushed:true},
    hints:[`Спробуй просто git push — Git сам підкаже повну команду.`,`git push -u origin feature/refresh-fix`],
    sol:[`git push -u origin feature/refresh-fix`],
    ok:`Гілка тепер на сервері, і Git запамʼятав звʼязок (-u): наступного разу вистачить простого git push.`},
  tl_fetch_pull:{
    title:`Fetch, потім pull: спершу подивитись, потім забрати`,
    task:`Колега запушив новий коміт. Спершу виконай <code>git fetch</code> — побачиш на схемі, що origin/main пішов уперед, а твої файли ще не змінились. Потім забери зміни собі.`,
    init:{commits:[{id:'C1',msg:`база`},{id:'C2',p:['C1'],msg:`твоя робота`},{id:'C3',p:['C2'],known:false,msg:`нова таблиця (колега)`}],branches:{main:'C2'},remote:{main:'C3'},tracking:{main:'C2'}},
    goal:{branchAt:{main:'C3'},headOn:'main'},
    hints:[`fetch = «дізнатися», pull = «дізнатися і застосувати».`,`git fetch → git pull`],
    sol:[`git fetch`,`git pull`],
    ok:`Fetch показав відставання, pull докотив main до C3 fast-forwardом. Безпечна пара команд перед початком роботи.`},
  tl_push_reject:{
    title:`Відхилений push: розвʼязка через pull --rebase`,
    task:`Ти закомітив C2, але колега встиг запушити свій коміт раніше. Спробуй <code>git push</code> — отримаєш відмову non-fast-forward. Виправ ситуацію так, щоб історія лишилась ЛІНІЙНОЮ (без merge-коміту), і допуш свою роботу.`,
    init:{commits:[{id:'C1',msg:`база`},{id:'C2',p:['C1'],msg:`твоя міра`},{id:'C3',p:['C1'],known:false,msg:`коміт колеги`}],branches:{main:'C2'},remote:{main:'C3'},tracking:{main:'C1'}},
    goal:{pushed:true,noMergeCommits:true,commitsAtLeast:3},
    hints:[`Сервер не приймає, бо в нього є коміт, якого немає в тебе. Забери його так, щоб твій коміт «переграв» поверх.`,`git push (відмова) → git pull --rebase → git push`],
    sol:[`git push`,`git pull --rebase`,`git push`],
    ok:`Твій C2 став C2′ поверх коміту колеги — історія лінійна, push пройшов. Стандартна розвʼязка для команд.`},
  tl_conflict_two_files:{
    title:`Подвійний конфлікт: модель і візуал одночасно`,
    task:`Редизайн у гілці <code>feature/redesign</code> зачепив і модель, і сторінку звіту — а в main тим часом змінили ті самі файли. Влий гілку: конфлікт виникне ОДРАЗУ у двох файлах — <code>definition/model.tmdl</code> і <code>report/pages/main/visual.json</code>. Розвʼяжи кожен (edit → add) і заверши злиття комітом.`,
    init:{commits:[{id:'C1',msg:`база`},{id:'C2',p:['C1'],msg:`правки в main`,files:['definition/model.tmdl','report/pages/main/visual.json']},{id:'C3',p:['C1'],br:'feature/redesign',msg:`редизайн`,files:['definition/model.tmdl','report/pages/main/visual.json']}],branches:{main:'C2','feature/redesign':'C3'},head:'main',files:{'definition/model.tmdl':'clean','report/pages/main/visual.json':'clean'}},
    goal:{merged:{from:'feature/redesign',into:'main'},lastCommitParents:2,conflictSeen:true,fileStatus:{'definition/model.tmdl':'clean','report/pages/main/visual.json':'clean'}},
    hints:[`Git перерахує ВСІ конфліктні файли у виводі merge. Кожен розвʼязується окремо: edit → add. Коміт пройде лише коли розвʼязані всі.`,`git merge feature/redesign → edit + add для КОЖНОГО з двох файлів → git commit`],
    sol:[`git merge feature/redesign`,`edit definition/model.tmdl`,`git add definition/model.tmdl`,`edit report/pages/main/visual.json`,`git add report/pages/main/visual.json`,`git commit`],
    ok:`Обидва конфлікти розвʼязано, merge-коміт створено. Git не дасть закомітити, поки лишається хоч один нерозвʼязаний файл — тепер ти це бачив на власні очі.`},
  tl_pull_rebase_conflict:{
    title:`Rebase-конфлікт: ви з колегою чіпали один файл`,
    task:`Найжорсткіший сценарій синхронізації: твій незапушений коміт і свіжий коміт колеги на сервері змінюють ОДИН файл — <code>definition/model.tmdl</code>. Спробуй push (відмова), зроби <code>git pull --rebase</code> — реплей зупиниться конфліктом (could not apply). Розвʼяжи його (edit → add), заверши <code>git rebase --continue</code> і допуш. Історія має лишитися лінійною.`,
    init:{commits:[{id:'C1',msg:`база`},{id:'C2',p:['C1'],msg:`твоя правка міри`,files:['definition/model.tmdl']},{id:'C3',p:['C1'],known:false,msg:`колега теж чіпав модель`,files:['definition/model.tmdl']}],branches:{main:'C2'},remote:{main:'C3'},tracking:{main:'C1'},files:{'definition/model.tmdl':'clean'}},
    goal:{pushed:true,noMergeCommits:true,conflictSeen:true,commitsAtLeast:3,fileStatus:{'definition/model.tmdl':'clean'}},
    hints:[`Під час rebase конфлікт завершують НЕ комітом: edit → git add → git rebase --continue.`,`git push → git pull --rebase → edit definition/model.tmdl → git add definition/model.tmdl → git rebase --continue → git push`],
    sol:[`git push`,`git pull --rebase`,`edit definition/model.tmdl`,`git add definition/model.tmdl`,`git rebase --continue`,`git push`],
    ok:`Твій коміт переграно поверх коміту колеги з розвʼязаним конфліктом — історія лінійна, push пройшов. Це вершина щоденної синхронізації.`},
  tl_final_capstone:{
    title:`Фінальний бос: повний цикл фічі`,
    task:`Усе разом, як у реальній команді. Репозиторій склоновано з сервера, у тебе змінені <code>report/pages/main/visual.json</code> і <code>definition/model.tmdl</code>. Зроби: гілку <code>feature/report-header</code> → два окремі коміти (спершу visual, потім model) → повернись на main → влий фічу → відправ на сервер. Далі в житті Git sync опублікує зміни в робочу область.`,
    init:{commits:[{id:'C1',msg:`стан робочої області`}],branches:{main:'C1'},remote:{main:'C1'},files:{'report/pages/main/visual.json':'modified','definition/model.tmdl':'modified'}},
    goal:{merged:{from:'feature/report-header',into:'main'},headOn:'main',pushed:true,commitsAtLeast:3,commitsOnBranch:{branch:'feature/report-header',atLeast:2},fileStatus:{'report/pages/main/visual.json':'clean','definition/model.tmdl':'clean'}},
    hints:[`Порядок: switch -c → add+commit → add+commit → switch main → merge → push.`,`git switch -c feature/report-header → git add report/pages/main/visual.json → git commit -m "…" → git add definition/model.tmdl → git commit -m "…" → git switch main → git merge feature/report-header → git push`],
    sol:[`git switch -c feature/report-header`,`git add report/pages/main/visual.json`,`git commit -m "новий хедер звіту"`,`git add definition/model.tmdl`,`git commit -m "міра для хедера"`,`git switch main`,`git merge feature/report-header`,`git push`],
    ok:`Повний цикл пройдено: фіча в гілці → merge у main → push. Саме цей потік команда повторює щодня; Git sync далі публікує main у робочу область.`}
};
Object.assign(PLAYERS,{
  pr_dag:[
    {cap:`Кожен коміт зберігає посилання на свого батька: C3 знає про C2, C2 — про C1. Цей ланцюг і є історією проєкту.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]},
    {cap:`Тому «вставити коміт у середину» неможливо: зміниться батько — зміниться і сам коміт (у нього буде інший підпис-SHA). Пунктирний X так і залишиться відгалуженням збоку, а не частиною ланцюга. Історію додають лише зверху.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD']),N('X',1,'feat2',['C1'],[],true),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ],
  pr_ff_vs_merge:[
    {cap:`Ситуація А: після розгалуження main НЕ має власних нових комітів. Якщо зараз влити feature, main просто «доїде» до C3 — це fast-forward, новий коміт не потрібен.`,nodes:[N('C3',1,'feature',['C2'],['feature']),N('C2',1,'feature',['C1']),N('C1',0,'main',[],['main','HEAD'])]},
    {cap:`Ситуація Б: у main зʼявився власний C4. Гілки розійшлися — fast-forward неможливий: main не може «доїхати» вперед по прямій, бо її лінія вже пішла вбік.`,nodes:[N('C4',0,'main',['C1'],['main','HEAD']),N('C3',1,'feature',['C2'],['feature']),N('C2',1,'feature',['C1']),N('C1',0,'main',[])]},
    {cap:`Тому git merge створює merge-коміт M1 із ДВОМА батьками — C4 і C3. Обидві лінії історії збережено, нічого не втрачено.`,nodes:[N('M1',0,'merge',['C4','C3'],['main','HEAD']),N('C4',0,'main',['C1']),N('C3',1,'feature',['C2'],['feature']),N('C2',1,'feature',['C1']),N('C1',0,'main',[])]}
  ],
  pr_reset_vs_revert:[
    {cap:`Початок: коміт C3 зламав міру (позначений bad). Треба прибрати його вплив. Є два шляхи — reset і revert. Порівняй наступні кроки.`,nodes:[N('C3',0,'main',['C2'],['main','HEAD','bad']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]},
    {cap:`Шлях 1 — git reset --hard HEAD~1: вказівник main відʼїхав назад на C2, а C3 осиротів (пунктир). Історію ПЕРЕПИСАНО. Небезпечно, якщо C3 уже на сервері: твоя історія розійдеться з серверною.`,nodes:[N('C3',0,'main',['C2'],[],true),N('C2',0,'main',['C1'],['main','HEAD']),N('C1',0,'main',[])]},
    {cap:`Шлях 2 — git revert HEAD: історія НЕ переписується — зверху додається C4, який скасовує зміни C3. Безпечно для спільних гілок і для гілки, яку Git sync тягне в робочу область Fabric.`,nodes:[N('C4',0,'main',['C3'],['main','HEAD']),N('C3',0,'main',['C2'],['bad']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ],
  pr_sync_state:[
    {cap:`Стан після git fetch: локальна main стоїть на C2, а origin/main (твоє знання про сервер) — уже на C4. Ти позаду на два коміти. Файли на диску ще НЕ змінились — fetch лише оновив інформацію.`,nodes:[N('C4',0,'main',['C3'],['origin/main']),N('C3',0,'main',['C2']),N('C2',0,'main',['C1'],['main','HEAD']),N('C1',0,'main',[])]},
    {cap:`git pull = fetch + злиття. Локальних власних комітів немає, тому main просто доїжджає до C4 (fast-forward). Тепер локально і на сервері — однакова історія.`,nodes:[N('C4',0,'main',['C3'],['main','HEAD','origin/main']),N('C3',0,'main',['C2']),N('C2',0,'main',['C1']),N('C1',0,'main',[])]}
  ]
});
Object.assign(QCHECKS,{
  qc_pr_parents:{q:`На схемі вище C3 посилається на C2. Колега пропонує: «додаймо коміт МІЖ C1 і C2, щоб виправити стару помилку». Що на це скаже Git?`,
    opts:[`Так не вийде: новий батько означає інший коміт — C2 і C3 довелося б створити заново; історію додають лише зверху`,`Вийде: команда git insert додає коміт у потрібне місце ланцюга`,`Вийде: треба перейти на C1 у detached HEAD і закомітити — коміт стане між C1 і C2`,`Так не вийде, бо старі коміти в Git не можна змінити взагалі нічим, навіть rebase`],
    correct:0,why:`Коміт містить посилання на батька, тому «вставка в середину» = переписування всього ланцюга далі. Коміт із detached HEAD створив би відгалуження ЗБОКУ, а не вставку. А rebase якраз і переписує історію — створюючи нові коміти.`},
  qc_pr_ffwhen:{q:`Подивись на ситуацію Б на схемі вище. Чому саме тут fast-forward при git merge feature неможливий?`,
    opts:[`Бо в main зʼявився власний коміт C4, якого немає у feature — «доїхати вперед по прямій» уже не можна`,`Бо у feature два коміти, а fast-forward працює лише з одним`,`Бо fast-forward можливий тільки одразу після git fetch`,`Бо гілку feature вже зливали раніше, а двічі та сама гілка не зливається`],
    correct:0,why:`Fast-forward можливий, лише коли поточна гілка є прямим предком тієї, що вливається. Кількість комітів, fetch і повторні злиття тут ні до чого.`},
  qc_pr_undo_choice:{q:`Гілка main синхронізується з робочою областю Fabric (Git sync), і поганий коміт УЖЕ запушено. Як правильно прибрати його вплив?`,
    opts:[`git revert: новий коміт-скасування — історія не переписується, push пройде, Git sync спокійно підхопить`,`git reset --hard HEAD~1 і git push: сервер прийме, бо локальна історія головніша`,`Виправити файли вручну прямо в робочій області Fabric — Git сам підтягне зміну назад у репозиторій`,`git stash: сховати поганий коміт зі спільної історії`],
    correct:0,why:`Переписану reset-ом історію сервер відхилить (non-fast-forward). Правка у Fabric не потрапить у Git САМА: вона зʼявиться на вкладці Source control як Uncommitted, і поки її не закомітять або не скасують, гілка й робоча область розходяться (тому «правда живе в Git» — правити краще через Desktop/Git). Stash працює з незакоміченими змінами, а не з комітами. Лишається revert.`},
  qc_pr_pull_read:{q:`На першому кадрі схеми вище (стан одразу після fetch) origin/main стоїть на C4, локальна main — на C2, своїх нових комітів у тебе немає. Що зробить git pull?`,
    opts:[`Fast-forward: main доїде до C4 без merge-коміту, бо локальних власних комітів немає`,`Створить merge-коміт M1 — pull завжди зливає дві гілки через merge`,`Відмовить: спершу треба запушити щось своє`,`Мовчки перезапише локальні незакомічені зміни серверною версією`],
    correct:0,why:`pull = fetch + злиття. Коли локальна гілка — прямий предок серверної, злиття вироджується у fast-forward. Merge-коміт зʼявився б, лише якби історії розійшлися.`}
});
Object.assign(QUIZ,{
  prA:[
    {q:`Прочитай вивід:<pre>$ git status
On branch main
Changes to be committed:
        new file:   definition/tables/Calendar.tmdl
Changes not staged for commit:
        modified:   definition/model.tmdl
Untracked files:
        report/pages/new/page.json</pre>Що увійде в коміт, якщо зараз виконати <code>git commit -m "..."</code>?`,
     opts:[`Лише Calendar.tmdl — тільки він у staging (Changes to be committed)`,`Calendar.tmdl і model.tmdl — обидва ж змінені`,`Усі три файли — commit завжди забирає всі зміни в папці`,`Нічого: спершу обовʼязково потрібен git push`],
     correct:0,why:`У коміт потрапляє лише вміст staging. model.tmdl змінений, але не доданий (git add), а page.json Git взагалі ще не відстежує.`},
    {q:`Прочитай вивід:<pre>$ git log --oneline
C5 (HEAD -> main) нове форматування мір
C4 (origin/main) виправлення звʼязку
C3 перша версія моделі</pre>Скільки комітів відправиться на сервер після <code>git push</code>?`,
     opts:[`Один — C5: мітка origin/main показує, що сервер уже має C4 і все давніше`,`Два — C5 і C4`,`Три — push щоразу відправляє всю історію заново`,`Нуль — push відправляє лише вміст staging, а він порожній`],
     correct:0,why:`origin/main — це твоє знання про сервер: він стоїть на C4. Отже, серверу бракує лише C5. Push передає саме відсутні коміти, а staging тут ні до чого.`},
    {q:`Ти змінив model.tmdl, одразу виконав <code>git commit -m "нова міра"</code> і побачив:<pre>no changes added to commit (use "git add")</pre>Що сталося?`,
     opts:[`Пропущено крок git add — зміни лишились у робочій директорії, staging порожній, коміт не створено`,`Файл завеликий, Git відмовився його комітити`,`Локальна історія застаріла — спершу потрібен git pull`,`Коміт створився, але порожній — тепер треба git commit --amend`],
     correct:0,why:`Шлях зміни завжди триетапний: робоча директорія → git add (staging) → git commit. Без add комітити нічого.`}
  ],
  prB:[
    {q:`Прочитай граф:<pre>$ git log --oneline --graph
*   M1 (HEAD -> main) Merge branch 'feature/kpi'
|\\
| * C4 (feature/kpi) картки KPI
* | C3 хедер звіту
|/
* C2 базова модель</pre>Який коміт є merge-комітом і хто його батьки?`,
     opts:[`M1; його батьки — C3 і C4`,`C4; його батько — C2`,`C3; його батьки — C2 і C4`,`C2; він — батько всіх, отже merge-коміт`],
     correct:0,why:`Merge-коміт — той, у якого ДВА батьки: остання вершина main (C3) і вершина влитої гілки (C4). На графі до M1 сходяться дві лінії.`},
    {q:`Ти виконав <code>git merge feature/kpi</code> у main. Що тепер із самою гілкою feature/kpi?`,
     opts:[`Нічого не зникло: вказівник feature/kpi так само стоїть на своєму останньому коміті — гілку можна видалити або продовжити роботу`,`Git автоматично видалив її одразу після злиття`,`Вона переїхала на merge-коміт разом із main`,`Вона стала прихованою, дістати її можна лише через git reflog`],
     correct:0,why:`merge рухає лише ту гілку, НА якій ти стоїш. Гілка-джерело залишається на місці, поки ти сам її не видалиш (git branch -d) або не додаси в неї нові коміти.`},
    {q:`Чим <code>git switch -c feature/x</code> відрізняється від <code>git branch feature/x</code>?`,
     opts:[`switch -c створює гілку І одразу переходить на неї; branch лише створює вказівник — HEAD лишається де був`,`branch створює гілку на сервері, а switch -c — локально`,`switch -c працює тільки з гілками, які вже існують`,`Нічим — це два написання однієї команди`],
     correct:0,why:`Класична пастка: після git branch ти ще на старій гілці, і наступний коміт піде НЕ у нову гілку. switch -c робить обидва кроки одразу.`}
  ],
  prC:[
    {q:`Ти випадково зробив <code>git reset --hard HEAD~1</code> і «втратив» коміт. Дивишся reflog:<pre>$ git reflog
c93e1a0 HEAD@{0}: reset: moving to HEAD~1
7b42d8f HEAD@{1}: commit: розрахунок маржі
c93e1a0 HEAD@{2}: commit: базова модель</pre>Яка команда поверне коміт «розрахунок маржі»?`,
     opts:[`git reset --hard 7b42d8f — повернути HEAD на стан, де коміт ще існував`,`git reset --hard c93e1a0 — це ж найсвіжіший запис угорі`,`git revert 7b42d8f — revert повертає коміти`,`git pull — сервер автоматично відновить втрачене`],
     correct:0,why:`У reflog зліва — SHA коміту, ДЕ ОПИНИВСЯ HEAD після дії. Верхній запис показує, що після reset HEAD знову на c93e1a0 «базова модель» (той самий SHA, що й у HEAD@{2}) — reset НЕ породжує нового коміту. Щоб повернути «розрахунок маржі», йди на 7b42d8f. revert створив би коміт-скасування (протилежне завдання), а сервер про твій локальний reset нічого не знає.`},
    {q:`Після <code>git reset --mixed HEAD~1</code> (або просто git reset HEAD~1) де опиняться зміни з відкоченого коміту?`,
     opts:[`У робочій директорії як незакомічені зміни — ПОЗА staging`,`У staging, одразу готові до нового коміту`,`Зникнуть безслідно, як при --hard`,`Автоматично переїдуть у stash`],
     correct:0,why:`Три режими reset: --soft лишає зміни у staging, --mixed (типовий) — у робочій директорії, --hard — стирає. Запамʼятай сходинки: soft → mixed → hard = staging → робоча папка → ніде.`},
    {q:`Ти виправив текст останнього коміту через <code>git commit --amend</code>, але цей коміт УЖЕ був запушений. Що станеться при наступному git push?`,
     opts:[`Відмова non-fast-forward: amend створив НОВИЙ коміт замість старого, твоя історія розійшлася з серверною`,`Push пройде: сервер розпізнає, що це той самий коміт із новим текстом`,`Push пройде, але повідомлення на сервері залишиться старим`,`Git автоматично зіллє два повідомлення в одне`],
     correct:0,why:`amend не «редагує» коміт, а створює інший (інший SHA). Сервер має старий, ти — новий: історії розійшлися. Правило: amend — лише для НЕзапушених комітів.`}
  ],
  prD:[
    {q:`Прочитай вивід:<pre>$ git push
To origin
 ! [rejected]        main -> main (non-fast-forward)
error: failed to push some refs to 'origin'</pre>Яка правильна реакція?`,
     opts:[`git pull (найкраще --rebase), переконатися, що все зібралося, і тоді git push`,`git push --force — моя версія свіжіша, сервер зобовʼязаний прийняти`,`Видалити гілку на сервері й запушити її заново`,`git reset --hard origin/main — відкинути свої коміти й почати спочатку`],
     correct:0,why:`Відмова означає: на сервері є чужі коміти, яких немає в тебе. Спершу забери їх (pull), потім віддай своє. --force затер би роботу колеги, а reset --hard знищив би твою.`},
    {q:`Після git fetch статус показує:<pre>Your branch is behind 'origin/main' by 2 commits.</pre>Що зараз із твоїми локальними ФАЙЛАМИ?`,
     opts:[`Ще нічого не змінилось: fetch лише оновив знання про сервер; файли зміняться після git pull`,`Файли вже оновлені до серверної версії`,`Файли тимчасово заблоковані до завершення синхронізації`,`Fetch уже створив merge-коміт із серверними змінами`],
     correct:0,why:`fetch — «розвідка»: він завантажує інформацію про нові коміти, але не чіпає ні файли, ні твої гілки. Саме тому fetch завжди безпечний.`},
    {q:`Колега: «забери собі проєкт PDP з Azure DevOps». Репозиторію на твоєму диску ще НЕМАЄ. Яка команда?`,
     opts:[`git clone <url> — перша повна копія репозиторію разом з усією історією`,`git pull <url> — стягнути останні зміни проєкту`,`git fetch <url> — дізнатися, що є на сервері`,`git init — створити порожній репозиторій, далі він синхронізується сам`],
     correct:0,why:`pull і fetch працюють УСЕРЕДИНІ вже наявного репозиторію. Коли його ще немає — тільки clone: він створює папку, історію і звʼязок з origin одразу.`}
  ],
  prE1:[
    {q:`Прочитай diff:<pre>--- a/definition/tables/Sales.tmdl
+++ b/definition/tables/Sales.tmdl
@@
-  lineageTag: 8f2c-11aa
+  lineageTag: 3ab1-90bc
@@
-  measure 'Total Sales' = SUM(Sales[Amount])
+  measure 'Total Sales' =
+      CALCULATE(SUM(Sales[Amount]), Sales[Status] = "Closed")</pre>Яке повідомлення коміту чесно описує цю зміну?`,
     opts:[`«Total Sales тепер рахує лише закриті продажі» — зміна формули і є суттю; lineageTag — технічний шум`,`«Оновлено lineageTag таблиці Sales» — це ж перший рядок diff`,`«Перейменовано таблицю Sales»`,`«Видалено міру Total Sales»`],
     correct:0,why:`У PBIP-diff завжди є технічний шум (lineageTag, ordinal тощо). Опис коміту має називати ЗМІСТОВНУ зміну — тут це нова умова фільтра у формулі DAX.`},
    {q:`Diff зачепив один рядок:<pre>-  displayFolder: Міри\\Продажі
+  displayFolder: Міри\\Фінанси</pre>Що реально зміниться для користувачів звіту?`,
     opts:[`Лише місце міри в папках панелі даних — усі розрахунки й числа залишаться тими самими`,`Формула міри тепер обчислюється інакше`,`Міра зникне з усіх візуалів звіту`,`Зміниться формат відображення чисел міри`],
     correct:0,why:`displayFolder — суто організаційна властивість (папка в списку полів). Уміння відрізняти «косметичні» рядки TMDL від змістовних — база читання PBIP-diff.`},
    {q:`Під час merge у файлі зʼявилося:<pre>measure 'Total Sales' =
&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD
    CALCULATE(SUM(Sales[Amount]), Sales[Status] = "Closed")
=======
    SUM(Sales[Amount]) * 1.2
&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/uplift</pre>Який фінальний вміст файлу правильний ПІСЛЯ розвʼязання конфлікту?`,
     opts:[`Одна погоджена формула, а всі рядки з <<<<<<<, ======= і >>>>>>> видалені`,`Обидві формули разом із маркерами — Git при коміті сам вибере потрібну`,`Залишити лише рядок ======= як розділювач двох версій`,`Порожня міра — конфліктний код завжди видаляють`],
     correct:0,why:`Маркери — це «підказки на полях», які Git вставив для тебе. Розвʼязати конфлікт = лишити одну робочу версію формули і прибрати ВСІ маркери. Файл із маркерами зламає модель.`},
    {q:`Прочитай два виводи:<pre>$ git log --oneline main..feature/dates
C7 звʼязок з календарем
C6 таблиця дат
$ git log --oneline feature/dates..main
(порожньо)</pre>Що зробить <code>git merge feature/dates</code>, якщо стояти на main?`,
     opts:[`Fast-forward: у main немає власних комітів після спільної бази, merge-коміт не потрібен`,`Створить merge-коміт, бо у feature/dates аж два коміти`,`Завершиться конфліктом: два коміти проти нуля`,`Нічого: гілки вже злиті`],
     correct:0,why:`main..feature — «що є у feature, чого немає в main» (два коміти). Зворотний діапазон порожній — отже main нічого свого не має і може просто доїхати вперед.`}
  ],
  prE2:[
    {q:`У Fabric на вкладці Source control одночасно горить «Update required» (у Git є новіша версія) і видно твої «Uncommitted changes». Який порядок дій правильний за принципом «Git — джерело правди»?`,
     opts:[`Спершу Update from Git — підтягнути новіше; потім переглянути свої зміни і закомітити те, що досі актуальне`,`Спершу закомітити все своє поверх, а Update можна й пропустити`,`Нічого не робити: Fabric синхронізує все сам за розкладом оновлення даних`,`Видалити робочу область і створити нову з Git — так надійніше`],
     correct:0,why:`Правда живе в Git: спочатку приймаєш новішу версію (Update from Git), потім дивишся, чи твої незбережені зміни ще потрібні, і комітиш їх. Розклад оновлення ДАНИХ із синхронізацією визначень не повʼязаний.`},
    {q:`Що з переліченого КОМІТИТЬСЯ в Git у PBIP-проєкті? (обери все правильне)`,multi:true,
     opts:[`Тека definition/ семантичної моделі (TMDL-файли)`,`Файл .pbip і файли звіту (report/…)`,`Файли .platform з метаданими елементів`,`cache.abf і localSettings.json`],
     correct:[0,1,2],why:`Визначення моделі та звіту і метадані .platform — це «рецепт» проєкту, вони і є вмістом репозиторію. cache.abf (локальний кеш даних) і localSettings.json — особисті локальні файли, їх додають у .gitignore.`},
    {q:`У гілці feature/big — велика недороблена фіча, і там само окремим комітом C8 уже лежить терміновий маленький фікс. main синхронізується з робочою областю (Git sync). Як доставити в прод ЛИШЕ фікс?`,
     opts:[`git switch main → git cherry-pick C8 → git push: у main поїде лише фікс, а недороблена фіча залишиться у feature/big`,`git merge feature/big у main як є — фікс же всередині, а недороблене нікому не заважатиме`,`git reset --hard C8 у main і force push`,`Скопіювати виправлені файли вручну в робочу область, оминаючи Git`],
     correct:0,why:`cherry-pick переносить ОДИН обраний коміт на іншу гілку — так в опублікований main потрапляє лише фікс. Merge всієї feature/big потягнув би в публікацію недороблене, reset+force переписав би спільну історію, а ручні правки в обхід Git розсинхронізують робочу область із репозиторієм.`}
  ]
});
Object.assign(ORDERS,{
  pr_or_release:{title:`Повний цикл релізу фічі в команді Power BI`,steps:[
    `git switch -c feature/nova-mira — окрема гілка для роботи`,
    `Правки в PBIP-файлах + git add + git commit (можна кілька разів)`,
    `git switch main і git pull — повернутись на свіжу main`,
    `git merge feature/nova-mira — влити готову фічу`,
    `git push — відправити main на сервер`,
    `Git sync (Update from Git) публікує зміни в робочу область`,
    `(Опційно) Deployment pipeline розкочує з Dev у Prod`]}
});
/* csim/order-покриття модулів 04–08 */
Object.assign(CSIM,{
cs_04_reset_soft:{t:`Скасуй останній коміт (<code>HEAD~1</code>) так, щоб усі його зміни лишились у staging.`,a:['^git reset --soft HEAD~1$','^git reset --soft HEAD~$','^git reset --soft HEAD\\^$'],sol:'git reset --soft HEAD~1'},
cs_04_restore:{t:`Файл <code>visual.json</code> зіпсовано у робочій папці (коміту ще не було). Поверни його до стану останнього коміту.`,a:['^git restore visual\\.json$','^git checkout( --)? visual\\.json$'],sol:'git restore visual.json'},
cs_05_rebase_main:{t:`Ти в гілці <code>feature/kpi-cards</code>, локальний <code>main</code> щойно оновлено. Перенеси коміти гілки поверх свіжого <code>main</code>.`,a:['^git rebase main$'],sol:'git rebase main'},
cs_05_irebase:{t:`Відкрий інтерактивний rebase для останніх 4 комітів гілки.`,a:['^git rebase -i HEAD~4$','^git rebase --interactive HEAD~4$'],sol:'git rebase -i HEAD~4'},
cs_06_remote_add:{t:`Локальний PBIP-репозиторій готовий, порожній репозиторій на сервері створено. Підʼєднай віддалений репозиторій <code>https://dev.azure.com/mhp/pdp</code> під стандартним іменем.`,a:['^git remote add origin \\S+$'],sol:'git remote add origin https://dev.azure.com/mhp/pdp'},
cs_06_diff_tmdl:{t:`Перед комітом подивись построкові зміни файлу <code>tables/Sales.tmdl</code> (він ще не в staging).`,a:['^git diff tables/Sales\\.tmdl$','^git diff -- tables/Sales\\.tmdl$'],sol:'git diff tables/Sales.tmdl'},
cs_07_pull:{t:`Колега запушив новий коміт на сервер. Однією командою забери його зміни у свою поточну гілку.`,a:['^git pull$','^git pull --rebase$','^git pull origin \\S+$'],sol:'git pull'},
cs_07_rm_cached:{t:`Файл <code>cache.abf</code> уже відстежується Git, хоча його додали в .gitignore. Прибери його з відстеження, лишивши файл на диску.`,a:['^git rm --cached cache\\.abf$','^git rm --cached "cache\\.abf"$',"^git rm --cached 'cache\\.abf'$"],sol:'git rm --cached cache.abf'},
cs_08_bisect_good:{t:`Bisect перемкнув репозиторій на середній коміт: ти відкрив звіт у Power BI Desktop — міра рахує правильно, бага ще немає. Повідом результат Git.`,a:['^git bisect good$'],sol:'git bisect good'},
cs_08_worktree_add:{t:`Терміновий hotfix: не чіпаючи поточну роботу, створи поруч другу робочу папку <code>../sales-hotfix</code> на наявній гілці <code>hotfix/kpi-cards</code>.`,a:['^git worktree add \\.\\./sales-hotfix hotfix/kpi-cards$','^git worktree add "\\.\\./sales-hotfix" hotfix/kpi-cards$'],sol:'git worktree add ../sales-hotfix hotfix/kpi-cards'}
});
Object.assign(ORDERS,{
or_04_amend:{title:`Забутий файл: полагодити останній коміт`,steps:[`Закомітив зміну міри, але помітив: файл сторінки звіту в коміт не потрапив`,`Переконався, що коміт ще не запушено — amend дозволений`,`git add report/definition/pages/okr.json`,`git commit --amend --no-edit — файл доїхав тим самим комітом`,`git push — на сервер поїхав уже повний коміт`]},
or_05_rebase_flow:{title:`Оновити гілку через rebase перед злиттям`,steps:[`git switch main і git pull — забрати свіжий main із сервера`,`git switch feature/kpi-cards — повернутись у робочу гілку`,`git rebase main — replay твоїх комітів поверх свіжого main`,`git log --oneline — перевірити: історія лінійна, твої коміти згори`,`git switch main і git merge feature/kpi-cards — злиття без merge-коміту`,`git push — main з лінійною історією на сервері`]},
or_06_pbix_migration:{title:`Віднови порядок: міграція опублікованого .pbix у PBIP`,steps:[`Відкрити наявний .pbix у Power BI Desktop`,`File → Save As → «Power BI project files (*.pbip)» у папку репозиторію`,`git status — переконатися, що cache.abf і localSettings.json не у списку`,`git add . та git commit -m "Міграція звіту: .pbix → PBIP"`,`git push — PBIP-версія на сервері`,`Старий .pbix — в архівну папку поза репозиторієм`]},
or_07_tmdl_conflict:{title:`Вирішення TMDL-конфлікту: від CONFLICT до валідної моделі`,steps:[`git merge main → CONFLICT у tables/Sales.tmdl`,`Відкрити конфліктний файл у merge-редакторі VS Code`,`Обрати чи поєднати версії кнопками Accept Current / Incoming / Both`,`git add tables/Sales.tmdl — конфлікт позначено вирішеним`,`git commit — merge завершено`,`Відкрити проєкт у Power BI Desktop і перевірити, що модель валідна`]},
or_08_bisect:{title:`Порядок пошуку винного коміту через git bisect`,steps:[`git bisect start`,`git bisect bad і git bisect good a1b2c3d — задав межі: де зламано і де ще працювало`,`Відкрив PBIP середнього коміту в Power BI Desktop, перевірив міру і відповів good або bad`,`Повторював, доки Git не назвав перший поганий коміт`,`git bisect reset — повернувся на свою гілку`]}
});
/* csim хвилі 2 (аудит новачка): термінал 01 + перші команди 02 */
Object.assign(CSIM,{
cs_01_cp:{t:`Скопіюй файл <code>sales.csv</code> у папку <code>backup/</code> (оригінал лишається на місці).`,a:['^cp sales\.csv backup/?$','^cp sales\.csv backup/sales\.csv$'],sol:'cp sales.csv backup/'},
cs_01_mv:{t:`Перейменуй файл <code>draft_report.md</code> на <code>report.md</code>.`,a:['^mv draft_report\.md report\.md$'],sol:'mv draft_report.md report.md'},
cs_01_rm:{t:`Видали папку <code>temp/</code> разом із усім вмістом. Пам'ятай: <b>rm — без кошика</b>, файли не можна відновити через «Кошик» Windows.`,a:['^rm -r temp/?$','^rm -rf temp/?$','^rm -r -f temp/?$'],sol:'rm -r temp/'},
cs_02_status:{t:`Подивись стан репозиторію: що змінено і що вже в staging.`,a:['^git status$'],sol:'git status'},
cs_02_add_one:{t:`Додай у staging лише файл <code>model.tmdl</code> (без інших змінених файлів).`,a:['^git add model\\.tmdl$'],sol:'git add model.tmdl'}
});
window.__TL__={bank:TERMLAB,newState:tlNewState,run:tlRun,check:tlCheckGoal,goalKeys:TL_GOAL_KEYS};
window.__CSIM__=CSIM;
window.__CA__={bank:CMDANIM};

/* === 13. ПРОГРЕС (localStorage) === */
const LS_PREFIX='gfp:';
function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function pageDoneCount(page,total){let n=0;for(let i=0;i<total;i++)if(lsGet(LS_PREFIX+page+':s'+i)==='1')n++;return n;}
function initProgress(){
  const page=document.body.dataset.page;
  if(page){
    const secs=[...document.querySelectorAll('section.lesson')];
    secs.forEach(sec=>{
      const bar=document.createElement('div');bar.className='donebar';
      const key=LS_PREFIX+page+':'+sec.dataset.n;
      bar.innerHTML=`<label><input type="checkbox" class="done-cb"> Урок пройдено</label>`;
      const cb=bar.querySelector('.done-cb');
      cb.checked=lsGet(key)==='1';
      const link=document.querySelector(`#nav a[data-sec="${sec.id}"]`);
      const sync=()=>{if(link)link.classList.toggle('done',cb.checked);};
      cb.onchange=()=>{lsSet(key,cb.checked?'1':'0');sync();updateAsideProg();};
      sync();
      sec.appendChild(bar);
    });
    updateAsideProg();
  }
  // index cards
  document.querySelectorAll('.mcard').forEach(card=>{
    const p=card.dataset.page,total=+card.dataset.total;
    const n=pageDoneCount(p,total);
    const bar=card.querySelector('.mprog i');if(bar)bar.style.width=(total?n/total*100:0)+'%';
    const st=card.querySelector('.mc-st');if(st)st.textContent=n+' / '+total;
  });
}
function updateAsideProg(){
  const page=document.body.dataset.page;if(!page)return;
  const total=document.querySelectorAll('section.lesson').length;
  const n=pageDoneCount(page,total);
  const el=document.getElementById('pgdone');if(el)el.textContent=`пройдено ${n} / ${total}`;
  const bar=document.getElementById('progbar');if(bar)bar.style.width=(total?n/total*100:0)+'%';
}

/* === 13b. САЙДБАР: підсвітка поточного підрозділу + згортання === */
function initSecSpy(){
  const nav=document.getElementById('nav');if(!nav)return;
  const links=[...nav.querySelectorAll('a[data-sec]')];if(!links.length)return;
  const byId={};links.forEach(a=>byId[a.dataset.sec]=a);
  const secs=[...document.querySelectorAll('section.lesson')].filter(s=>byId[s.id]);
  if(!secs.length)return;
  let tick=false;
  function apply(){
    tick=false;
    let cur=secs[0].id;
    const y=window.scrollY+150;
    for(const s of secs){if(s.offsetTop<=y)cur=s.id;}
    links.forEach(a=>a.classList.toggle('cur',a.dataset.sec===cur));
  }
  window.addEventListener('scroll',()=>{if(!tick){tick=true;requestAnimationFrame(apply);}},{passive:true});
  apply();
}
function initSubsecToggle(){
  const sub=document.querySelector('#nav .subsec');if(!sub)return;
  const act=sub.previousElementSibling;
  if(!act||!act.classList.contains('active'))return;
  const ch=document.createElement('span');ch.className='chev';ch.textContent='▾';act.appendChild(ch);
  act.addEventListener('click',e=>{
    e.preventDefault(); // активний пункт = поточна сторінка, перезавантаження не потрібне
    ch.textContent=sub.classList.toggle('closed')?'▸':'▾';
  });
}

/* === 14. ПОШУК ПО ВСЬОМУ САЙТУ === */
function sitePrefix(){return location.pathname.indexOf('/modules/')>=0?'../':'';}
function runSearch(q){
  const box=document.getElementById('searchResults');if(!box)return;
  q=(q||'').trim();
  if(q.length<2){box.style.display='none';box.innerHTML='';return;}
  const idx=window.SEARCH_INDEX||[];const ql=q.toLowerCase();
  const hits=[];
  idx.forEach(e=>{
    const inT=e.t.toLowerCase().indexOf(ql)>=0,inX=e.x.toLowerCase().indexOf(ql)>=0;
    if(inT||inX)hits.push({e,score:(inT?2:0)+(inX?1:0)});
  });
  hits.sort((a,b)=>b.score-a.score);
  const top=hits.slice(0,20);
  box.innerHTML=`<div class="sr-count">Знайдено: ${hits.length}</div>`+top.map(h=>{
    const e=h.e;const pos=e.x.toLowerCase().indexOf(ql);
    const frag=pos>=0?e.x.slice(Math.max(0,pos-40),pos+80):e.x.slice(0,100);
    return `<a class="sr" href="${sitePrefix()+e.p}#${e.a}" data-q="${escapeHTML(q)}"><b class="sr-t">${emph(e.t,q)}</b><span class="sr-m">${e.m}</span><span class="sr-x">…${emph(frag,q)}…</span></a>`;
  }).join('');
  box.style.display='block';
  box.querySelectorAll('a.sr').forEach(a=>a.onclick=()=>{try{sessionStorage.setItem('gfp:q',q);}catch(e){}});
}
function initSearch(){
  const inp=document.getElementById('searchBox'),clr=document.getElementById('searchClear');
  if(!inp)return;
  inp.addEventListener('input',()=>runSearch(inp.value));
  if(clr)clr.onclick=()=>{inp.value='';runSearch('');inp.focus();};
}
function initHighlightFromSearch(){
  let q=null;try{q=sessionStorage.getItem('gfp:q');sessionStorage.removeItem('gfp:q');}catch(e){}
  if(!q||!location.hash)return;
  const sec=document.querySelector(location.hash);
  if(sec){highlightIn(sec,q);const m=sec.querySelector('mark.hl');if(m&&m.scrollIntoView)setTimeout(()=>m.scrollIntoView({block:'center'}),80);}
}

/* === 14b. ВІДЕО УКРАЇНСЬКОЮ (офіційний embed із таймкодом) ===
   Джерело: «ПОВНИЙ КУРС по GIT та GITHUB українською» — канал Нікіта Тимошенко (@ion_lab).
   Розділи (chapters) — авторські, витягнуті з відео. Embed дозволений автором (перевірено oEmbed).
   Фасад не робить жодного запиту до YouTube, доки користувач не натисне «Дивитись». */
const YT_VIDEO_ID='9CnZihyYjjA';
const YT_CHANNEL='Нікіта Тимошенко';
const YT_CHANNEL_URL='https://www.youtube.com/@ion_lab';
const YT_TITLE='ПОВНИЙ КУРС по GIT та GITHUB українською';
const VIDEOS={
  v_00:{start:232,  label:`Огляд курсу`},
  v_01:{start:999,  label:`Командний рядок — Git Bash`},
  v_02:{start:3625, label:`git — Вступ і теорія`},
  v_03:{start:5217, label:`git — Основні команди`},
  v_04:{start:8238, label:`git — Відновлення версій`},
  v_05:{start:18142,label:`Вирішення конфліктів (на прикладі GitHub)`},
  v_07:{start:12499,label:`github — спільна робота, Pull Request, конфлікти`}
};
function ytTC(s){const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=String(s%60).padStart(2,'0');return h>0?`${h}:${String(m).padStart(2,'0')}:${ss}`:`${m}:${ss}`;}
function buildVideos(){
  document.querySelectorAll('.ytvideo').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const v=VIDEOS[el.dataset.v];if(!v)return;
    const tc=ytTC(v.start);
    const watch=`https://www.youtube.com/watch?v=${YT_VIDEO_ID}&t=${v.start}s`;
    const thumb=`https://i.ytimg.com/vi/${YT_VIDEO_ID}/hqdefault.jpg`;
    el.innerHTML=`<div class="ytv-head"><span class="ytv-badge">▶ Відео українською</span><a class="ytv-ch" href="${YT_CHANNEL_URL}" target="_blank" rel="noopener">${YT_CHANNEL}</a></div>`+
      `<button class="ytv-frame" type="button" style="background-image:url('${thumb}')" aria-label="Відтворити відео з таймкоду ${tc}"><span class="ytv-play"></span><span class="ytv-tc">з ${tc} · ${v.label}</span></button>`+
      `<div class="ytv-cap">Фрагмент курсу «${YT_TITLE}» — відкриється на таймкоді цієї теми. <a href="${watch}" target="_blank" rel="noopener">Дивитись на YouTube ↗</a></div>`;
    const btn=el.querySelector('.ytv-frame');
    btn.addEventListener('click',()=>{
      const wrap=document.createElement('div');wrap.className='ytv-embed';
      const ifr=document.createElement('iframe');
      ifr.src=`https://www.youtube-nocookie.com/embed/${YT_VIDEO_ID}?start=${v.start}&autoplay=1&rel=0`;
      ifr.title=YT_TITLE;ifr.loading='lazy';ifr.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';ifr.allowFullscreen=true;
      wrap.appendChild(ifr);btn.replaceWith(wrap);
    },{once:true});
  });
}

/* === 15. АВТООНОВЛЕННЯ ПРИ НОВІЙ ВЕРСІЇ === */
/* CI (deploy.yml) кладе в корінь сайту version.json з SHA коміту.
   Локально файла немає — перша ж невдала загрузка мовчки вимикає перевірку. */
const VER_EVERY=5*60*1000,VER_MIN_GAP=60*1000;
let verBase=null,verLast=0,verDismissed=false;
function verFetch(){return fetch(sitePrefix()+'version.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);}
function verReload(){
  try{
    const ts=+(sessionStorage.getItem('gfp:upd:ts')||0);
    if(Date.now()-ts<60000)return;
    sessionStorage.setItem('gfp:upd:ts',String(Date.now()));
  }catch(e){}
  location.reload();
}
function verToast(){
  if(document.getElementById('updToast'))return;
  const t=document.createElement('div');t.id='updToast';t.className='upd-toast';
  let left=10;
  t.innerHTML=`<b>Вийшла нова версія курсу</b><span class="upd-cnt">Сторінка оновиться через <i>${left}</i> с</span><div class="upd-btns"><button class="upd-now">Оновити зараз</button><button class="upd-later">Пізніше</button></div>`;
  document.body.appendChild(t);
  const cnt=t.querySelector('.upd-cnt i');
  const tick=setInterval(()=>{left--;if(cnt)cnt.textContent=String(left);if(left<=0){clearInterval(tick);t.remove();verReload();}},1000);
  t.querySelector('.upd-now').onclick=()=>{clearInterval(tick);verReload();};
  t.querySelector('.upd-later').onclick=()=>{clearInterval(tick);verDismissed=true;t.remove();};
}
function verCheck(){
  if(verDismissed||!verBase)return;
  const now=Date.now();if(now-verLast<VER_MIN_GAP)return;verLast=now;
  verFetch().then(j=>{
    if(!j||!j.v||j.v===verBase.v)return;
    if(document.hidden)verReload();else verToast();
  });
}
function initVersionCheck(){
  if(typeof fetch!=='function'||location.protocol.indexOf('http')!==0)return;
  verFetch().then(j=>{
    if(!j||!j.v)return;
    verBase=j;verLast=Date.now();
    setInterval(verCheck,VER_EVERY);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)verCheck();});
  });
}

/* === 15c. СХЕМИ ПРОГРАМ (uimock) === */
const UIMOCK={
  win_open_terminal:{title:`Як відкрити Git Bash у Windows`,
    cap:`Два способи відкрити термінал: ① через меню Пуск (ввести «git bash»), ② через праву кнопку миші в потрібній папці — цей спосіб одразу відкриє термінал саме в ній.`,
    svg:`<svg viewBox="0 0 720 440" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="cwotA"><rect x="20" y="20" width="680" height="195" rx="10"/></clipPath>
<clipPath id="cwotB"><rect x="20" y="225" width="680" height="195" rx="10"/></clipPath>
</defs>
<rect x="20" y="20" width="680" height="195" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cwotA)">
<rect x="20" y="20" width="680" height="28" fill="#f4f5f8"/>
<text x="34" y="39" font-size="11" font-weight="600" fill="#5b6473">Пуск</text>
<text x="692" y="39" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<circle cx="40" cy="66" r="13" fill="#5b5bd6"/>
<text x="40" y="70" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">1</text>
<text x="62" y="70" font-size="13" font-weight="700" fill="#1f2430">Меню Пуск: пошук «git bash»</text>
<rect x="250" y="84" width="220" height="26" rx="13" fill="#ffffff" stroke="#e7e8ee"/>
<circle cx="264" cy="97" r="4" fill="none" stroke="#9aa0ad" stroke-width="1.5"/>
<line x1="267" y1="100" x2="271" y2="104" stroke="#9aa0ad" stroke-width="1.5"/>
<text x="278" y="101" font-size="12" font-family="monospace" fill="#1f2430">git bash</text>
<rect x="140" y="118" width="440" height="36" rx="6" fill="#5b5bd6" fill-opacity="0.12" stroke="#5b5bd6"/>
<rect x="150" y="126" width="20" height="20" rx="4" fill="#5b5bd6"/>
<text x="160" y="140" font-size="10" font-family="monospace" fill="#ffffff" text-anchor="middle">&gt;_</text>
<text x="180" y="137" font-size="13" font-weight="700" fill="#1f2430">Git Bash</text>
<text x="180" y="153" font-size="10" fill="#5b6473">Застосунок</text>
<rect x="140" y="154" width="440" height="24" fill="#f4f5f8"/>
<text x="160" y="170" font-size="11" fill="#5b6473">Git GUI — Застосунок</text>
<rect x="140" y="178" width="440" height="24" fill="#f4f5f8"/>
<text x="160" y="194" font-size="11" fill="#5b6473">Git CMD — Застосунок</text>
</g>
<rect x="20" y="225" width="680" height="195" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cwotB)">
<rect x="20" y="225" width="680" height="28" fill="#f4f5f8"/>
<text x="34" y="244" font-size="11" font-weight="600" fill="#5b6473">Провідник</text>
<text x="692" y="244" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<circle cx="40" cy="271" r="13" fill="#5b5bd6"/>
<text x="40" y="275" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">2</text>
<text x="62" y="275" font-size="13" font-weight="700" fill="#1f2430">Права кнопка миші в папці</text>
<rect x="40" y="289" width="330" height="112" rx="6" fill="#f4f5f8" stroke="#e7e8ee"/>
<rect x="58" y="305" width="18" height="15" fill="#9aa0ad" fill-opacity="0.5"/>
<text x="84" y="317" font-size="11" fill="#5b6473">report.pbip</text>
<rect x="58" y="335" width="18" height="15" fill="#9aa0ad" fill-opacity="0.5"/>
<text x="84" y="347" font-size="11" fill="#5b6473">definition</text>
<rect x="58" y="365" width="18" height="15" fill="#9aa0ad" fill-opacity="0.5"/>
<text x="84" y="377" font-size="11" fill="#5b6473">README.md</text>
<rect x="398" y="295" width="270" height="122" fill="#000000" opacity="0.06"/>
<rect x="393" y="290" width="270" height="122" rx="6" fill="#ffffff" stroke="#e7e8ee"/>
<text x="405" y="313" font-size="11" fill="#1f2430">Open</text>
<text x="405" y="335" font-size="11" fill="#1f2430">Open in Terminal</text>
<rect x="393" y="342" width="270" height="24" fill="#5b5bd6" fill-opacity="0.15"/>
<text x="405" y="358" font-size="11" font-weight="700" fill="#5b5bd6">Open Git Bash here</text>
<text x="405" y="381" font-size="11" fill="#1f2430">Open PowerShell here</text>
<text x="405" y="403" font-size="11" fill="#1f2430">Properties</text>
</g>
</svg>`},
  explorer_git:{title:`Папка .git у Провіднику Windows`,
    cap:`Папка .git з'являється в кожному git-репозиторії — саме там Git зберігає всю історію комітів. Вона напівпрозора й приховувана: руками в ній нічого не чіпають.`,
    svg:`<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="ceg"><rect x="20" y="20" width="680" height="380" rx="10"/></clipPath>
<marker id="arr-eg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#5b5bd6"/></marker>
</defs>
<rect x="20" y="20" width="680" height="380" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#ceg)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="40" y="41" font-size="12" font-weight="700" fill="#1f2430">pbi-reports</text>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<text x="40" y="70" font-size="11" fill="#5b6473">Цей ПК › Projects › pbi-reports</text>
<rect x="40" y="84" width="640" height="22" fill="#ecedf2"/>
<text x="90" y="99" font-size="10" fill="#9aa0ad">НАЗВА</text>
<text x="420" y="99" font-size="10" fill="#9aa0ad">ЗМІНЕНО</text>
<text x="560" y="99" font-size="10" fill="#9aa0ad">ТИП</text>
<rect x="40" y="110" width="20" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="70" y="123" font-size="13" fill="#1f2430">report.pbip</text>
<text x="560" y="123" font-size="11" fill="#5b6473">PBIP-файл</text>
<rect x="40" y="150" width="20" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="70" y="163" font-size="13" fill="#1f2430">definition</text>
<text x="560" y="163" font-size="11" fill="#5b6473">Папка з файлами</text>
<rect x="40" y="190" width="20" height="16" fill="#9aa0ad" fill-opacity="0.28"/>
<text x="70" y="203" font-size="13" fill="#1f2430" fill-opacity="0.55">.git</text>
<text x="560" y="203" font-size="11" fill="#5b6473" fill-opacity="0.55">Службова папка</text>
<rect x="40" y="230" width="20" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="70" y="243" font-size="13" fill="#1f2430">README.md</text>
<text x="560" y="243" font-size="11" fill="#5b6473">Документ</text>
<path d="M230,214 C260,250 300,270 320,296" fill="none" stroke="#5b5bd6" stroke-width="2" marker-end="url(#arr-eg)"/>
<rect x="300" y="298" width="380" height="70" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<text x="316" y="322" font-size="12" fill="#1f2430">Прихована папка — тут Git тримає</text>
<text x="316" y="340" font-size="12" fill="#1f2430">всю історію комітів.</text>
<text x="316" y="358" font-size="12" font-weight="700" fill="#e5484d">Руками не чіпати.</text>
</g>
</svg>`},
  vscode_scm:{title:`Панель Source Control у VS Code`,
    cap:`M (modified) — файл уже існував і змінився, U (untracked) — Git ще не бачив цей файл. Повідомлення коміту пишеш у полі Message і тиснеш Commit.`,
    svg:`<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs><clipPath id="cvs"><rect x="20" y="20" width="680" height="380" rx="10"/></clipPath></defs>
<rect x="20" y="20" width="680" height="380" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cvs)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="40" y="41" font-size="12" font-weight="700" fill="#1f2430">Visual Studio Code — pbi-reports</text>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<rect x="20" y="52" width="44" height="348" fill="#f4f5f8"/>
<rect x="20" y="145" width="3" height="30" fill="#5b5bd6"/>
<rect x="32" y="72" width="16" height="16" rx="2" fill="none" stroke="#9aa0ad" stroke-width="1.5"/>
<circle cx="40" cy="112" r="8" fill="none" stroke="#9aa0ad" stroke-width="1.5"/>
<line x1="46" y1="118" x2="50" y2="122" stroke="#9aa0ad" stroke-width="1.5"/>
<circle cx="35" cy="154" r="3" fill="#5b5bd6"/>
<circle cx="45" cy="166" r="3" fill="#5b5bd6"/>
<line x1="35" y1="157" x2="45" y2="163" stroke="#5b5bd6" stroke-width="1.5"/>
<circle cx="50" cy="150" r="8" fill="#e5484d"/>
<text x="50" y="153" font-size="9" fill="#ffffff" text-anchor="middle" font-weight="700">2</text>
<rect x="30" y="192" width="20" height="16" fill="none" stroke="#9aa0ad" stroke-width="1.5"/>
<text x="80" y="70" font-size="10" letter-spacing="1" fill="#9aa0ad">SOURCE CONTROL</text>
<rect x="80" y="80" width="600" height="50" rx="6" fill="#ffffff" stroke="#e7e8ee"/>
<text x="92" y="109" font-size="12" fill="#9aa0ad">Message</text>
<rect x="80" y="140" width="120" height="30" rx="6" fill="#5b5bd6"/>
<text x="140" y="160" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">✓ Commit</text>
<text x="80" y="192" font-size="11" font-weight="700" fill="#5b6473">CHANGES</text>
<circle cx="150" cy="188" r="9" fill="#ecedf2"/>
<text x="150" y="191" font-size="10" fill="#5b6473" text-anchor="middle">2</text>
<rect x="80" y="202" width="600" height="28" fill="#ffffff"/>
<text x="90" y="221" font-size="12" font-family="monospace" fill="#1f2430">model.tmdl</text>
<rect x="650" y="208" width="18" height="18" rx="3" fill="#b7791f"/>
<text x="659" y="221" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="700">M</text>
<rect x="80" y="230" width="600" height="28" fill="#ffffff"/>
<text x="90" y="249" font-size="12" font-family="monospace" fill="#1f2430">Sales.tmdl</text>
<rect x="650" y="236" width="18" height="18" rx="3" fill="#0e9f6e"/>
<text x="659" y="249" font-size="11" fill="#ffffff" text-anchor="middle" font-weight="700">U</text>
<rect x="80" y="276" width="600" height="60" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<text x="96" y="298" font-size="12" fill="#1f2430">M = modified (файл існує, змінений)</text>
<text x="96" y="318" font-size="12" fill="#1f2430">U = untracked (Git ще не бачив файл)</text>
</g>
</svg>`},
  github_repo:{title:`Сторінка репозиторію на GitHub`,
    cap:`Тут видно файли репозиторію, поточну гілку (main) і кнопку Code для клонування. Останній коміт підписаний повідомленням прямо в таблиці файлів.`,
    svg:`<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs><clipPath id="cgr"><rect x="20" y="20" width="680" height="380" rx="10"/></clipPath></defs>
<rect x="20" y="20" width="680" height="380" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cgr)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<rect x="40" y="60" width="640" height="26" rx="6" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="52" y="77" font-size="11" font-family="monospace" fill="#5b6473">github.com/you/pbi-reports</text>
<text x="40" y="122" font-size="18" font-weight="800" fill="#1f2430">pbi-reports</text>
<rect x="170" y="106" width="60" height="20" rx="10" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="200" y="120" font-size="10" fill="#5b6473" text-anchor="middle">Public</text>
<rect x="40" y="140" width="110" height="30" rx="6" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="95" y="160" font-size="12" fill="#1f2430" text-anchor="middle">⑂ main ▾</text>
<rect x="600" y="140" width="100" height="30" rx="6" fill="#0e9f6e"/>
<text x="650" y="160" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Code ▾</text>
<rect x="40" y="188" width="640" height="24" fill="#ecedf2"/>
<text x="60" y="204" font-size="10" fill="#9aa0ad">NAME</text>
<text x="300" y="204" font-size="10" fill="#9aa0ad">LAST COMMIT MESSAGE</text>
<text x="600" y="204" font-size="10" fill="#9aa0ad">DATE</text>
<line x1="40" y1="212" x2="680" y2="212" stroke="#e7e8ee"/>
<rect x="46" y="222" width="16" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="70" y="235" font-size="12" fill="#1f2430">report.pbip</text>
<text x="300" y="235" font-size="11" fill="#5b6473">Оновлено KPI-картки</text>
<text x="600" y="235" font-size="11" fill="#5b6473">2 дні тому</text>
<line x1="40" y1="246" x2="680" y2="246" stroke="#e7e8ee"/>
<rect x="46" y="256" width="16" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="70" y="269" font-size="12" fill="#1f2430">definition</text>
<text x="300" y="269" font-size="11" fill="#5b6473">Правки моделі даних</text>
<text x="600" y="269" font-size="11" fill="#5b6473">2 дні тому</text>
<line x1="40" y1="280" x2="680" y2="280" stroke="#e7e8ee"/>
<rect x="46" y="290" width="16" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="70" y="303" font-size="12" fill="#1f2430">README.md</text>
<text x="300" y="303" font-size="11" fill="#5b6473">Initial commit</text>
<text x="600" y="303" font-size="11" fill="#5b6473">місяць тому</text>
<rect x="40" y="322" width="640" height="50" rx="8" fill="#f4f5f8" stroke="#e7e8ee"/>
<circle cx="60" cy="347" r="5" fill="#0e9f6e"/>
<text x="76" y="351" font-size="12" fill="#1f2430">Останній коміт: «Оновлено KPI-картки» · 2 дні тому</text>
</g>
</svg>`},
  github_pr:{title:`Pull Request на GitHub`,
    cap:`PR показує, звідки й куди йде злиття (feature/kpi-cards → main), обговорення змін і зелену кнопку Merge, коли все готово й перевірки пройдені.`,
    svg:`<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="cgp"><rect x="20" y="20" width="680" height="380" rx="10"/></clipPath>
<marker id="arr-gpr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#9aa0ad"/></marker>
</defs>
<rect x="20" y="20" width="680" height="380" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cgp)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<rect x="40" y="60" width="640" height="26" rx="6" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="52" y="77" font-size="11" font-family="monospace" fill="#5b6473">github.com/you/pbi-reports/pull/12</text>
<rect x="40" y="100" width="76" height="22" rx="11" fill="#0e9f6e"/>
<text x="78" y="115" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">Відкрито</text>
<text x="126" y="117" font-size="18" font-weight="800" fill="#1f2430">Нові KPI-картки #12</text>
<rect x="40" y="140" width="170" height="26" rx="13" fill="#f4f5f8" stroke="#6b76a8"/>
<text x="125" y="157" font-size="11" font-family="monospace" fill="#6b76a8" text-anchor="middle">feature/kpi-cards</text>
<line x1="215" y1="153" x2="255" y2="153" stroke="#9aa0ad" stroke-width="1.5" marker-end="url(#arr-gpr)"/>
<rect x="260" y="140" width="70" height="26" rx="13" fill="#f4f5f8" stroke="#5b5bd6"/>
<text x="295" y="157" font-size="11" font-family="monospace" fill="#5b5bd6" text-anchor="middle">main</text>
<text x="40" y="184" font-size="12" font-weight="700" fill="#5b5bd6">Conversation</text>
<line x1="40" y1="190" x2="122" y2="190" stroke="#5b5bd6" stroke-width="2"/>
<text x="170" y="184" font-size="12" fill="#9aa0ad">Files changed</text>
<line x1="40" y1="196" x2="680" y2="196" stroke="#e7e8ee"/>
<circle cx="60" cy="230" r="14" fill="#ecedf2" stroke="#e7e8ee"/>
<rect x="90" y="210" width="420" height="52" rx="8" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="104" y="232" font-size="11" fill="#1f2430">Додав 3 нові KPI-картки на сторінку</text>
<text x="104" y="250" font-size="11" fill="#1f2430">«Огляд». Готово до перевірки.</text>
<text x="40" y="300" font-size="12" fill="#0e9f6e">✓ Всі перевірки пройдено</text>
<rect x="40" y="330" width="260" height="44" rx="8" fill="#0e9f6e"/>
<text x="170" y="357" font-size="14" font-weight="800" fill="#ffffff" text-anchor="middle">Merge pull request</text>
</g>
</svg>`},
  pbi_save_pbip:{title:`Збереження звіту у форматі PBIP`,
    cap:`У діалозі «Save As» обирай саме «Power BI project files (*.pbip)» — цей формат розкладає звіт на текстові файли, які Git уміє відстежувати.`,
    svg:`<svg viewBox="0 0 720 465" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="csp"><rect x="90" y="25" width="540" height="390" rx="10"/></clipPath>
<marker id="arr-psp" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#5b5bd6"/></marker>
</defs>
<rect x="90" y="25" width="540" height="390" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#csp)">
<rect x="90" y="25" width="540" height="32" fill="#f4f5f8"/>
<text x="110" y="46" font-size="13" font-weight="700" fill="#1f2430">Save As</text>
<text x="615" y="46" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<text x="110" y="76" font-size="11" fill="#5b6473">Цей ПК › Documents › pbi-reports</text>
<rect x="110" y="92" width="500" height="110" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="110" y="228" font-size="12" fill="#1f2430">File name:</text>
<rect x="210" y="214" width="400" height="26" rx="4" fill="#ffffff" stroke="#e7e8ee"/>
<text x="220" y="232" font-size="12" fill="#1f2430">Зведений звіт</text>
<text x="110" y="264" font-size="12" fill="#1f2430">Save as type:</text>
<rect x="210" y="250" width="400" height="26" rx="4" fill="#ffffff" stroke="#5b5bd6" stroke-width="2"/>
<text x="220" y="268" font-size="11" font-weight="700" fill="#5b5bd6">Power BI project files (*.pbip)</text>
<text x="592" y="268" font-size="10" fill="#5b5bd6">▾</text>
<rect x="214" y="280" width="392" height="80" fill="#ffffff" stroke="#e7e8ee"/>
<text x="222" y="296" font-size="11" fill="#5b6473">Power BI files (*.pbix)</text>
<rect x="214" y="302" width="392" height="22" fill="#5b5bd6" fill-opacity="0.12"/>
<text x="222" y="318" font-size="11" font-weight="700" fill="#5b5bd6">Power BI project files (*.pbip)</text>
<text x="222" y="340" font-size="11" fill="#5b6473">All files (*.*)</text>
<rect x="430" y="372" width="90" height="28" rx="4" fill="#5b5bd6"/>
<text x="475" y="391" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="530" y="372" width="90" height="28" rx="4" fill="#f4f5f8" stroke="#e7e8ee"/>
<text x="575" y="391" font-size="12" fill="#1f2430" text-anchor="middle">Cancel</text>
</g>
<path d="M340,418 C340,404 420,320 470,315" fill="none" stroke="#5b5bd6" stroke-width="2" marker-end="url(#arr-psp)"/>
<rect x="90" y="420" width="540" height="40" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<text x="106" y="444" font-size="12" font-weight="700" fill="#5b5bd6">Обери .pbip — саме цей формат дружить із Git</text>
</svg>`},
  pbip_folder:{title:`Структура PBIP-проєкту`,
    cap:`PBIP розкладає звіт на файли: .pbip — точка входу, .Report — макет сторінок, .SemanticModel/definition — модель даних (TMDL-файли для кожної таблиці).`,
    svg:`<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs><clipPath id="cpf"><rect x="20" y="20" width="680" height="280" rx="10"/></clipPath></defs>
<rect x="20" y="20" width="680" height="280" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cpf)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="40" y="41" font-size="12" font-weight="700" fill="#1f2430">MyReport.pbip — File Explorer</text>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<text x="40" y="70" font-size="11" fill="#5b6473">Цей ПК › Projects › MyReport</text>
<line x1="52" y1="106" x2="52" y2="260" stroke="#dcdde3" stroke-width="1.5" stroke-dasharray="2 3"/>
<line x1="76" y1="174" x2="76" y2="260" stroke="#dcdde3" stroke-width="1.5" stroke-dasharray="2 3"/>
<rect x="40" y="86" width="18" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="66" y="99" font-size="13" fill="#1f2430">MyReport.pbip</text>
<rect x="40" y="118" width="18" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="66" y="131" font-size="13" fill="#1f2430">MyReport.Report</text>
<rect x="40" y="150" width="18" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="66" y="163" font-size="13" fill="#1f2430">MyReport.SemanticModel</text>
<rect x="64" y="182" width="18" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="90" y="195" font-size="13" fill="#1f2430">definition</text>
<rect x="88" y="214" width="18" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="114" y="227" font-size="13" fill="#1f2430">model.tmdl</text>
<rect x="88" y="246" width="18" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="114" y="259" font-size="13" fill="#1f2430">tables</text>
<line x1="300" y1="93" x2="380" y2="93" stroke="#dcdde3" stroke-dasharray="2 2"/>
<text x="386" y="97" font-size="11" fill="#5b6473">точка входу проєкту</text>
<line x1="300" y1="125" x2="380" y2="125" stroke="#dcdde3" stroke-dasharray="2 2"/>
<text x="386" y="129" font-size="11" fill="#5b6473">макет сторінок звіту</text>
<line x1="340" y1="189" x2="420" y2="189" stroke="#dcdde3" stroke-dasharray="2 2"/>
<text x="426" y="193" font-size="11" fill="#5b6473">модель даних: таблиці й міри</text>
<line x1="330" y1="253" x2="410" y2="253" stroke="#dcdde3" stroke-dasharray="2 2"/>
<text x="416" y="257" font-size="11" fill="#5b6473">TMDL-файл на кожну таблицю</text>
</g>
</svg>`},
  pbi_git_sync:{title:`Update from Git у Fabric / Power BI Service`,
    cap:`Кнопка Source control показує, скільки змін чекає. «Update from Git» = опублікувати в робочу область те, що вже влито в main, — це фінальний крок публікації.`,
    svg:`<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="cgs"><rect x="20" y="20" width="680" height="380" rx="10"/></clipPath>
<marker id="arr-pgs" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#5b5bd6"/></marker>
</defs>
<rect x="20" y="20" width="680" height="380" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cgs)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<rect x="20" y="52" width="680" height="40" fill="#f4f5f8"/>
<text x="40" y="76" font-size="13" font-weight="700" fill="#1f2430">Робоча область: Продажі</text>
<rect x="560" y="60" width="130" height="26" rx="6" fill="#ffffff" stroke="#e7e8ee"/>
<circle cx="573" cy="73" r="3" fill="#5b6473"/>
<circle cx="581" cy="80" r="3" fill="#5b6473"/>
<line x1="573" y1="76" x2="581" y2="77" stroke="#5b6473"/>
<text x="590" y="77" font-size="10.5" fill="#1f2430">Source control</text>
<circle cx="694" cy="60" r="10" fill="#5b5bd6"/>
<text x="694" y="64" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">1</text>
<rect x="40" y="110" width="110" height="80" rx="6" fill="#f4f5f8" stroke="#e7e8ee" opacity="0.6"/>
<rect x="160" y="110" width="110" height="80" rx="6" fill="#f4f5f8" stroke="#e7e8ee" opacity="0.6"/>
<rect x="280" y="110" width="110" height="80" rx="6" fill="#f4f5f8" stroke="#e7e8ee" opacity="0.6"/>
<rect x="400" y="92" width="280" height="308" fill="#ffffff" stroke="#e7e8ee"/>
<text x="416" y="118" font-size="14" font-weight="800" fill="#1f2430">Updates</text>
<text x="416" y="136" font-size="10" fill="#9aa0ad">Зміни, які прийшли з main</text>
<line x1="416" y1="146" x2="664" y2="146" stroke="#e7e8ee"/>
<rect x="416" y="156" width="16" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="440" y="169" font-size="12" fill="#1f2430">Звіт продажів</text>
<rect x="580" y="158" width="66" height="18" rx="9" fill="#b7791f" fill-opacity="0.15" stroke="#b7791f"/>
<text x="613" y="171" font-size="9" fill="#b7791f" text-anchor="middle">Змінено</text>
<rect x="416" y="196" width="16" height="16" fill="#9aa0ad" fill-opacity="0.6"/>
<text x="440" y="209" font-size="12" fill="#1f2430">Sales.SemanticModel</text>
<rect x="580" y="198" width="66" height="18" rx="9" fill="#0e9f6e" fill-opacity="0.15" stroke="#0e9f6e"/>
<text x="613" y="211" font-size="9" fill="#0e9f6e" text-anchor="middle">Нове</text>
<rect x="416" y="236" width="16" height="16" fill="#6b76a8" fill-opacity="0.5"/>
<text x="440" y="249" font-size="12" fill="#1f2430">KPI Dashboard</text>
<rect x="580" y="238" width="66" height="18" rx="9" fill="#b7791f" fill-opacity="0.15" stroke="#b7791f"/>
<text x="613" y="251" font-size="9" fill="#b7791f" text-anchor="middle">Змінено</text>
<line x1="416" y1="280" x2="664" y2="280" stroke="#e7e8ee"/>
<rect x="416" y="296" width="248" height="36" rx="6" fill="#5b5bd6"/>
<text x="540" y="319" font-size="13" font-weight="800" fill="#ffffff" text-anchor="middle">Update all</text>
<rect x="40" y="320" width="340" height="60" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<text x="56" y="342" font-size="12" fill="#1f2430">Update from Git = опублікувати те,</text>
<text x="56" y="360" font-size="12" fill="#1f2430">що вже влито в main.</text>
</g>
<path d="M380,340 C395,330 400,325 414,316" fill="none" stroke="#5b5bd6" stroke-width="2" marker-end="url(#arr-pgs)"/>
</svg>`},
  vscode_merge:{title:`VS Code: маркери конфлікту злиття`,
    cap:`Так виглядає конфлікт злиття у VS Code: файл model.tmdl відкрито після git merge чи git pull, і в редакторі видно маркери &lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD, ======= та &gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/kpi-cards. З'являється, коли дві гілки змінили той самий рядок TMDL — клікаєш потрібний варіант, і маркери зникають.`,
    svg:`<svg viewBox="0 0 720 420" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs><clipPath id="cvsm"><rect x="20" y="20" width="680" height="380" rx="10"/></clipPath></defs>
<rect x="20" y="20" width="680" height="380" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cvsm)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="40" y="41" font-size="12" font-weight="700" fill="#1f2430">Visual Studio Code — merge conflict</text>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<rect x="20" y="52" width="680" height="32" fill="#f4f5f8"/>
<rect x="20" y="52" width="150" height="32" fill="#ffffff"/>
<rect x="20" y="52" width="150" height="2" fill="#5b5bd6"/>
<text x="40" y="72" font-size="11" font-weight="700" font-family="monospace" fill="#1f2430">model.tmdl</text>
<circle cx="158" cy="68" r="4" fill="#e5484d"/>
<line x1="170" y1="52" x2="170" y2="84" stroke="#e7e8ee"/>
<text x="190" y="72" font-size="11" font-family="monospace" fill="#5b6473">measures.tmdl</text>
<line x1="20" y1="84" x2="700" y2="84" stroke="#e7e8ee"/>
<text x="60" y="101" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">9</text>
<text x="72" y="101" font-size="12" font-family="monospace" fill="#1f2430">measure 'Total Sales' = SUM(Sales[Amount])</text>
<text x="60" y="125" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">10</text>
<text x="72" y="149" font-size="11" font-weight="600" fill="#5b5bd6">Accept Current Change</text>
<text x="214" y="149" font-size="11" fill="#c1c4cf">|</text>
<text x="222" y="149" font-size="11" font-weight="600" fill="#5b5bd6">Accept Incoming Change</text>
<text x="372" y="149" font-size="11" fill="#c1c4cf">|</text>
<text x="380" y="149" font-size="11" font-weight="600" fill="#5b5bd6">Accept Both Changes</text>
<rect x="20" y="156" width="680" height="24" fill="#b7791f" fill-opacity="0.12"/>
<text x="60" y="173" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">11</text>
<text x="72" y="173" font-size="12" font-weight="700" font-family="monospace" fill="#b7791f">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</text>
<text x="168" y="173" font-size="10.5" font-style="italic" fill="#9aa0ad">(Current Change)</text>
<rect x="20" y="180" width="680" height="24" fill="#0e9f6e" fill-opacity="0.12"/>
<text x="60" y="197" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">12</text>
<text x="72" y="197" font-size="12" font-family="monospace" fill="#1f2430">  measure 'KPI Cards Count' = 4</text>
<rect x="20" y="204" width="680" height="24" fill="#b7791f" fill-opacity="0.12"/>
<text x="60" y="221" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">13</text>
<text x="72" y="221" font-size="12" font-weight="700" font-family="monospace" fill="#b7791f">=======</text>
<text x="132" y="221" font-size="10.5" font-style="italic" fill="#9aa0ad">(Incoming Change)</text>
<rect x="20" y="228" width="680" height="24" fill="#6b76a8" fill-opacity="0.18"/>
<text x="60" y="245" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">14</text>
<text x="72" y="245" font-size="12" font-family="monospace" fill="#1f2430">  measure 'KPI Cards Count' = 6</text>
<rect x="20" y="252" width="680" height="24" fill="#b7791f" fill-opacity="0.12"/>
<text x="60" y="269" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">15</text>
<text x="72" y="269" font-size="12" font-weight="700" font-family="monospace" fill="#b7791f">&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/kpi-cards</text>
<text x="60" y="293" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">16</text>
<text x="72" y="293" font-size="12" font-family="monospace" fill="#1f2430">formatString: 0</text>
<line x1="20" y1="306" x2="700" y2="306" stroke="#e7e8ee"/>
<rect x="40" y="316" width="620" height="68" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<text x="56" y="340" font-size="12" font-weight="700" fill="#5b5bd6">Клікни потрібний варіант вище —</text>
<text x="56" y="360" font-size="12" fill="#1f2430">маркери &lt;&lt;&lt;, ===, &gt;&gt;&gt; зникнуть самі.</text>
</g>
</svg>`},
  sourcetree_main:{title:`Sourcetree: головне вікно і граф комітів`,
    cap:`Sourcetree — безплатний графічний клієнт Git: та сама історія комітів, тільки замість тексту в терміналі — кольоровий граф із кружечками. Ліворуч — список гілок (жирним показано активну), згори — кнопки Commit / Pull / Push замість команд у Git Bash.`,
    svg:`<svg viewBox="0 0 720 450" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs><clipPath id="cst"><rect x="20" y="20" width="680" height="410" rx="10"/></clipPath></defs>
<rect x="20" y="20" width="680" height="410" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cst)">
<rect x="20" y="20" width="680" height="32" fill="#f4f5f8"/>
<text x="40" y="41" font-size="12" font-weight="700" fill="#1f2430">Sourcetree — pbi-reports</text>
<text x="695" y="41" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<rect x="40" y="64" width="110" height="36" rx="6" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<circle cx="60" cy="82" r="9" fill="#0e9f6e"/>
<path d="M55,82 L59,86 L66,77" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<text x="78" y="86" font-size="12" font-weight="600" fill="#1f2430">Commit</text>
<rect x="160" y="64" width="100" height="36" rx="6" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<circle cx="180" cy="82" r="9" fill="#5b5bd6"/>
<path d="M180,76 L180,88 M175,83 L180,88 L185,83" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<text x="196" y="86" font-size="12" font-weight="600" fill="#1f2430">Pull</text>
<rect x="270" y="64" width="100" height="36" rx="6" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<circle cx="290" cy="82" r="9" fill="#5b5bd6"/>
<path d="M290,88 L290,76 M285,81 L290,76 L295,81" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<text x="306" y="86" font-size="12" font-weight="600" fill="#1f2430">Push</text>
<circle cx="366" cy="66" r="9" fill="#e5484d"/>
<text x="366" y="70" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">2</text>
<rect x="20" y="112" width="170" height="318" fill="#f4f5f8"/>
<line x1="20" y1="112" x2="700" y2="112" stroke="#e7e8ee"/>
<line x1="190" y1="112" x2="190" y2="430" stroke="#e7e8ee"/>
<text x="36" y="134" font-size="10" letter-spacing="1" font-weight="700" fill="#9aa0ad">BRANCHES</text>
<circle cx="36" cy="165" r="4" fill="#5b5bd6"/>
<text x="50" y="169" font-size="12" font-family="monospace" fill="#5b5bd6">main</text>
<rect x="20" y="178" width="170" height="26" fill="#6b76a8" fill-opacity="0.15"/>
<circle cx="36" cy="191" r="4" fill="#6b76a8"/>
<text x="50" y="195" font-size="10.5" font-weight="700" font-family="monospace" fill="#6b76a8">feature/kpi-cards</text>
<text x="226" y="134" font-size="10" font-weight="700" fill="#9aa0ad">GRAPH</text>
<text x="340" y="134" font-size="10" font-weight="700" fill="#9aa0ad">DESCRIPTION</text>
<line x1="210" y1="142" x2="700" y2="142" stroke="#e7e8ee"/>
<line x1="240" y1="238" x2="240" y2="318" stroke="#5b5bd6" stroke-width="2.5"/>
<line x1="300" y1="158" x2="300" y2="198" stroke="#6b76a8" stroke-width="2.5"/>
<path d="M300,198 C300,213 260,223 240,238" fill="none" stroke="#6b76a8" stroke-width="2.5"/>
<circle cx="300" cy="158" r="10" fill="none" stroke="#6b76a8" stroke-width="1.5" stroke-dasharray="2 2"/>
<circle cx="300" cy="158" r="7" fill="#6b76a8" stroke="#ffffff" stroke-width="2"/>
<text x="340" y="162" font-size="11"><tspan font-family="monospace" fill="#9aa0ad">a3f21c9</tspan><tspan fill="#1f2430" dx="8">Додав KPI-картки</tspan></text>
<rect x="565" y="150" width="115" height="18" rx="9" fill="#6b76a8" fill-opacity="0.15" stroke="#6b76a8"/>
<text x="622" y="163" font-size="9.5" font-weight="700" fill="#6b76a8" text-anchor="middle">feature/kpi-cards</text>
<circle cx="300" cy="198" r="7" fill="#6b76a8" stroke="#ffffff" stroke-width="2"/>
<text x="340" y="202" font-size="11"><tspan font-family="monospace" fill="#9aa0ad">9c04e21</tspan><tspan fill="#1f2430" dx="8">Виправив формат чисел</tspan></text>
<circle cx="240" cy="238" r="7" fill="#5b5bd6" stroke="#ffffff" stroke-width="2"/>
<text x="340" y="242" font-size="11"><tspan font-family="monospace" fill="#9aa0ad">5e19a02</tspan><tspan fill="#1f2430" dx="8">Нове джерело даних</tspan></text>
<rect x="600" y="230" width="50" height="18" rx="9" fill="#5b5bd6" fill-opacity="0.15" stroke="#5b5bd6"/>
<text x="625" y="243" font-size="9.5" font-weight="700" fill="#5b5bd6" text-anchor="middle">main</text>
<circle cx="240" cy="278" r="7" fill="#5b5bd6" stroke="#ffffff" stroke-width="2"/>
<text x="340" y="282" font-size="11"><tspan font-family="monospace" fill="#9aa0ad">22b6f10</tspan><tspan fill="#1f2430" dx="8">Виправив назву міри</tspan></text>
<circle cx="240" cy="318" r="7" fill="#5b5bd6" stroke="#ffffff" stroke-width="2"/>
<text x="340" y="322" font-size="11"><tspan font-family="monospace" fill="#9aa0ad">0a1c3f4</tspan><tspan fill="#1f2430" dx="8">Initial commit</tspan></text>
<rect x="210" y="346" width="470" height="56" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<text x="226" y="368" font-size="12" font-weight="700" fill="#5b5bd6">Це той самий git log --graph —</text>
<text x="226" y="388" font-size="12" fill="#1f2430">тільки клацаєш мишкою, а не читаєш термінал.</text>
</g>
</svg>`},
  pbip_conflict:{title:`Конфлікт у PBIP-проєкті очима Power BI-розробника`,
    cap:`Такий конфлікт виникає, коли колега вже влив зміни в main, а ти паралельно правив ту саму міру у своїй гілці. Power BI Desktop файл із маркерами &lt;&lt;&lt;, === та &gt;&gt;&gt; НЕ відкриє — спершу розв'яжи конфлікт у текстовому редакторі, і лише потім відкривай звіт.`,
    svg:`<svg viewBox="0 0 720 530" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="cpcfTop"><rect x="20" y="20" width="680" height="182" rx="10"/></clipPath>
<clipPath id="cpcfEdit"><rect x="20" y="212" width="680" height="192" rx="10"/></clipPath>
<marker id="arr-pcfA" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#5b5bd6"/></marker>
<marker id="arr-pcfB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#6b76a8"/></marker>
</defs>
<rect x="20" y="20" width="680" height="182" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cpcfTop)">
<text x="360" y="36" font-size="11" font-weight="700" fill="#9aa0ad" text-anchor="middle" letter-spacing="0.5">ЧОМУ ВИНИКАЄ КОНФЛІКТ</text>
<rect x="46" y="46" width="290" height="72" rx="8" fill="#5b5bd6" fill-opacity="0.08" stroke="#5b5bd6" stroke-width="1.5"/>
<rect x="60" y="54" width="52" height="18" rx="9" fill="#5b5bd6" fill-opacity="0.15" stroke="#5b5bd6"/>
<text x="86" y="67" font-size="10" font-weight="700" font-family="monospace" fill="#5b5bd6" text-anchor="middle">main</text>
<text x="60" y="93" font-size="12.5" font-weight="700" fill="#1f2430">Колега в main:</text>
<text x="60" y="111" font-size="12" fill="#1f2430">змінив міру Total Sales</text>
<rect x="384" y="46" width="290" height="72" rx="8" fill="#6b76a8" fill-opacity="0.1" stroke="#6b76a8" stroke-width="1.5"/>
<rect x="398" y="54" width="110" height="18" rx="9" fill="#6b76a8" fill-opacity="0.18" stroke="#6b76a8"/>
<text x="453" y="67" font-size="10" font-weight="700" font-family="monospace" fill="#6b76a8" text-anchor="middle">feature/kpi</text>
<text x="398" y="93" font-size="12.5" font-weight="700" fill="#1f2430">Ти у feature/kpi:</text>
<text x="398" y="111" font-size="12" fill="#1f2430">змінив ту саму міру</text>
<path d="M191,118 C191,145 300,145 351,132" fill="none" stroke="#5b5bd6" stroke-width="2" marker-end="url(#arr-pcfA)"/>
<path d="M529,118 C529,145 420,145 369,132" fill="none" stroke="#6b76a8" stroke-width="2" marker-end="url(#arr-pcfB)"/>
<path d="M349,128 L360,128 L367,135 L367,150 L349,150 Z" fill="#9aa0ad" fill-opacity="0.55"/>
<path d="M360,128 L360,135 L367,135 Z" fill="#ffffff" fill-opacity="0.7"/>
<text x="358" y="172" font-size="12" font-weight="800" font-family="monospace" fill="#1f2430" text-anchor="middle">model.tmdl</text>
<text x="358" y="190" font-size="10.5" font-weight="700" fill="#b7791f" text-anchor="middle">обидва торкались цього файлу → конфлікт</text>
</g>
<rect x="20" y="212" width="680" height="192" rx="10" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#cpcfEdit)">
<rect x="20" y="212" width="680" height="28" fill="#f4f5f8"/>
<text x="40" y="230" font-size="11.5" font-weight="700" font-family="monospace" fill="#1f2430">definition/model.tmdl</text>
<text x="695" y="230" font-size="12" fill="#9aa0ad" text-anchor="end">—  ▢  ✕</text>
<text x="60" y="256" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">39</text>
<text x="72" y="256" font-size="12" font-family="monospace" fill="#1f2430">measure 'Total Sales' =</text>
<rect x="20" y="262" width="680" height="22" fill="#b7791f" fill-opacity="0.12"/>
<text x="60" y="278" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">40</text>
<text x="72" y="278" font-size="12" font-weight="700" font-family="monospace" fill="#b7791f">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</text>
<text x="230" y="278" font-size="10" font-style="italic" fill="#9aa0ad">(колега, main)</text>
<rect x="20" y="284" width="680" height="22" fill="#5b5bd6" fill-opacity="0.12"/>
<text x="60" y="300" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">41</text>
<text x="72" y="300" font-size="12" font-family="monospace" fill="#1f2430">    SUM(Sales[Amount])</text>
<rect x="20" y="306" width="680" height="22" fill="#b7791f" fill-opacity="0.12"/>
<text x="60" y="322" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">42</text>
<text x="72" y="322" font-size="12" font-weight="700" font-family="monospace" fill="#b7791f">=======</text>
<rect x="20" y="328" width="680" height="22" fill="#6b76a8" fill-opacity="0.18"/>
<text x="60" y="344" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">43</text>
<text x="72" y="344" font-size="11.5" font-family="monospace" fill="#1f2430">    SUMX(Sales, Sales[Amount] * (1 - Sales[Discount]))</text>
<rect x="20" y="350" width="680" height="22" fill="#b7791f" fill-opacity="0.12"/>
<text x="60" y="366" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">44</text>
<text x="72" y="366" font-size="12" font-weight="700" font-family="monospace" fill="#b7791f">&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/kpi</text>
<text x="270" y="366" font-size="10" font-style="italic" fill="#9aa0ad">(ти, feature/kpi)</text>
<text x="60" y="388" font-size="10.5" font-family="monospace" fill="#9aa0ad" text-anchor="end">45</text>
<text x="72" y="388" font-size="12" font-family="monospace" fill="#1f2430">    formatString: "#,##0"</text>
</g>
<rect x="20" y="414" width="680" height="100" rx="8" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<circle cx="40" cy="432" r="8" fill="#0e9f6e"/>
<path d="M36,432 L39,436 L45,428" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<text x="56" y="436" font-size="12" font-weight="700" fill="#1f2430">Це НЕ поламаний файл — Git чесно показує обидві версії.</text>
<circle cx="40" cy="463" r="8" fill="#b7791f"/>
<text x="40" y="467" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">!</text>
<text x="56" y="458" font-size="12" fill="#1f2430">Обери правильну ФОРМУЛУ (може, варто об'єднати обидві ідеї),</text>
<text x="56" y="478" font-size="12" fill="#1f2430">прибери маркери, збережи →</text>
<text x="56" y="498" font-size="12" font-weight="700" font-family="monospace" fill="#5b5bd6">git add → git commit</text>
</svg>`},
  remote_concept:{title:`Локальний репозиторій і сервер (origin): хто де`,
    cap:`Приклад із Power BI: PBIP-проєкт звіту лежить локально в кожного розробника — з ним можна працювати офлайн. А спільна, «офіційна» версія, яку бачить уся команда, лежить на сервері (origin) і оновлюється лише тоді, коли хтось явно робить push.`,
    svg:`<svg viewBox="0 0 720 350" xmlns="http://www.w3.org/2000/svg" font-family="Inter,Segoe UI,sans-serif">
<defs>
<clipPath id="crc"><rect x="10" y="10" width="700" height="330" rx="14"/></clipPath>
<marker id="rc-arrP" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#5b5bd6"/></marker>
<marker id="rc-arrB" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#4f6bed"/></marker>
<marker id="rc-arrG" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10Z" fill="#9aa0ad"/></marker>
</defs>
<rect x="10" y="10" width="700" height="330" rx="14" fill="#ffffff" stroke="#e7e8ee" stroke-width="1.5"/>
<g clip-path="url(#crc)">
<text x="360" y="32" font-size="11" font-weight="700" letter-spacing="0.5" fill="#9aa0ad" text-anchor="middle">ЯК ПРАЦЮЄ ОБМІН ІЗ СЕРВЕРОМ</text>
<rect x="24" y="48" width="160" height="160" rx="10" fill="#5b5bd6" fill-opacity="0.07" stroke="#5b5bd6" stroke-width="1.5"/>
<rect x="82" y="64" width="44" height="30" rx="3" fill="#ffffff" stroke="#5b5bd6" stroke-width="1.5"/>
<rect x="97" y="94" width="14" height="8" fill="#5b5bd6" fill-opacity="0.35"/>
<line x1="86" y1="104" x2="122" y2="104" stroke="#5b5bd6" stroke-width="2.2" stroke-linecap="round"/>
<text x="104" y="126" font-size="13.5" font-weight="800" fill="#5b5bd6" text-anchor="middle">Твій ПК</text>
<text x="104" y="145" font-size="10.5" fill="#5b6473" text-anchor="middle">Повна копія</text>
<text x="104" y="159" font-size="10.5" fill="#5b6473" text-anchor="middle">репозиторію</text>
<text x="104" y="173" font-size="10.5" font-weight="700" fill="#5b5bd6" text-anchor="middle">+ вся історія</text>
<rect x="266" y="40" width="190" height="176" rx="12" fill="#4f6bed" fill-opacity="0.08" stroke="#4f6bed" stroke-width="2"/>
<rect x="326" y="52" width="68" height="20" rx="10" fill="#4f6bed" fill-opacity="0.15" stroke="#4f6bed"/>
<text x="360" y="66" font-size="10.5" font-weight="700" font-family="monospace" fill="#4f6bed" text-anchor="middle">origin</text>
<rect x="337" y="82" width="48" height="42" rx="4" fill="#ffffff" stroke="#4f6bed" stroke-width="1.5"/>
<rect x="343" y="90" width="28" height="6" rx="1" fill="#4f6bed" fill-opacity="0.3"/>
<circle cx="379" cy="93" r="2" fill="#0e9f6e"/>
<rect x="343" y="101" width="28" height="6" rx="1" fill="#4f6bed" fill-opacity="0.3"/>
<circle cx="379" cy="104" r="2" fill="#0e9f6e"/>
<rect x="343" y="112" width="28" height="6" rx="1" fill="#4f6bed" fill-opacity="0.3"/>
<circle cx="379" cy="115" r="2" fill="#b7791f"/>
<text x="361" y="146" font-size="14.5" font-weight="800" fill="#4f6bed" text-anchor="middle">Сервер (origin)</text>
<text x="361" y="163" font-size="10.5" fill="#5b6473" text-anchor="middle">GitHub / Azure DevOps</text>
<text x="361" y="177" font-size="10.5" font-weight="700" fill="#4f6bed" text-anchor="middle">спільна копія команди</text>
<rect x="538" y="48" width="160" height="160" rx="10" fill="#6b76a8" fill-opacity="0.08" stroke="#6b76a8" stroke-width="1.5"/>
<rect x="596" y="64" width="44" height="30" rx="3" fill="#ffffff" stroke="#6b76a8" stroke-width="1.5"/>
<rect x="611" y="94" width="14" height="8" fill="#6b76a8" fill-opacity="0.35"/>
<line x1="600" y1="104" x2="636" y2="104" stroke="#6b76a8" stroke-width="2.2" stroke-linecap="round"/>
<text x="618" y="126" font-size="13.5" font-weight="800" fill="#6b76a8" text-anchor="middle">ПК колеги</text>
<text x="618" y="145" font-size="10.5" fill="#5b6473" text-anchor="middle">Своя повна</text>
<text x="618" y="159" font-size="10.5" fill="#5b6473" text-anchor="middle">копія</text>
<text x="618" y="173" font-size="10.5" font-weight="700" fill="#6b76a8" text-anchor="middle">+ вся історія</text>
<line x1="190" y1="97" x2="260" y2="97" stroke="#5b5bd6" stroke-width="2.2" marker-end="url(#rc-arrP)"/>
<text x="225" y="66" font-size="9" font-weight="700" font-family="monospace" fill="#5b5bd6" text-anchor="middle">git push</text>
<text x="225" y="78" font-size="8" fill="#5b6473" text-anchor="middle">відправити</text>
<text x="225" y="89" font-size="8" fill="#5b6473" text-anchor="middle">свої коміти</text>
<line x1="260" y1="150" x2="190" y2="150" stroke="#4f6bed" stroke-width="2.2" marker-end="url(#rc-arrB)"/>
<text x="225" y="166" font-size="9" font-weight="700" font-family="monospace" fill="#4f6bed" text-anchor="middle">git pull</text>
<text x="225" y="178" font-size="8" fill="#5b6473" text-anchor="middle">/ fetch</text>
<text x="225" y="189" font-size="8" fill="#5b6473" text-anchor="middle">забрати чужі</text>
<line x1="532" y1="97" x2="462" y2="97" stroke="#9aa0ad" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#rc-arrG)"/>
<text x="497" y="82" font-size="8.5" font-weight="700" font-family="monospace" fill="#9aa0ad" text-anchor="middle">git push</text>
<line x1="462" y1="150" x2="532" y2="150" stroke="#9aa0ad" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#rc-arrG)"/>
<text x="497" y="166" font-size="8.5" font-weight="700" font-family="monospace" fill="#9aa0ad" text-anchor="middle">git pull</text>
<rect x="30" y="236" width="660" height="68" rx="10" fill="#f4f5f8" stroke="#5b5bd6" stroke-width="1.5"/>
<circle cx="54" cy="256" r="9" fill="#5b5bd6"/>
<text x="54" y="260" font-size="10" font-weight="800" fill="#ffffff" text-anchor="middle">!</text>
<text x="72" y="254" font-size="12.5" font-weight="800" fill="#5b5bd6">Само нічого не синхронізується:</text>
<text x="72" y="272" font-size="12" fill="#1f2430">кожен обмін (push, pull, fetch) — окрема команда, яку запускаєш ти сам.</text>
</g>
</svg>`}
};
function buildUimock(){
  document.querySelectorAll('.uimock[data-um]').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const u=UIMOCK[el.dataset.um];
    if(!u){el.innerHTML='Схему не знайдено';return;}
    el.innerHTML=`<div class="um-title">${u.title}</div>${u.svg}<div class="um-cap">${u.cap}</div>`;
  });
}
window.__UM__={bank:UIMOCK};

/* === 15b. ІКОНКИ ПРОГРАМ (ticon) === */
const ICONS={
  git:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M13.09 23.549a1.54 1.54 0 0 1-2.18 0L.451 13.089a1.54 1.54 0 0 1 0-2.179l7.191-7.19 2.733 2.733a1.85 1.85 0 0 0 .964 2.326v6.66a1.849 1.849 0 1 0 1.54 0V8.957l2.508 2.508a1.85 1.85 0 1 0 1.09-1.09l-2.634-2.634a1.85 1.85 0 0 0-2.378-2.377L8.73 2.63 10.91.451a1.54 1.54 0 0 1 2.179 0l10.459 10.46a1.54 1.54 0 0 1 0 2.179z"/></svg>`,
  github:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  sourcetree:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M11.999 0C6.756 0 2.474 4.245 2.474 9.525c0 4.21 2.769 7.792 6.572 9.047v4.764c0 .37.295.664.664.664h4.506a.661.661 0 0 0 .664-.664v-4.764c.025-.008.049-.019.074-.027v.064c3.694-1.22 6.412-4.634 6.565-8.687.005-.124.007-.25.007-.375v-.022c0-.152-.006-.304-.013-.455C21.275 4.037 17.125 0 11.999 0Zm0 6.352a3.214 3.214 0 0 1 2.664 5.005v.002A3.218 3.218 0 0 1 12 12.775a3.212 3.212 0 0 1 0-6.424z"/></svg>`,
  vscode:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M9.5 3.5 3 12l6.5 8.5 1.9-1.5L6.4 12l5-6.99L9.5 3.5zm5 0-1.9 1.51 5 6.99-5 6.99 1.9 1.51L21 12 14.5 3.5z"/></svg>`,
  azuredevops:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 3 8.2v7.6L12 22l9-6.2V8.2L12 2zm0 2.47 6.3 4.35-6.3 2.98-6.3-2.98L12 4.47zM4.8 10.2l6.3 2.98v6.6l-6.3-4.34V10.2zm14.4 0v5.24l-6.3 4.34v-6.6l6.3-2.98z"/></svg>`,
  powerbi:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8zm6.5-5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V6zM17 14a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-5z"/></svg>`,
  terminal:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zm2 1.5v13h14v-13H5z"/><path d="M6.7 9.3a.9.9 0 0 1 1.27 0l2.3 2.3a.9.9 0 0 1 0 1.27l-2.3 2.3a.9.9 0 1 1-1.27-1.27L8.53 12 6.7 10.57a.9.9 0 0 1 0-1.27zM11.5 14.8h4.3a.9.9 0 1 1 0 1.8h-4.3a.9.9 0 1 1 0-1.8z"/></svg>`,
  folder:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.5A1.5 1.5 0 0 1 4.5 4h4.4a1.5 1.5 0 0 1 1.1.48L11.4 6H19.5A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13z"/></svg>`,
  file:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6 2.5A1.5 1.5 0 0 0 4.5 4v16A1.5 1.5 0 0 0 6 21.5h12a1.5 1.5 0 0 0 1.5-1.5V8.62a1.5 1.5 0 0 0-.44-1.06l-5.62-5.62A1.5 1.5 0 0 0 12.38 1.5H6zM6 3.5h6v4.5a1.5 1.5 0 0 0 1.5 1.5H18v10.5H6V3.5zm8 .62 3.88 3.88H14.5A.5.5 0 0 1 14 7.5V4.12z"/></svg>`,
  pbip:`<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-opacity=".35" d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.4a1.5 1.5 0 0 1 1.1.48L11.4 7H19.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-11z"/><path d="M8 16v-3a.6.6 0 0 1 1.2 0v3H8zm3.4 0v-5a.6.6 0 0 1 1.2 0v5h-1.2zm3.4 0v-7a.6.6 0 0 1 1.2 0v7h-1.2z"/></svg>`
};
ICONS.gitbash=ICONS.terminal;
function buildTicons(){
  document.querySelectorAll('.ticon[data-i]').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const svg=ICONS[el.dataset.i];
    if(svg)el.innerHTML=svg;
  });
}

/* === 16. ІНІЦІАЛІЗАЦІЯ СТОРІНКИ === */
function initPage(){
  buildPlayers();buildQuizzes();buildScenarios();
  if(typeof buildTree==='function')buildTree();
  if(typeof buildRebase==='function')buildRebase();
  if(typeof lcPlace==='function'&&document.getElementById('lcExp'))lcPlace(0);
  if(document.getElementById('glossList'))buildGlossary();
  if(document.getElementById('cheatList'))buildCheatsheet();
  if(document.getElementById('diagBox'))buildDiag();
  buildQchecks();buildCsim();buildOrders();buildTermlab();buildDiffq();buildVideos();buildTicons();buildCmdanim();buildUimock();
  colorizeDiffPre(document);
  initSearch();initCollapse();initProgress();initSecSpy();initSubsecToggle();initHighlightFromSearch();initVersionCheck();
}
window.__GFP__={PLAYERS:Object.keys(PLAYERS),QUIZ:Object.keys(QUIZ),SCEN:Object.keys(SCEN),QCHECKS:Object.keys(QCHECKS),CSIM:Object.keys(CSIM),ORDERS:Object.keys(ORDERS),TERMLAB:Object.keys(TERMLAB),DIFFQ:Object.keys(DIFFQ),ICONS:Object.keys(ICONS),CMDANIM:Object.keys(CMDANIM),UIMOCK:Object.keys(UIMOCK)};
document.addEventListener('DOMContentLoaded',initPage);
if(document.readyState!=='loading')initPage();
