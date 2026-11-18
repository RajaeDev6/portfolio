// rg: the small language this site is written in.
//
//   -- comment
//   module about
//   title "Experience"            a section heading
//   heading "More projects"       a sub-heading
//   job jaia {                    a block: <kind> <name> {
//     role "Software Engineer"    a property: <key> <args...>
//          .. "continues here"    continues the last string
//     stack [Go, Python]          a list
//     button "Email me" -> mail   an arrow points at a target
//   }
//
// parse() never throws: half-typed code just produces fewer blocks, which is
// what lets the preview build up while the code is still being written.
// This file has no DOM code so the build script can run it in Node.

export const KINDS = ['profile', 'job', 'project', 'item', 'skills', 'entry', 'contact'];
const STATEMENTS = ['module', 'title', 'heading'];

// The address is assembled at runtime and never written out whole
const EMAIL = ['rgivans9', 'gmail.com'];

/* ---------- tokenizer ---------- */

const TOKEN = /\s+|--.*$|"(?:[^"\\]|\\.)*"?|->|\.\.|[[\]{},]|[^\s[\]{},"]+/gy;

export function tokenize(line) {
  const out = [];
  TOKEN.lastIndex = 0;
  let m;
  while (TOKEN.lastIndex < line.length && (m = TOKEN.exec(line))) {
    const t = m[0];
    if (/^\s+$/.test(t)) out.push({ type: 'space', text: t });
    else if (t.startsWith('--')) out.push({ type: 'comment', text: t });
    else if (t.startsWith('"')) {
      const closed = t.length > 1 && t.endsWith('"') && !t.endsWith('\\"');
      out.push({ type: closed ? 'string' : 'open-string', text: t, value: closed ? t.slice(1, -1).replace(/\\"/g, '"') : null });
    } else if (t === '->') out.push({ type: 'arrow', text: t });
    else if (t === '..') out.push({ type: 'concat', text: t });
    else if ('[]{},'.includes(t)) out.push({ type: 'punct', text: t });
    else out.push({ type: 'word', text: t });
  }
  return out;
}

/* ---------- parser ---------- */

function parseArgs(tokens) {
  const args = [];
  let target = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'string') args.push(t.value);
    else if (t.type === 'word') args.push(t.text);
    else if (t.type === 'arrow') {
      target = tokens.slice(i + 1).map((x) => (x.type === 'string' ? x.value : x.text)).join(' ').trim();
      break;
    } else if (t.text === '[') {
      // list: everything up to ] split on commas; bare words may contain spaces
      const items = [];
      let cur = '';
      let j = i + 1;
      for (; j < tokens.length && tokens[j].text !== ']'; j++) {
        const x = tokens[j];
        if (x.text === ',') { if (cur.trim()) items.push(cur.trim()); cur = ''; }
        else cur += (cur ? ' ' : '') + (x.type === 'string' ? x.value : x.text);
      }
      if (j === tokens.length) return null; // list not closed yet
      if (cur.trim()) items.push(cur.trim());
      args.push(items);
      i = j;
    }
  }
  return { args, target };
}

export function parse(src, { partial = false } = {}) {
  const out = [];
  let block = null;
  let last = null;
  let module = null;

  for (const line of src.split('\n')) {
    const tokens = tokenize(line).filter((t) => t.type !== 'space' && t.type !== 'comment');
    if (!tokens.length) continue;
    if (tokens.some((t) => t.type === 'open-string')) continue; // still being typed
    const [first, ...rest] = tokens;

    if (block) {
      if (first.text === '}') { out.push(block); block = null; last = null; continue; }
      if (first.type === 'concat') {
        const s = rest.find((t) => t.type === 'string');
        if (last && s) {
          const i = last.args.length - 1;
          if (typeof last.args[i] === 'string') last.args[i] += ' ' + s.value;
        }
        continue;
      }
      if (first.type !== 'word') continue;
      const parsed = parseArgs(rest);
      if (!parsed) continue;
      last = { key: first.text, ...parsed };
      (block.props[first.text] ||= []).push(last);
      continue;
    }

    if (first.type !== 'word') continue;
    if (STATEMENTS.includes(first.text)) {
      const arg = rest[0] && (rest[0].type === 'string' ? rest[0].value : rest[0].text);
      if (!arg) continue;
      if (first.text === 'module') module = arg;
      else out.push({ kind: first.text, text: arg });
      continue;
    }
    if (KINDS.includes(first.text) && rest.length >= 2 && rest[rest.length - 1].text === '{') {
      block = { kind: first.text, name: rest[0].text, props: {} };
      last = null;
    }
  }
  // an unclosed block is left out, unless the caller wants work-in-progress output
  if (block && partial) out.push(block);
  return { module, nodes: out };
}

/* ---------- renderer ---------- */

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const one = (b, k, i = 0) => b.props[k]?.[0]?.args[i];
const all = (b, k) => (b.props[k] || []);
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const ext = (url) => /^https?:/.test(url);

function linkFor(target) {
  if (!target) return { href: '#' };
  if (target === 'mail') return { href: '#contact', attrs: ` data-email="${EMAIL.join('|')}"` };
  const m = target.match(/^:e(?:dit)?\s+(\w+)/);
  if (m) return { href: `#${m[1]}`, attrs: ` data-buf="${m[1]}"` };
  return { href: target, attrs: ext(target) ? ' target="_blank" rel="noopener"' : '' };
}

function anchor(label, target, cls, iconId) {
  const { href, attrs = '' } = linkFor(target);
  return `<a class="${cls}" href="${esc(href)}"${attrs}>${iconId ? icon(iconId) : ''}${esc(label)}</a>`;
}

function arrowLink(label, url) {
  return `<a class="link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${icon('arrow')}</a>`;
}

const stack = (b) => {
  const s = one(b, 'stack');
  return Array.isArray(s) && s.length ? `<p class="stack">${s.map(esc).join(' · ')}</p>` : '';
};

const BUTTON_ICONS = { 'Email me': 'mail', GitHub: 'github', LinkedIn: 'linkedin' };

const render = {
  title: (n) => `<h2 class="pv-title">${esc(n.text)}</h2>`,
  heading: (n) => `<h3 class="pv-heading">${esc(n.text)}</h3>`,

  profile(b) {
    const name = one(b, 'name') || '';
    const [firstName, ...restName] = name.split(' ');
    const buttons = all(b, 'button').map((p, i) => anchor(p.args[0], p.target, i === 0 ? 'btn btn-primary' : 'btn', BUTTON_ICONS[p.args[0]]));
    const socials = all(b, 'social').map((p) => `<a href="${esc(p.args[1])}" target="_blank" rel="noopener" aria-label="${esc(p.args[0])}">${icon(p.args[0])}</a>`);
    return `<div class="pv-hero">
      <h1><span>${esc(firstName)}</span> ${esc(restName.join(' '))}</h1>
      ${one(b, 'role') ? `<p class="role">${esc(one(b, 'role'))}</p>` : ''}
      ${one(b, 'bio') ? `<p class="bio">${esc(one(b, 'bio'))}</p>` : ''}
      ${buttons.length || socials.length ? `<div class="cta">${buttons.join('')}${socials.length ? `<span class="socials">${socials.join('')}</span>` : ''}</div>` : ''}
    </div>`;
  },

  job(b) {
    const did = all(b, 'did').map((p) => `<li>${esc(p.args[0])}</li>`).join('');
    const link = b.props.link ? arrowLink(one(b, 'link', 0), one(b, 'link', 1)) : '';
    return `<article class="job">
      <div class="job-head"><h3>${esc(one(b, 'role'))}</h3><span class="when">${esc(one(b, 'when'))}</span></div>
      <p class="org">${esc(one(b, 'org'))}</p>
      ${did ? `<ul>${did}</ul>` : ''}${link}
    </article>`;
  },

  project(b) {
    const features = all(b, 'feature').map((p) => `<li>${esc(p.args[0])}</li>`).join('');
    const link = b.props.link ? arrowLink(one(b, 'link', 0), one(b, 'link', 1)) : '';
    const shots = all(b, 'shot').map((p) => {
      const f = esc(p.args[0]);
      return `<img src="/assets/${f}-280.webp" srcset="/assets/${f}-200.webp 200w, /assets/${f}-280.webp 280w, /assets/${f}.webp 420w" sizes="140px" width="140" height="303" loading="lazy" alt="${esc(p.args[1] || '')}">`;
    }).join('');
    return `<article class="project" id="${esc(b.name.replace(/_/g, '-'))}">
      <div class="project-copy">
        <h3>${esc(one(b, 'name'))}</h3>
        ${one(b, 'tag') ? `<p class="tag">${esc(one(b, 'tag'))}</p>` : ''}
        ${one(b, 'text') ? `<p>${esc(one(b, 'text'))}</p>` : ''}
        ${features ? `<ul>${features}</ul>` : ''}
        ${stack(b)}${link}
      </div>
      ${shots ? `<div class="shots">${shots}</div>` : ''}
    </article>`;
  },

  item(b) {
    const link = b.props.link ? arrowLink(one(b, 'link', 0), one(b, 'link', 1)) : '';
    return `<article class="item" id="${esc(b.name.replace(/_/g, '-'))}">
      <h3>${esc(one(b, 'name'))}</h3>
      ${one(b, 'tag') ? `<p class="tag">${esc(one(b, 'tag'))}</p>` : ''}
      ${one(b, 'text') ? `<p>${esc(one(b, 'text'))}</p>` : ''}
      ${stack(b)}${link}
    </article>`;
  },

  skills(b) {
    const rows = all(b, 'group').map((p) => `<dt>${esc(p.args[0])}</dt><dd>${(Array.isArray(p.args[1]) ? p.args[1] : []).map(esc).join(', ')}</dd>`).join('');
    return `<dl class="skills">${rows}</dl>`;
  },

  entry(b) {
    const inner = `${icon(one(b, 'icon') || 'cap')}<span><strong>${esc(one(b, 'name'))}</strong><small>${esc(one(b, 'sub'))}</small></span>`;
    const href = one(b, 'href');
    return href ? `<a class="entry" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="entry">${inner}</div>`;
  },

  contact(b) {
    const buttons = all(b, 'button').map((p, i) => anchor(p.args[0], p.target, i === 0 ? 'btn btn-primary' : 'btn', BUTTON_ICONS[p.args[0]]));
    return `<div class="pv-contact">
      ${one(b, 'text') ? `<p class="lead">${esc(one(b, 'text'))}</p>` : ''}
      ${buttons.length ? `<div class="cta">${buttons.join('')}</div>` : ''}
    </div>`;
  },
};

// Consecutive items and entries share a grid
export function toHTML(nodes) {
  let html = '';
  let group = null;
  const close = () => { if (group) { html += '</div>'; group = null; } };
  for (const n of nodes) {
    const g = n.kind === 'item' ? 'items' : n.kind === 'entry' ? 'entries' : n.kind === 'job' ? 'jobs' : null;
    if (g !== group) { close(); if (g) { html += `<div class="${g}">`; group = g; } }
    html += (render[n.kind] || (() => ''))(n);
  }
  close();
  return html;
}

/* ---------- syntax highlighting for the editor ---------- */

export function highlight(line) {
  const tokens = tokenize(line);
  let firstWord = true;
  let afterKind = false;
  return tokens.map((t) => {
    const text = esc(t.text);
    switch (t.type) {
      case 'space': return text;
      case 'comment': return `<span class="t-comment">${text}</span>`;
      case 'string': case 'open-string': firstWord = false; return `<span class="t-string">${text}</span>`;
      case 'arrow': case 'concat': firstWord = false; return `<span class="t-op">${text}</span>`;
      case 'punct': firstWord = false; return `<span class="t-punct">${text}</span>`;
      default: {
        let cls = 't-word';
        if (firstWord && (KINDS.includes(t.text) || STATEMENTS.includes(t.text))) { cls = 't-kind'; afterKind = true; }
        else if (firstWord) cls = 't-key';
        else if (afterKind) { cls = 't-name'; afterKind = false; }
        else if (t.text.startsWith(':')) cls = 't-op';
        firstWord = false;
        return `<span class="${cls}">${text}</span>`;
      }
    }
  }).join('');
}
