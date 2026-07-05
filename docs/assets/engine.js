
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
    {q:`Куди команда <code>git add</code> переміщує зміни?`,opts:[`У робочу директорію`,`У Staging (Index)`,`Одразу на сервер`,`У готовий коміт`],correct:1,why:`git add кладе зміни у staging — проміжну зону, що формує наступний коміт.`},
    {q:`Що таке HEAD?`,opts:[`Назва сервера`,`Вказівник на поточну гілку/коміт`,`Перша гілка в списку`,`Файл налаштувань`],correct:1,why:`HEAD — вказівник на те, де ти зараз «стоїш». Зазвичай HEAD → гілка → коміт.`},
    {q:`Де фізично зберігається вся історія репозиторію?`,opts:[`У робочій директорії`,`У прихованій папці .git`,`У staging`,`На робочому столі`],correct:1,why:`Уся історія, коміти й гілки лежать у прихованій папці .git у корені репозиторію.`},
    {q:`Що таке SHA коміту?`,opts:[`Випадкове число`,`Унікальний хеш-ідентифікатор коміту`,`Назва файлу`,`Назва гілки`],correct:1,why:`SHA — 40-символьний хеш, обчислений із вмісту коміту. Це його унікальний «паспорт».`},
    {q:`Робоча директорія (Working Directory) — це...`,opts:[`Файли, які ти зараз бачиш і редагуєш на диску`,`Копія на сервері`,`Папка .git`,`Список гілок`],correct:0,why:`Working Directory — це фактичні файли проєкту на твоєму диску в поточному стані.`}
  ],
  modB:[
    {q:`feature пішла вперед, main без нових комітів. Який merge?`,opts:[`Merge-коміт із двома батьками`,`Fast-forward (пересув вказівника)`,`Завжди конфлікт`,`Rebase`],correct:1,why:`Якщо основна гілка не розходилась — Git просто пересуває вказівник уперед.`},
    {q:`Яка команда завантажує коміти з сервера, НЕ змінюючи робочі файли?`,opts:[`git pull`,`git fetch`,`git push`,`git merge`],correct:1,why:`git fetch тягне дані без злиття. git pull = fetch + merge.`},
    {q:`Що робить <code>git clone &lt;url&gt;</code>?`,opts:[`Копіює весь віддалений репозиторій на твій комп'ютер`,`Видаляє локальні файли`,`Завантажує лише один файл`,`Створює нову гілку`],correct:0,why:`clone завантажує всю історію й файли з сервера й налаштовує origin.`},
    {q:`Твій push відхилено: 'non-fast-forward'. Що зробити?`,opts:[`Завжди --force`,`Спершу pull (забрати чужі коміти), потім push`,`Видалити гілку`,`Ігнорувати`],correct:1,why:`На сервері є коміти, яких немає в тебе. Треба їх забрати (pull/--rebase), потім push.`},
    {q:`Що робить <code>git switch -c feature</code>?`,opts:[`Створює нову гілку й переходить на неї`,`Видаляє гілку`,`Робить коміт`,`Пушить на сервер`],correct:0,why:`-c = create: створити гілку й одразу перейти на неї.`},
    {q:`Що таке <code>origin</code>?`,opts:[`Стандартна назва основного віддаленого репозиторію`,`Головна гілка`,`Перший коміт`,`Тег`],correct:0,why:`origin — псевдонім URL сервера, що Git присвоює при clone.`},
    {q:`Команда <code>git config --global user.email</code> задає...`,opts:[`email автора, яким підписуються коміти`,`пароль до сервера`,`назву гілки`,`URL репозиторію`],correct:0,why:`user.name і user.email підписують кожен коміт; --global застосовує для всіх репозиторіїв користувача.`},
    {q:`<b>detached HEAD</b> — це коли...`,opts:[`HEAD вказує прямо на коміт, а не на гілку`,`немає інтернету`,`видалено main`,`конфлікт злиття`],correct:0,why:`Коміти в detached HEAD не належать гілці й можуть загубитись; рятунок — git switch -c <гілка>.`}
  ],
  modC:[
    {q:`Який режим reset ЗБЕРІГАЄ зміни у Staging?`,opts:[`--hard`,`--mixed`,`--soft`,`жоден`],correct:2,why:`--soft пересуває лише вказівник; зміни лишаються у staging.`},
    {q:`Гілка вже на сервері й спільна. Чим безпечно скасувати коміт?`,opts:[`git reset --hard`,`git revert`,`git commit --amend`,`git rebase`],correct:1,why:`revert створює НОВИЙ коміт-скасування, не переписуючи історію.`},
    {q:`Що <code>git reset --hard</code> робить з робочою директорією?`,opts:[`Нічого`,`Перезаписує її, незакомічені зміни втрачаються`,`Тільки очищає staging`,`Створює коміт`],correct:1,why:`--hard скидає всі три зони; незбережене зникає. Відновлення — лише через reflog.`},
    {q:`Ти зробив reset --hard і «втратив» коміт. Де шукати?`,opts:[`git status`,`git reflog`,`git push`,`ніде, втрачено назавжди`],correct:1,why:`reflog зберігає всі переміщення HEAD ~90 днів — звідти коміт зазвичай відновлюється.`}
  ],
  modD:[
    {q:`Чому коміт A' після rebase має новий SHA?`,opts:[`Git зламав коміт`,`Змінився батько й час → інший хеш`,`Це баг`,`SHA випадковий`],correct:1,why:`SHA рахується з вмісту, батька, автора й часу. Зміна батька → новий хеш = новий коміт.`},
    {q:`Золоте правило rebase:`,opts:[`Робити rebase лише на main`,`Не робити rebase опублікованих/спільних комітів`,`Завжди rebase замість merge`,`Rebase лише в Sourcetree`],correct:1,why:`Переписування спільної історії ламає копії колег. Rebase — для локальних комітів.`},
    {q:`У файлі бачиш <code>=======</code> між двома блоками. Що це?`,opts:[`Помилка коду`,`Маркер конфлікту: вище — твоя версія, нижче — чужа`,`Коментар`,`Кінець файлу`],correct:1,why:`Це конфлікт. Між <<< і === — HEAD, між === і >>> — гілка, що зливається.`},
    {q:`Що робить <code>git rebase --abort</code>?`,opts:[`Завершує rebase`,`Скасовує rebase і повертає все як було до старту`,`Видаляє гілку`,`Пушить`],correct:1,why:`--abort повністю відкочує rebase до початкового стану (Git зберігає його в ORIG_HEAD).`}
  ],
  modE:[
    {q:`Які файли ТРЕБА комітити в PBIP? (кілька варіантів)`,multi:true,opts:[`*.tmdl (визначення моделі)`,`cache.abf`,`localSettings.json`,`.pbip (вказівник)`,`definition/ (TMDL та PBIR)`],correct:[0,3,4],why:`Комітимо те, що ВИЗНАЧАЄ модель і звіт. cache.abf і localSettings.json — локальні, у .gitignore.`},
    {q:`Що таке TMDL?`,opts:[`Формат звіту`,`Текстова мова опису семантичної моделі`,`Тип бази даних`,`Кеш Power BI`],correct:1,why:`TMDL (Tabular Model Definition Language) — людиночитна мова з відступами для таблиць, мір, зв'язків.`},
    {q:`Що таке PBIR?`,opts:[`Модульний JSON-формат звіту`,`Мова моделі`,`Файл кешу`,`Git-інструмент`],correct:0,why:`PBIR (Power BI Enhanced Report Format) — звіт як набір JSON-файлів, що добре діфиться.`},
    {q:`Що таке lineageTag?`,opts:[`Унікальний GUID-ідентифікатор об'єкта моделі`,`Назва гілки`,`Тип міри`,`Файл`],correct:0,why:`lineageTag стабілізує ідентичність об'єкта (таблиці, міри) між середовищами.`},
    {q:`Чому для Git формат PBIP кращий за .pbix?`,opts:[`PBIP — текст, його зміни видно рядок за рядком`,`.pbix діфиться краще`,`вони однакові`,`жоден не підходить`],correct:0,why:`.pbix бінарний (один блок), PBIP — текстові файли, тому Git показує точні зміни.`},
    {q:`Коли PBIP-формат МОЖЕ бути недоречним?`,opts:[`дуже великі моделі / складні merge / окремі специфічні можливості звіту`,`завжди доречний`,`лише для малих файлів`,`ніколи`],correct:0,why:`PBIP має обмеження: великі моделі важче діфити, частину функцій звіту представлено неповно, складні merge вимагають валідації.`},
    {q:`Стек 2 для роботи з моделлю — це...`,opts:[`Tabular Editor: редагування TMDL + Best Practice Analyzer + деплой через XMLA`,`лише Power BI Desktop`,`Excel`,`SQL Server`],correct:0,why:`Tabular Editor дає точніший контроль над моделлю, BPA для якості й деплой моделі окремо від звіту.`}
  ],
  modF:[
    {q:`Чому cache.abf додають у .gitignore?`,opts:[`Він секретний`,`Важкий і машинозалежний; спричиняє type-conflict між ПК`,`Git не підтримує`,`Застарілий`],correct:1,why:`cache.abf — локальна копія моделі з даними. У репозиторії ламає відкриття на іншому ПК.`},
    {q:`Після текстового merge TMDL-конфлікту що зробити обов'язково?`,opts:[`Нічого, одразу push`,`Провалідувати модель у Desktop / Tabular Editor`,`Видалити .tmdl`,`Перейменувати гілку`],correct:1,why:`Git перевіряє лише текст. Коректний merge може дати зламану модель (дубль lineageTag).`},
    {q:`Файл усе ще відстежується, хоч доданий у .gitignore. Чому й що робити?`,opts:[`.gitignore діє лише на НЕвідстежувані; зробити git rm --cached`,`перезавантажити ПК`,`видалити .git`,`нічого не вдієш`],correct:0,why:`.gitignore не приховує вже відстежувані файли. Прибрати: git rm --cached <файл> + коміт.`},
    {q:`Два розробники змінили ту саму міру по-різному, обидві логіки потрібні. Рішення?`,opts:[`Видалити одну`,`Лишити обидві як дві окремі міри з різними назвами`,`Зробити reset`,`Видалити таблицю`],correct:1,why:`Якщо обидві логіки цінні — розвести їх у дві міри, прибравши маркери конфлікту.`},
    {q:`Як зменшити кількість конфліктів у команді?`,opts:[`Працювати в одній гілці`,`Короткоживучі feature-гілки + частий rebase на свіжий main`,`Не комітити`,`Вимкнути CI`],correct:1,why:`Маленькі гілки й частий rebase не дають історіям сильно розійтись.`},
    {q:`Терміновий фікс прод-багу треба внести, не зливаючи всю гілку розробки. Як?`,opts:[`git merge всю гілку`,`git cherry-pick потрібного коміту в prod-гілку`,`reset --hard`,`видалити main`],correct:1,why:`cherry-pick переносить лише один потрібний коміт у потрібну гілку.`},
    {q:`Формат Conventional Commits — це...`,opts:[`<type>(<scope>): <subject>, напр. feat(model): add YTD`,`будь-який вільний текст`,`лише номер задачі`,`emoji + опис`],correct:0,why:`Conventional Commits задають структуру: тип, область, короткий опис — історія стає читабельною й машинозчитуваною.`},
    {q:`Чому ця команда НЕ робить ставку на PR-review як головний бар'єр?`,opts:[`review PBIP/PBIR-діфів непрактичний; бар'єр — валідація в Desktop і CI (та поетапний деплой, якщо він налаштований)`,`PR заборонені в Git`,`review нічого не дає`,`бо немає колег`],correct:0,why:`Текстові TMDL/JSON-діфи без прев'ю звіту важко рев'ювити, тож зміни зливають у main, а гейтом є валідація перед злиттям і контрольована публікація.`}
  ],
  modG:[
    {q:`Що робить <code>git bisect</code>?`,opts:[`Бінарним пошуком знаходить коміт, що вніс баг`,`видаляє гілку`,`зливає дві гілки`,`пушить на сервер`],correct:0,why:`bisect ділить діапазон комітів навпіл; ти позначаєш good/bad, і Git швидко звужує до винного коміту.`},
    {q:`Навіщо потрібен pre-commit hook у Power BI-команді?`,opts:[`Автоматично перевіряти TMDL/JSON чи запускати BPA перед комітом`,`робити push`,`створювати гілки`,`нічого`],correct:0,why:`Hook — локальний скрипт перед комітом; не дає закомітити зламану модель чи порушення правил.`},
    {q:`Що дає <code>git worktree add</code>?`,opts:[`Окрему робочу директорію для іншої гілки без stash`,`видаляє worktree`,`архівує репо`,`створює тег`],correct:0,why:`worktree дозволяє паралельно правити hotfix в окремій папці, не чіпаючи поточні незакомічені зміни.`},
    {q:`Що робить <code>git add -p</code>?`,opts:[`Додає у staging вибрані БЛОКИ змін, а не весь файл`,`додає всі файли`,`видаляє файл`,`скасовує коміт`],correct:0,why:`Patch mode дозволяє зібрати атомарний коміт — застейджити лише пов'язані зміни, навіть якщо у файлі їх кілька.`}
  ],
  modT:[
    {q:`Що таке термінал?`,opts:[`Текстове вікно, де команди вводять словами`,`Папка з файлами`,`Браузер`,`Гра`],correct:0,why:`Термінал — текстовий інтерфейс: друкуєш команду, комп'ютер її виконує.`},
    {q:`Яка команда показує поточну папку?`,opts:[`pwd`,`cd`,`ls`,`mkdir`],correct:0,why:`pwd = print working directory — повний шлях до поточної папки.`},
    {q:`Створити папку <code>data</code> — це...`,opts:[`mkdir data`,`touch data`,`cd data`,`echo data`],correct:0,why:`mkdir створює директорію (папку).`},
    {q:`<code>cd ..</code> робить...`,opts:[`перехід на одну папку вгору`,`створення файлу`,`видалення папки`,`коміт`],correct:0,why:`Дві крапки .. — батьківська папка; cd .. піднімає на рівень вище.`},
    {q:`Перевірити, що Git встановлено:`,opts:[`git --version`,`git start`,`pwd`,`ls`],correct:0,why:`git --version показує версію або помилку, якщо Git ще не встановлено.`}
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
function buildQuizzes(){
  document.querySelectorAll('.quiz').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const qs=QUIZ[el.dataset.q];if(!qs)return;
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
function lcPlace(z){
  document.querySelectorAll('#lcZones .chiphold').forEach(h=>h.innerHTML='');
  document.querySelectorAll('#lcZones .zone').forEach(zz=>zz.classList.remove('lit'));
  const zone=document.querySelector(`#lcZones .zone[data-z="${z}"]`);if(!zone)return;
  zone.querySelector('.chiphold').innerHTML='<span class="filechip">model.tmdl</span>';zone.classList.add('lit');
}
const LC_EXP={add:'git add — зміни переміщено у Staging. Увійдуть у наступний коміт.',commit:'git commit — створено коміт у локальному репозиторії. Staging очищено.',push:'git push — коміти відправлено на сервер. Тепер їх бачить команда.',fetch:'git fetch — завантажено коміти з сервера, робочі файли не змінено.',restore:'git restore — зміни у робочій директорії відкинуто.',reset:'git reset — вказівник пересунуто; зміни повернулись у робочу директорію (mixed).'};
function lc(z,act){lcPlace(z);const e=document.getElementById('lcExp');if(e)e.textContent=LC_EXP[act];}
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
        html+=`<div class="gloss-item"><div class="gc">${cc}</div><div class="gd">${dd}${x.ex?`<span class="gex">${escapeHTML(x.ex)}</span>`:''}</div></div>`;
      });
    });
    list.innerHTML=shown?html:`<div class="gloss-empty">Нічого не знайдено</div>`;
    countEl.textContent=`Показано ${shown} з ${GIT_CMDS.length}`;
  }
  catsEl.querySelectorAll('.gloss-chip').forEach(b=>b.onclick=()=>{glossCat=b.dataset.c;catsEl.querySelectorAll('.gloss-chip').forEach(x=>x.classList.toggle('on',x===b));render();});
  searchEl.addEventListener('input',render);
  render();
}

