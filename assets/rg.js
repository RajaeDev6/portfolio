// rg: the small language this site is written in.
//
//   -- comment
//   module about
//   title "Experience"            a section heading
//   heading "More projects"       a sub-heading
//   job jaia {                    a block: <kind> <name> {
//     role "Software Engineer"    a property: <key> <args...>
//          .. "continues here"    .. continues the last string (or list)
//          "another argument"     a line starting with a string adds an argument
//          -> :e projects         a line starting with -> sets the target
//     stack [Go, Python]          a list
//   }
//
// parse() never throws: half-typed or broken code just produces fewer blocks,
// which is what lets the preview update while code is being written or edited.
// Every node remembers its source lines so the preview and the editor can point at each other.
// No DOM code here, so the build script can run it in Node.

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

const val = (t) => (t.type === 'string' ? t.value : t.text);

function parseArgs(tokens) {
  const args = [];
  let target = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'string') args.push(t.value);
    else if (t.type === 'word') args.push(t.text);
    else if (t.type === 'arrow') {
      target = tokens.slice(i + 1).map(val).join(' ').trim();
      break;
    } else if (t.text === '[') {
      // list: everything up to ] split on commas; bare words may contain spaces
      const items = [];
      let cur = '';
      let j = i + 1;
      for (; j < tokens.length && tokens[j].text !== ']'; j++) {
        const x = tokens[j];
        if (x.text === ',') { if (cur.trim()) items.push(cur.trim()); cur = ''; }
        else cur += (cur ? ' ' : '') + val(x);
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
  const srcLines = src.split('\n');

  srcLines.forEach((line, n) => {
    const tokens = tokenize(line).filter((t) => t.type !== 'space' && t.type !== 'comment');
    if (!tokens.length) return;
    if (tokens.some((t) => t.type === 'open-string')) return; // still being typed
    const [first, ...rest] = tokens;

    if (block) {
      block.end = n;
      if (first.text === '}') { out.push(block); block = null; last = null; return; }
      if (!last && first.type !== 'word') return;
      if (first.type === 'concat') {
        const more = parseArgs(rest);
        if (!more || !more.args.length) return;
        const i = last.args.length - 1;
        const add = more.args[0];
        if (typeof last.args[i] === 'string' && typeof add === 'string') last.args[i] += ' ' + add;
        else if (Array.isArray(last.args[i]) && Array.isArray(add)) last.args[i] = last.args[i].concat(add);
        else last.args.push(add);
        return;
      }
      if (first.type === 'string' || first.type === 'arrow') {
        const more = parseArgs(tokens);
        if (!more) return;
        last.args.push(...more.args);
        if (more.target) last.target = more.target;
        return;
      }
      if (first.type !== 'word') return;
      const parsed = parseArgs(rest);
      if (!parsed) return;
      last = { key: first.text, line: n, ...parsed };
      (block.props[first.text] ||= []).push(last);
      return;
    }

    if (first.type !== 'word') return;
    if (STATEMENTS.includes(first.text)) {
      const arg = rest[0] && val(rest[0]);
      if (!arg) return;
      if (first.text === 'module') module = arg;
      else out.push({ kind: first.text, text: arg, start: n, end: n });
      return;
    }
    if (KINDS.includes(first.text) && rest.length >= 2 && rest[rest.length - 1].text === '{') {
      block = { kind: first.text, name: rest[0].text, props: {}, start: n, end: n };
      last = null;
    }
  });
  // an unclosed block is left out, unless the caller wants work-in-progress output
  if (block && partial) out.push(block);
  return { module, nodes: out };
}

/* ---------- renderer ---------- */

const esc = (s = '') => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const one = (b, k, i = 0) => b.props[k]?.[0]?.args[i];
const all = (b, k) => (b.props[k] || []);
const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const ext = (url) => /^https?:/.test(url || '');
const src = (n) => ` data-l0="${n.start}" data-l1="${n.end}"`;
const slug = (b) => esc(b.name.replace(/_/g, '-'));

function linkFor(target) {
  if (!target) return { href: '#' };
  if (target === 'mail') return { href: '#contact', attrs: ` data-email="${EMAIL.join('|')}"` };
  const m = target.match(/^:e(?:dit)?\s+(\w+)/);
  if (m) return { href: `#${m[1]}`, attrs: ` data-buf="${m[1]}"` };
  return { href: target, attrs: ext(target) ? ' target="_blank" rel="noopener"' : '' };
}

const BUTTON_ICONS = { 'Email me': 'mail', GitHub: 'github', LinkedIn: 'linkedin' };

function button(p, i) {
  const { href, attrs = '' } = linkFor(p.target);
  const label = p.args[0] || '';
  return `<a class="btn${i === 0 ? ' btn-primary' : ''}" href="${esc(href)}"${attrs}>${BUTTON_ICONS[label] ? icon(BUTTON_ICONS[label]) : ''}${esc(label)}</a>`;
}

function arrowLink(b) {
  const label = one(b, 'link', 0);
  const url = one(b, 'link', 1);
  if (!label || !url) return '';
  return `<a class="link" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}${icon('arrow')}</a>`;
}

function chips(list) {
  return Array.isArray(list) && list.length ? `<ul class="chips">${list.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
}

function shot(p, size = 280) {
  const f = esc(p.args[0] || '');
  if (!f) return '';
  return `<button type="button" class="shot" data-full="/assets/${f}.webp" aria-label="Enlarge screenshot"><img src="/assets/${f}-${size}.webp" srcset="/assets/${f}-200.webp 200w, /assets/${f}-280.webp 280w, /assets/${f}.webp 420w" sizes="160px" width="160" height="346" loading="lazy" alt="${esc(p.args[1] || '')}"></button>`;
}

const render = {
  title: (n) => `<h2 class="pv-title"${src(n)}>${esc(n.text)}</h2>`,
  heading: (n) => `<h3 class="pv-heading"${src(n)}>${esc(n.text)}</h3>`,

  profile(b) {
    const name = one(b, 'name') || '';
    const [firstName, ...restName] = name.split(' ');
    const buttons = all(b, 'button').map(button);
    const socials = all(b, 'social').filter((p) => p.args[1]).map((p) => `<a href="${esc(p.args[1])}" target="_blank" rel="noopener" aria-label="${esc(p.args[0])}">${icon(p.args[0])}</a>`);
    return `<div class="pv-hero"${src(b)}>
      ${name ? `<h1><span>${esc(firstName)}</span> ${esc(restName.join(' '))}</h1>` : ''}
      ${one(b, 'role') ? `<p class="role">${esc(one(b, 'role'))}</p>` : ''}
      ${one(b, 'bio') ? `<p class="bio">${esc(one(b, 'bio'))}</p>` : ''}
      ${buttons.length || socials.length ? `<div class="cta">${buttons.join('')}${socials.length ? `<span class="socials">${socials.join('')}</span>` : ''}</div>` : ''}
    </div>`;
  },

  job(b) {
    const did = all(b, 'did').map((p) => `<li>${esc(p.args[0])}</li>`).join('');
    return `<article class="job"${src(b)}>
      <span class="job-dot" aria-hidden="true"></span>
      <div class="job-head"><h3>${esc(one(b, 'role'))}</h3><span class="when">${esc(one(b, 'when'))}</span></div>
      <p class="org">${esc(one(b, 'org'))}</p>
      ${did ? `<ul>${did}</ul>` : ''}${arrowLink(b)}
    </article>`;
  },

  // A card that opens to show the full write-up
  project(b) {
    const features = all(b, 'feature').map((p) => `<li>${esc(p.args[0])}</li>`).join('');
    const shots = all(b, 'shot');
    return `<details class="project" id="${slug(b)}"${src(b)}>
      <summary>
        ${shots[0] ? `<span class="project-cover">${shots.map((p) => `<img src="/assets/${esc(p.args[0])}-200.webp" width="96" height="208" loading="lazy" alt="">`).join('')}</span>` : ''}
        <span class="project-sum">
          <span class="project-name">${esc(one(b, 'name'))}</span>
          ${one(b, 'tag') ? `<span class="tag">${esc(one(b, 'tag'))}</span>` : ''}
          ${one(b, 'text') ? `<span class="project-text">${esc(one(b, 'text'))}</span>` : ''}
          <span class="more" aria-hidden="true"><span class="more-closed">Details</span><span class="more-open">Close</span>${icon('caret')}</span>
        </span>
      </summary>
      <div class="project-body">
        <div>
          ${features ? `<ul>${features}</ul>` : ''}
          ${chips(one(b, 'stack'))}
          ${arrowLink(b)}
        </div>
        ${shots.length ? `<div class="shots">${shots.map((p) => shot(p)).join('')}</div>` : ''}
      </div>
    </details>`;
  },

  item(b) {
    return `<article class="item" id="${slug(b)}"${src(b)}>
      <h3>${esc(one(b, 'name'))}</h3>
      ${one(b, 'tag') ? `<p class="tag">${esc(one(b, 'tag'))}</p>` : ''}
      ${one(b, 'text') ? `<p class="item-text">${esc(one(b, 'text'))}</p>` : ''}
      ${chips(one(b, 'stack'))}${arrowLink(b)}
    </article>`;
  },

  skills(b) {
    const groups = all(b, 'group').map((p) => `<div class="skill-group" data-l0="${p.line}" data-l1="${p.line}"><h3>${esc(p.args[0])}</h3>${chips(p.args.find(Array.isArray))}</div>`).join('');
    return `<div class="skills"${src(b)}>${groups}</div>`;
  },

  entry(b) {
    const inner = `<span class="entry-icon">${icon(one(b, 'icon') || 'cap')}</span><span><strong>${esc(one(b, 'name'))}</strong><small>${esc(one(b, 'sub'))}</small></span>`;
    const href = one(b, 'href');
    return href ? `<a class="entry" href="${esc(href)}" target="_blank" rel="noopener"${src(b)}>${inner}${icon('arrow')}</a>` : `<div class="entry"${src(b)}>${inner}</div>`;
  },

  contact(b) {
    const buttons = all(b, 'button').map(button);
    return `<div class="pv-contact"${src(b)}>
      ${one(b, 'text') ? `<p class="lead">${esc(one(b, 'text'))}</p>` : ''}
      ${buttons.length ? `<div class="cta">${buttons.join('')}</div>` : ''}
    </div>`;
  },
};

// Consecutive blocks of the same kind share a container
const GROUPS = { item: 'items', entry: 'entries', job: 'jobs', project: 'projects' };

export function toHTML(nodes) {
  let html = '';
  let group = null;
  const close = () => { if (group) { html += '</div>'; group = null; } };
  for (const n of nodes) {
    const g = GROUPS[n.kind] || null;
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
