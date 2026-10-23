import fs from 'node:fs';
import path from 'node:path';

// node render_catalog.mjs catalog.json output-directory
const [input, output] = process.argv.slice(2);
if (!input || !output) throw Error('用法：node render_catalog.mjs <catalog.json> <输出文件夹>');
const data = JSON.parse(fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, ''));
const need = (ok, message) => { if (!ok) throw Error(message); };
const http = u => { try { return ['http:', 'https:'].includes(new URL(u).protocol); } catch { return false; } };
const clean = s => String(s ?? '').trim();
const esc = s => clean(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const mdText = s => clean(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replace(/[\\`*_\[\]|]/g, '\\$&').replace(/[\r\n]+/g, ' ');
const mdLink = (label,url) => `[${mdText(label)}](<${url.replaceAll('>','%3E').replaceAll('<','%3C')}>)`;
need(clean(data.journal) && clean(data.scope) && /^\d{4}-\d{2}-\d{2}$/.test(data.retrieved), '缺少期刊、范围或检索日期');
need(Array.isArray(data.issues) && data.issues.length > 0, '没有卷期');
const ids = new Set(), urls = new Set(), dois = new Set();
const types = {};
let total = 0;
for (const issue of data.issues) {
  need(clean(issue.id) && !ids.has(issue.id), '卷期ID为空或重复'); ids.add(issue.id);
  need(clean(issue.label) && clean(issue.status), `${issue.id}缺少名称或状态`);
  need(Array.isArray(issue.sources) && issue.sources.length && issue.sources.every(s=>http(s.url)), `${issue.id}缺少有效来源`);
  need(Array.isArray(issue.articles), `${issue.id}缺少条目数组`);
  if (issue.sourceCount != null) need(issue.sourceCount === issue.articles.length, `${issue.id}条目数与来源计数不匹配`);
  for (const a of issue.articles) {
    need(clean(a.english) && clean(a.chinese), `${issue.id}存在空题名或缺失译文`);
    need(http(a.url), `${issue.id}存在无效论文链接`);
    const urlKey = new URL(a.url); urlKey.hash = ''; urlKey.search = '';
    const uk = urlKey.href.replace(/\/$/, '');
    need(!urls.has(uk), `重复论文链接：${a.url}`); urls.add(uk);
    if (clean(a.doi)) {
      const dk = clean(a.doi).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').toLowerCase();
      need(/^10\.\d{4,9}\/\S+$/.test(dk) && !dois.has(dk), `DOI无效或重复：${a.doi}`); dois.add(dk);
    }
    a.type = clean(a.type) || '其他'; types[a.type] = (types[a.type] || 0) + 1; total++;
  }
}
const notes = ['中文题名为本次整理译文，非期刊官方译名。作者按目录来源显示；省略号不代表完整作者名单。', ...(data.notes || [])];
const root = path.resolve(output);
fs.mkdirSync(root, {recursive:true});
const files = ['目录导览.md', '目录导览.html', '目录数据.json'];
for (const f of files) need(!fs.existsSync(path.join(root,f)), `输出文件已存在，请改用新文件夹：${f}`);
const heading = `${data.journal}${data.journalZh ? '｜'+data.journalZh : ''}`;
const md = [`# ${mdText(heading)} 中英文目录`, '', `范围：${mdText(data.scope)}  `, `检索日期：${data.retrieved}｜${data.issues.length}组卷期｜${total}条`, '', ...notes.map(n=>`> ${mdText(n)}`), '', '| 卷期 | 出版标注 | 状态 | 条目数 |', '|---|---|---|---:|', ...data.issues.map((s,i)=>`| [${mdText(s.label)}](#issue-${i}) | ${mdText(s.date)} | ${mdText(s.status)} | ${s.articles.length} |`), ''];
data.issues.forEach((s,i)=>{
  md.push(`<a id="issue-${i}"></a>`, `## ${mdText(s.label)}｜${mdText(s.date)}`, '', `状态：${mdText(s.status)}｜${s.articles.length}条`, '', s.sources.map(x=>mdLink(x.label||'目录来源',x.url)).join(' · '), '');
  s.articles.forEach((a,j)=>{
    md.push(`### ${j+1}. ${mdText(a.chinese)}`, '', `**English:** ${mdText(a.english)}`, '', `**作者：** ${mdText(a.authors||'目录页未列')}  `, `**类型：** ${mdText(a.type)}${a.number?'｜文章号：'+mdText(a.number):''}${a.pages?'｜页码：'+mdText(a.pages):''}${a.part?'｜分册：'+mdText(a.part):''}  `, mdLink('论文原文',a.url)+(a.doi?'｜DOI：'+mdText(a.doi):''), '', ...(a.notes?[`注：${mdText(a.notes)}`,'']:[]));
  });
});
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(data.journal)} · 目录导览</title><style>
*{box-sizing:border-box}body{margin:0;background:#f5f5ef;color:#203c30;font:15px/1.7 'Microsoft YaHei',system-ui,sans-serif}header{background:#193e30;color:#f7f7ed;padding:36px max(4vw,20px)}h1{font-size:clamp(25px,4vw,40px);line-height:1.3;margin:10px 0}header p{color:#d2dfcc}.wrap{max-width:1250px;margin:auto;padding:24px}.notes{font-size:13px;color:#637367}.layout{display:grid;grid-template-columns:210px minmax(0,1fr);gap:24px}aside{position:sticky;top:20px;align-self:start}nav a{display:block;padding:9px;border-bottom:1px solid #d7dfd2;font-size:13px;text-decoration:none}a{color:#296448}.tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}input,select,button{font:inherit;padding:10px;border:1px solid #c1cdbb;border-radius:5px;background:white;color:#203c30}input{flex:1;min-width:180px}button{cursor:pointer;margin-top:14px}h2{border-bottom:2px solid #3f6d52;padding-bottom:8px;font-size:22px}.status,.count,.meta,.authors,.source,.note{font-size:13px;color:#65776a}.card{background:white;border:1px solid #d9e0d3;border-radius:8px;padding:19px 22px;margin:13px 0}.zh{font-size:18px;font-weight:600;margin:8px 0}.en{font:17px/1.5 Georgia,'Times New Roman',serif;color:#465b4b;margin:8px 0}.authors{margin-top:13px}.source a{margin-right:14px}.paper{font-size:13px;display:inline-block;margin-top:8px}.note{margin-top:7px}.empty{padding:25px;background:white}section{scroll-margin-top:20px;margin-bottom:35px}[hidden]{display:none!important}@media(max-width:760px){.wrap{padding:14px}.layout{display:block}aside{position:static}nav{display:flex;flex-wrap:wrap}nav a{padding:7px}.card{padding:16px}.en{font-size:16px}}@media print{aside,.tools,.count{display:none}header{background:white;color:black;padding:10px}header p{color:black}.layout{display:block}body{background:white}.wrap{padding:0}.card{break-inside:avoid;padding:9px}.zh{font-size:13px}.en{font-size:12px}h2{break-after:avoid}.notes,.meta,.authors{font-size:10px}}
</style><header><p>JOURNAL CONTENTS · 中英文对照目录</p><h1>${esc(heading)}</h1><p>${esc(data.scope)}</p><p>检索日期 ${esc(data.retrieved)} · ${data.issues.length} 组卷期 · ${total} 条</p></header><div class="wrap"><div class="notes">${notes.map(n=>`<p>${esc(n)}</p>`).join('')}<p>${Object.entries(types).map(([k,v])=>`${esc(k)} ${v} 条`).join(' · ')}</p></div><div class="layout"><aside><nav>${data.issues.map((s,i)=>`<a href="#issue-${i}">${esc(s.label)} · ${s.articles.length}</a>`).join('')}</nav><button onclick="window.print()">打印 / 保存为PDF</button></aside><main><div class="tools"><input id="q" aria-label="搜索目录" placeholder="搜索中文、英文、作者或文章号…"><select id="issue" aria-label="筛选卷期"><option value="">全部卷期</option>${data.issues.map((s,i)=>`<option value="${i}">${esc(s.label)}</option>`).join('')}</select><select id="type" aria-label="筛选类型"><option value="">全部类型</option>${Object.keys(types).map(t=>`<option>${esc(t)}</option>`).join('')}</select></div><p id="count" class="count">显示 ${total} / ${total} 条</p><p id="empty" class="empty" hidden>没有匹配条目，请调整搜索词或筛选条件。</p>${data.issues.map((s,i)=>`<section id="issue-${i}" data-issue="${i}"><h2>${esc(s.label)} · ${esc(s.date)}</h2><p class="status">${esc(s.status)} · ${s.articles.length}条</p><p class="source">${s.sources.map(x=>`<a href="${esc(x.url)}" target="_blank" rel="noreferrer">${esc(x.label||'目录来源')} ↗</a>`).join('')}</p>${s.articles.map((a,j)=>`<article class="card" data-type="${esc(a.type)}"><div class="meta">${j+1} · ${esc(a.type)}${a.number?' · Article '+esc(a.number):''}${a.pages?' · pp. '+esc(a.pages):''}${a.part?' · '+esc(a.part):''}</div><div class="zh">${esc(a.chinese)}</div><div class="en" lang="en">${esc(a.english)}</div><div class="authors">${esc(a.authors||'目录页未列作者')}</div><a class="paper" href="${esc(a.url)}" target="_blank" rel="noreferrer">论文原文 ↗</a>${a.doi?`<span class="meta"> · DOI ${esc(a.doi)}</span>`:''}${a.notes?`<div class="note">${esc(a.notes)}</div>`:''}</article>`).join('')}</section>`).join('')}</main></div></div><script>
const q=document.querySelector('#q'),issue=document.querySelector('#issue'),type=document.querySelector('#type'),sections=[...document.querySelectorAll('section')],rows=[...document.querySelectorAll('.card')].map(el=>({el,issue:el.closest('section').dataset.issue,type:el.dataset.type,text:el.textContent.toLowerCase()}));function filter(){const words=q.value.trim().toLowerCase().split(/\\s+/).filter(Boolean);let n=0;for(const r of rows){const show=(!issue.value||r.issue===issue.value)&&(!type.value||r.type===type.value)&&words.every(w=>r.text.includes(w));r.el.hidden=!show;if(show)n++}for(const s of sections)s.hidden=![...s.querySelectorAll('.card')].some(el=>!el.hidden);document.querySelector('#count').textContent='显示 '+n+' / '+rows.length+' 条';document.querySelector('#empty').hidden=n>0}for(const el of [q,issue,type])el.addEventListener(el===q?'input':'change',filter);
</script></html>`;
fs.writeFileSync(path.join(root,files[0]),md.join('\n'),'utf8');
fs.writeFileSync(path.join(root,files[1]),html,'utf8');
fs.writeFileSync(path.join(root,files[2]),JSON.stringify(data,null,2),'utf8');
console.log(JSON.stringify({issues:data.issues.length,total,types,files:files.map(f=>path.join(root,f))},null,2));