/* === 9. ІНЛАЙН МІНІ-ВПРАВИ (qcheck) === */
const QCHECKS={
  qc_intro:{q:`Навіщо потрібен Git?`,opts:[`Зберігати версії, повертатись назад і працювати в команді`,`Малювати графіки`,`Замінити Excel`,`Прискорити інтернет`],correct:0,why:`Git — це контроль версій: історія змін, відкат назад і безпечна спільна робота над одним проєктом.`},
  qc_term_what:{q:`Що таке термінал?`,opts:[`Текстове вікно, де команди вводять словами`,`Папка з файлами`,`Веб-браузер`,`Антивірус`],correct:0,why:`Термінал (командний рядок) — текстовий інтерфейс: ти друкуєш команду, комп'ютер її виконує.`},
  qc_pwd:{q:`Що показує команда <code>pwd</code>?`,opts:[`Поточну папку, де ти зараз`,`Список файлів`,`Версію Git`,`Пароль`],correct:0,why:`pwd = print working directory — повний шлях до папки, у якій ти зараз перебуваєш.`},
  qc_cd:{q:`Куди веде <code>cd ..</code>?`,opts:[`На одну папку вгору (до батьківської)`,`У домашню папку`,`Видаляє папку`,`Нікуди`],correct:0,why:`Дві крапки .. означають «батьківська папка». cd .. піднімає на рівень вище.`},
  qc_ls:{q:`Що робить <code>ls</code>?`,opts:[`Показує вміст поточної папки`,`Створює файл`,`Робить коміт`,`Видаляє все`],correct:0,why:`ls = list: перелік файлів і папок у поточній директорії (у Windows CMD аналог — dir).`},
  qc_mkdir:{q:`Якою командою створити нову папку <code>reports</code>?`,opts:[`mkdir reports`,`cd reports`,`touch reports`,`ls reports`],correct:0,why:`mkdir = make directory. «mkdir reports» створює нову папку reports.`},
  qc_touch_echo:{q:`Чим <code>echo "text" &gt; file.txt</code> відрізняється від <code>touch file.txt</code>?`,opts:[`echo записує текст у файл; touch лише створює порожній`,`нічим`,`touch записує текст`,`echo видаляє файл`],correct:0,why:`touch створює порожній файл; echo "..." &gt; file.txt створює файл і кладе в нього текст (&gt; перезаписує, &gt;&gt; додає).`},
  qc_paths:{q:`Що означає <code>.</code> (одна крапка) у шляху?`,opts:[`Поточна папка`,`Батьківська папка`,`Домашня папка`,`Корінь диска`],correct:0,why:`. — поточна папка; .. — на рівень вище; ~ — домашня папка.`},
  qc_tab:{q:`Навіщо тиснути клавішу Tab у терміналі?`,opts:[`Автодоповнення назв файлів і папок`,`Очистити екран`,`Скасувати команду`,`Закрити термінал`],correct:0,why:`Tab доповнює назву; стрілка ↑ повертає попередню команду. Це економить час і прибирає помилки в назвах.`},
  qc_install:{q:`Як перевірити, що Git встановлено?`,opts:[`git --version`,`git install`,`git check`,`pwd`],correct:0,why:`git --version виводить встановлену версію. Якщо команда невідома — Git ще не встановлено.`},
  qc_a_zones:{q:`Яка правильна послідовність зон при коміті?`,opts:[`working dir → staging (add) → repo (commit)`,`commit → add → push`,`repo → staging → working`,`порядку немає`],correct:0,why:`Спершу правки в робочій папці, потім git add у staging, потім git commit зберігає їх у репозиторій.`},
  qc_a_snapshot:{q:`Як Git зберігає коміт?`,opts:[`Як повний знімок стану (незмінні файли — посилання)`,`Лише різницю рядків`,`Як архів zip`,`Ніяк`],correct:0,why:`Git — snapshot-based: знімок усього проєкту; незмінені файли зберігаються як посилання на попередні версії.`}
};
function buildQchecks(){
  document.querySelectorAll('.qcheck').forEach(el=>{
    if(el.dataset.built)return;el.dataset.built='1';
    const q=QCHECKS[el.dataset.qc];if(!q)return;
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
  qc_rm:{q:`Чим небезпечна команда <code>rm -r folder</code>?`,opts:[`Видаляє папку з усім вмістом без кошика`,`Нічим`,`Лише перейменовує`,`Робить копію`],correct:0,why:`rm видаляє безповоротно — «Кошика» немає. Перед rm -r двічі перевіряй шлях.`},
  qc_auth:{q:`Публічний SSH-ключ...`,opts:[`додається на сервер; приватний лишається тільки в тебе`,`надсилається колегам у чат`,`це те саме, що пароль`,`комітиться в репозиторій`],correct:0,why:`Пара ключів: публічний (замок) — на сервер, приватний (ключ) — нікому й ніколи.`},
  qc_fetch:{q:`Чим <code>git fetch</code> відрізняється від <code>git pull</code>?`,opts:[`fetch лише завантажує зміни; pull = fetch + одразу merge у твою гілку`,`нічим`,`fetch видаляє гілки`,`pull працює без інтернету`],correct:0,why:`fetch безпечно оновлює знання про сервер (origin/main), не чіпаючи твої файли; pull ще й зливає.`}
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
  qc_why_git:{q:`Головна проблема, яку Git знімає для Power BI-розробника?`,opts:[`Копії "v7_final_FINAL" і страх зламати звіт без вороття`,`Повільний DAX`,`Розмір моделі`,`Вартість ліцензій`],correct:0,why:`Git дає історію версій і безпечні експерименти в гілках — копії файлів і страх зникають.`},
  qc_terms:{q:`Коміт — це...`,opts:[`збережений знімок стану проєкту з описом`,`синонім гілки`,`папка на сервері`,`файл .pbix`],correct:0,why:`Коміт = знімок усього проєкту в момент часу + повідомлення, хто/що/навіщо.`},
  qc_config:{q:`Навіщо в PBIP-репозиторії .gitattributes з <code>* text=auto</code>?`,opts:[`Вирівнює кінці рядків (CRLF/LF) — зникають фантомні diff між машинами`,`Прискорює push`,`Шифрує файли`,`Вимикає merge`],correct:0,why:`Різні ОС/редактори пишуть різні кінці рядків; без нормалізації diff показує «змінився весь файл».`},
  qc_addp:{q:`<code>git add -p</code> дозволяє...`,opts:[`додати у staging лише частину змін файлу (по шматках)`,`видалити файл з диска`,`відправити зміни на сервер`,`створити гілку`],correct:0,why:`-p (patch) проходить по шматках змін і питає, які саме класти в коміт — основа атомарних комітів.`},
  qc_irebase:{q:`Дія <code>squash</code> в interactive rebase — це...`,opts:[`злити кілька комітів в один`,`видалити гілку`,`перейменувати файл`,`скасувати push`],correct:0,why:`squash склеює коміт із попереднім — так «wip, wip, fix» перетворюється на один чистий коміт.`},
  qc_pbip_what:{q:`Чому PBIP дружить із Git, а .pbix — ні?`,opts:[`PBIP — текстові файли (JSON/TMDL), які порівнюються построково; .pbix — бінарний архів`,`PBIP просто менший`,`.pbix не відкривається у Desktop`,`PBIP швидше рендерить візуали`],correct:0,why:`Git ефективний лише з текстом: видно diff, працює merge. Бінарник — чорна скринька.`},
  qc_tmdl_fmt:{q:`Семантична модель у PBIP описується у форматі...`,opts:[`TMDL — текстовому, окремий файл на таблицю`,`PBIR`,`бінарному XMLA-дампі`,`.pbix`],correct:0,why:`TMDL (Tabular Model Definition Language) — читабельний текст: таблиці, міри, зв'язки по файлах.`},
  qc_limits:{q:`Про яке обмеження PBIP треба пам'ятати?`,opts:[`Дані (кеш) не версіонуються — у Git лише визначення моделі та звіту`,`PBIP не підтримує міри`,`PBIP працює лише на macOS`,`PBIP забороняє гілки`],correct:0,why:`У репозиторії — «креслення» (метадані). Дані тягнуться з джерел при refresh.`},
  qc_te:{q:`Роль BPA (Best Practice Analyzer) у Tabular Editor:`,opts:[`автоматична перевірка моделі на анти-патерни за набором правил`,`рендер візуалів звіту`,`деплой у Fabric`,`резервне копіювання даних`],correct:0,why:`BPA проганяє модель по правилах (назви, формати, зайві колонки…) — зручно і локально, і в CI.`},
  qc_ignore:{q:`Що з цього МАЄ бути у .gitignore PBIP-репозиторію?`,opts:[`Кеш і локальне: cache.abf, localSettings.json, *.pbix`,`definition/*.tmdl`,`сам файл .pbip`,`папка pages/`],correct:0,why:`Версіонуємо визначення; кеш даних і персональні налаштування — шум і зайві мегабайти.`},
  qc_conflict_pbip:{q:`Конфлікт у measure.tmdl: маркери &lt;&lt;&lt;&lt;&lt;&lt;&lt; ======= &gt;&gt;&gt;&gt;&gt;&gt;&gt; прибрано, лишилась потрібна версія міри. Наступний крок?`,opts:[`git add файл, потім git commit`,`git push одразу`,`видалити файл`,`git revert`],correct:0,why:`Вирішений конфлікт треба зафіксувати: add позначає «вирішено», commit завершує merge.`},
  qc_ref30:{q:`Симптом «модель не відкривається після merge» найчастіше означає...`,opts:[`дубль lineageTag — GUID має бути унікальним (кейс 1)`,`зламаний DAX`,`завеликий файл`,`відсутній інтернет`],correct:0,why:`При merge двох гілок легко отримати два об'єкти з однаковим lineageTag — Desktop відмовляється відкривати.`},
  qc_conv:{q:`Добре повідомлення коміту:`,opts:[`fix: correct YTD filter in Sales measure`,`зміни`,`final2`,`asdf`],correct:0,why:`Тип (fix/feat/chore) + що саме змінено. Через рік це єдина документація.`},
  qc_flows:{q:`Для невеликої PBI-команди зазвичай достатньо...`,opts:[`Feature Branch: короткі гілки від main і назад у main`,`повного Gitflow з develop/release/hotfix`,`пушити всім напряму в main`,`окремих форків на кожного`],correct:0,why:`Простий цикл гілка → merge → деплой покриває потреби; Gitflow — для великих релізних циклів.`},
  qc_devops:{q:`Build validation policy в Azure DevOps — це...`,opts:[`автоматичний запуск pipeline (напр., BPA) перед злиттям у main`,`ручний перегляд колегою`,`деплой у Prod`,`нічне резервне копіювання`],correct:0,why:`Політика ганяє перевірки автоматично — бар'єр якості без обов'язкового людського рев'ю.`},
  qc_security:{q:`Секрет потрапив у коміт і вже на сервері. Найперший крок:`,opts:[`Негайно ротувати (замінити) сам секрет`,`видалити файл наступним комітом`,`нічого, ніхто не побачить`,`перейменувати гілку`],correct:0,why:`Історія зберігає все — секрет уже скомпрометований. Спершу ротація, потім чистка історії (кейс 26).`},
  qc_hooks:{q:`pre-commit hook спрацьовує...`,opts:[`локально перед створенням коміту — і може його заблокувати`,`на сервері після push`,`раз на добу за розкладом`,`лише в гілці main`],correct:0,why:`Hook — скрипт-«охоронець» на твоїй машині: не пройшла перевірка — коміт не створюється.`},
  qc_worktree:{q:`<code>git worktree add</code> дозволяє...`,opts:[`мати другу робочу папку з іншою гілкою одночасно`,`клонувати репозиторій заново`,`видалити гілку`,`злити два репозиторії`],correct:0,why:`Термінові hotfix без stash: main в одній папці, feature — в іншій, репозиторій один.`}
});

/* дані модуля 00: інструменти та інфраструктура */
Object.assign(QCHECKS,{
  qc_toolmap:{q:`Git, Azure DevOps Repos і Sourcetree — це відповідно...`,opts:[`двигун версій · сервер-сховище репозиторіїв · графічний клієнт`,`три назви одного продукту`,`редактор звітів · база даних · месенджер`,`термінал · редактор · хмарний диск`],correct:0,why:`Git робить усю роботу з версіями локально; хостинг (Azure DevOps або GitHub) зберігає спільну копію; Sourcetree — лише зручні кнопки поверх Git.`},
  qc_gitbash:{q:`Git Bash — це...`,opts:[`термінал для Windows з Unix-командами, який встановлюється разом із Git`,`окрема система контролю версій`,`редактор коду від Microsoft`,`сервіс для зберігання репозиторіїв`],correct:0,why:`Git Bash дає на Windows той самий термінал, що й на Linux/macOS: усі команди курсу вводяться саме тут.`},
  qc_hosting:{q:`GitHub і Azure DevOps Repos — це...`,opts:[`хостинги Git-репозиторіїв: сервер-сховище і вебінтерфейс поверх того самого Git`,`заміна Git — інша система версій`,`редактори TMDL-файлів`,`аналоги Power BI Service`],correct:0,why:`Обидва зберігають ту саму Git-історію. Різниця — в екосистемі довкола: у компаніях з Microsoft-стеком зазвичай Azure DevOps.`},
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
  qc_detached:{q:`Ти зробив <code>git checkout a1b2c3d</code>, щоб глянути стару версію звіту, і випадково закомітив правку. Як не втратити цей коміт?`,opts:[`git switch -c rescue — закріпити коміт новою гілкою, поки не перемкнувся`,`нічого робити не треба — коміт і так у безпеці`,`git reset --hard main`,`закрити термінал і відкрити знову`],correct:0,why:`У detached HEAD новий коміт не належить жодній гілці: перемкнешся — і він осиротіє. Гілка-закладка (switch -c) робить його видимим назавжди.`},
  qc_revert_deep:{q:`Коміт зі зламаною мірою вже в main і на сервері. Чому саме revert, а не reset?`,opts:[`revert додає новий коміт-скасування і не переписує спільну історію — колеги просто заберуть його через pull`,`revert швидший за reset`,`reset не працює в main`,`різниці немає`],correct:0,why:`reset пересунув би main назад — а колеги вже мають старі коміти, і їхні копії розійдуться з сервером. revert рухає історію лише вперед.`},
  qc_reflog_deep:{q:`Після <code>git reset --hard</code> зник коміт з готовою сторінкою звіту. Перший крок порятунку?`,opts:[`git reflog — знайти SHA зниклого коміту в журналі переміщень HEAD`,`створити сторінку заново в Power BI Desktop`,`git push --force`,`перевстановити Git`],correct:0,why:`reflog памʼятає кожну позицію HEAD близько 90 днів. Знайшов SHA — і повертаєшся: git reset --hard &lt;sha&gt; або git branch rescue &lt;sha&gt;.`},
  qc_amend:{q:`Щойно закомітив, але забув один файл, а push ще не робив. Найчистіший спосіб?`,opts:[`git add файл → git commit --amend — файл доїде тим самим комітом`,`ще один коміт з повідомленням "забув файл"`,`git push --force`,`видалити репозиторій і почати заново`],correct:0,why:`--amend переробляє останній коміт (з новим SHA). Поки коміт не запушено — це безпечно й тримає історію чистою.`}
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
  qc_fabric_sync:{q:`У панелі Source control робочої області видно статус «Update required». Що це означає?`,opts:[`у гілці зʼявились нові коміти, яких ще немає в області — натисни Update from Git`,`звіт зламався, його треба видалити й опублікувати заново`,`закінчилась ліцензія`,`дані застаріли — потрібен refresh`],correct:0,why:`Статуси Source control порівнюють область із гілкою: Update required = гілка попереду. Update from Git підтягне зміни — це і є звичайна публікація.`},
  qc_ws_uncommitted:{q:`Панель Source control показує Uncommitted changes: хтось відредагував звіт прямо у Power BI Service. Безпечна реакція?`,opts:[`зʼясувати, чия зміна: потрібну — Commit у гілку, випадкову — Undo; не лишати висіти`,`одразу Update from Git — зміни самі зникнуть`,`видалити робочу область`,`нічого не робити, само розсмокчеться`],correct:0,why:`Незакомічені зміни в області конфліктуватимуть із наступною синхронізацією. Джерело правди — Git, тож зміну або повертають у гілку, або відкидають.`},
  qc_diff_noise:{q:`Після збереження у Power BI Desktop diff показує зміну <code>lineageTag</code> у таблиці, якої ти не торкався. Що це?`,opts:[`технічний шум перегенерації — логіка не змінилась; головне переконатися, що змістовних правок у файлі немає`,`хтось непомітно зламав модель`,`Git неправильно порахував diff`,`вірус у репозиторії`],correct:0,why:`lineageTag — службовий GUID, Desktop подекуди перегенеровує його при збереженні. Навчись відрізняти такий шум від справжніх змін DAX чи структури.`},
  qc_diff_real:{q:`У diff файлу <code>tables/Sales.tmdl</code>: рядок <code>- SUM(Sales[Amount])</code> замінено на <code>+ CALCULATE(SUM(Sales[Amount]), USERELATIONSHIP(…))</code>. Це...`,opts:[`справжня зміна логіки міри — саме її треба описати в повідомленні коміту`,`технічний шум збереження`,`зміна кольору візуала`,`перейменування файлу`],correct:0,why:`Зміна DAX-виразу — зміст. Шум (lineageTag, координати візуалів) у повідомленні не описують, а от зміну логіки — обовʼязково.`},
  qc_pbix_migrate:{q:`Опублікований звіт переводять із .pbix на PBIP. Правильний порядок?`,opts:[`відкрити .pbix у Desktop → Save As → PBIP у папку репозиторію → commit і push → підключити робочу область до гілки`,`видалити звіт із Service і створити з нуля`,`просто перейменувати файл .pbix на .pbip`,`експортувати звіт у PDF і закомітити його`],correct:0,why:`Save As створює текстову структуру PBIP; далі звичайний Git-цикл. Якщо назви елементів збігаються, підключення області до гілки збереже наявний звіт і його налаштування.`},
  qc_thin_report:{q:`Тонкий звіт (live connection до спільної моделі) зберегли як PBIP. Що зʼявиться в репозиторії?`,opts:[`лише папка .Report із definition.pbir — власної семантичної моделі тонкий звіт не має`,`і .Report, і .SemanticModel`,`один бінарний файл`,`нічого: тонкі звіти не підтримують PBIP`],correct:0,why:`Модель у тонкого звіту живе окремо (спільний датасет), тож у PBIP комітиться тільки звітна частина з посиланням на модель.`},
  qc_refresh_creds:{q:`Після першої синхронізації робочої області звіт порожній, а датасет просить credentials. Чому?`,opts:[`так і має бути: Git привіз лише визначення — дані зʼявляться після налаштування credentials і refresh`,`синхронізація зламала звіт, треба відкотити коміт`,`Git видалив дані з джерела`,`потрібно перевстановити Power BI Desktop`],correct:0,why:`У репозиторії — «креслення» моделі та звіту. Дані наповнюються в Service: credentials джерел, за потреби gateway, потім refresh.`},
  qc_capstone:{q:`У практикумі після git init команда git status показує cache.abf серед untracked-файлів. Про що це сигналить?`,opts:[`.gitignore відсутній або не збережений — кеш мав бути прихований від Git`,`усе гаразд, кеш і має бути в списку`,`Git пошкоджено, перевстанови`,`файл треба негайно закомітити`],correct:0,why:`Desktop створює .gitignore разом із PBIP. Якщо кеш видно у status — перевір, що .gitignore лежить у корені й містить **/.pbi/cache.abf.`},
  qc_blame:{q:`Міра тиждень тому рахувала інакше. Найшвидший шлях зʼясувати, хто і коли її змінив?`,opts:[`git blame файлу міри або History / Annotate у веб-інтерфейсі Azure DevOps`,`опитати всіх колег у чаті`,`відкривати по черзі старі копії .pbix`,`git push --force`],correct:0,why:`blame показує автора й коміт для кожного рядка файлу; у вебі те саме дає Annotate — без термінала.`}
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

/* === 16. ІНІЦІАЛІЗАЦІЯ СТОРІНКИ === */
function initPage(){
  buildPlayers();buildQuizzes();buildScenarios();
  if(typeof buildTree==='function')buildTree();
  if(typeof buildRebase==='function')buildRebase();
  if(typeof lcPlace==='function'&&document.getElementById('lcExp'))lcPlace(0);
  if(document.getElementById('glossList'))buildGlossary();
  buildQchecks();buildCsim();buildOrders();buildVideos();
  initSearch();initCollapse();initProgress();initHighlightFromSearch();initVersionCheck();
}
window.__GFP__={PLAYERS:Object.keys(PLAYERS),QUIZ:Object.keys(QUIZ),SCEN:Object.keys(SCEN),QCHECKS:Object.keys(QCHECKS),CSIM:Object.keys(CSIM),ORDERS:Object.keys(ORDERS)};
document.addEventListener('DOMContentLoaded',initPage);
if(document.readyState!=='loading')initPage();
