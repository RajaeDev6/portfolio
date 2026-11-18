// The site: a Vim-style editor showing the portfolio's rg source, with a live
// preview of what the rg interpreter renders. Each section is a buffer.
import { parse, toHTML, highlight } from './rg.js';
import SOURCES from './sources.js';

const BUFFERS = ['about', 'experience', 'projects', 'security', 'skills', 'education', 'contact'];
const LINE_H = 22;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = window.matchMedia('(max-width: 899px)');

const icon = (id) => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- shell ---------- */

const app = document.getElementById('app');
app.className = 'vim';
app.dataset.view = narrow.matches ? 'preview' : 'split';
app.innerHTML = `
  <div class="tabline">
    <div class="tabs" role="tablist" aria-label="Sections">
      ${BUFFERS.map((b, i) => `<button class="tab" role="tab" type="button" data-buf="${b}" aria-selected="false"><span class="tab-n">${i + 1}</span>${b}.rg</button>`).join('')}
    </div>
    <div class="view-toggle" role="group" aria-label="View">
      <button type="button" data-view="preview">Preview</button>
      <button type="button" data-view="code">Code</button>
    </div>
  </div>
  <div class="panes">
    <section class="editor" aria-label="rg source code">
      <div class="code" id="code" aria-hidden="true"></div>
    </section>
    <section class="preview" aria-label="Preview">
      <div class="preview-bar"><span class="prompt">$</span> rg run <b id="run-file">about.rg</b><span class="run-status" id="run-status"></span></div>
      <div class="preview-body pv" id="preview" tabindex="-1"></div>
    </section>
  </div>
  <div class="statusline">
    <span class="mode" id="mode">NORMAL</span>
    <span class="file" id="file">about.rg</span>
    <span class="modified" id="modified"></span>
    <button type="button" class="skip" id="skip" hidden>skip typing ▸</button>
    <span class="fill"></span>
    <span class="hint">click a tab, or type <kbd>:help</kbd></span>
    <span class="ft">rg</span>
    <span class="pos" id="pos">1:1</span>
  </div>
  <div class="cmdline">
    <form id="cmd-form" hidden><label for="cmd">:</label><input id="cmd" autocomplete="off" spellcheck="false" aria-label="Editor command"></form>
    <span id="msg" class="msg" aria-live="polite"></span>
  </div>
  <div class="help" id="help" hidden role="dialog" aria-label="Help">
    <div class="help-box">
      <p class="help-title">rg editor help</p>
      <dl>
        <dt>click a tab</dt><dd>open that section</dd>
        <dt><kbd>1</kbd>–<kbd>7</kbd></dt><dd>jump to a section</dd>
        <dt><kbd>gt</kbd> / <kbd>gT</kbd></dt><dd>next / previous section</dd>
        <dt><kbd>j</kbd> <kbd>k</kbd></dt><dd>move down / up a line</dd>
        <dt><kbd>gg</kbd> / <kbd>G</kbd></dt><dd>top / bottom of the file</dd>
        <dt><kbd>:e projects</kbd></dt><dd>open a section by name</dd>
        <dt><kbd>Esc</kbd></dt><dd>skip the typing</dd>
      </dl>
      <p class="help-foot">Press <kbd>Esc</kbd> or <kbd>q</kbd> to close.</p>
    </div>
  </div>`;

const $ = (id) => document.getElementById(id);
const codeEl = $('code');
const editorEl = app.querySelector('.editor');
const previewEl = $('preview');
const tabs = [...app.querySelectorAll('.tab')];
const cmdForm = $('cmd-form');
const cmdInput = $('cmd');
const msgEl = $('msg');
const helpEl = $('help');
const skipBtn = $('skip');

/* ---------- state ---------- */

let current = null;
let typed = new Set();          // buffers already written out once
let typing = null;              // { buf, i, raf }
let cursor = { line: 0, col: 0 };
let lastHTML = '';

const src = (b) => SOURCES[b];
const lines = (text) => text.split('\n');

/* ---------- editor rendering ---------- */

function drawCode(text, caretAt) {
  const ls = lines(text);
  // caret position (line/col) for typing mode
  let caretLine = cursor.line;
  let caretCol = cursor.col;
  if (caretAt != null) {
    const before = text.slice(0, caretAt).split('\n');
    caretLine = before.length - 1;
    caretCol = before[before.length - 1].length;
  }
  const rows = ls.map((l, n) => {
    let body;
    if (n === caretLine) {
      const ch = l[caretCol] ?? ' ';
      body = highlight(l.slice(0, caretCol)) + `<span class="caret">${esc(ch)}</span>` + highlight(l.slice(caretCol + 1));
    } else {
      body = highlight(l) || ' ';
    }
    return `<div class="ln${n === caretLine ? ' cur' : ''}" data-line="${n}"><span class="gutter">${n + 1}</span><span class="src">${body}</span></div>`;
  });
  const fill = Math.max(0, Math.ceil(editorEl.clientHeight / LINE_H) - ls.length);
  for (let i = 0; i < fill; i++) rows.push('<div class="ln tilde"><span class="gutter">~</span><span class="src"></span></div>');
  codeEl.innerHTML = rows.join('');
  $('pos').textContent = `${caretLine + 1}:${caretCol + 1}`;
  return caretLine;
}

function keepLineVisible(n) {
  const row = codeEl.querySelector(`[data-line="${n}"]`);
  if (!row) return;
  const top = row.offsetTop;
  const bottom = top + row.offsetHeight;
  if (top < editorEl.scrollTop + LINE_H) editorEl.scrollTop = Math.max(0, top - LINE_H * 2);
  else if (bottom > editorEl.scrollTop + editorEl.clientHeight - LINE_H) editorEl.scrollTop = bottom - editorEl.clientHeight + LINE_H * 2;
}

/* ---------- preview ---------- */

function drawPreview(text, done) {
  const t0 = performance.now();
  const { nodes } = parse(text, { partial: !done });
  const html = toHTML(nodes);
  if (html === lastHTML && !done) return;
  lastHTML = html;
  previewEl.innerHTML = html;
  const ms = (performance.now() - t0).toFixed(1);
  const blocks = nodes.filter((n) => n.name).length;
  $('run-status').textContent = done ? `ok · ${blocks} block${blocks === 1 ? '' : 's'} · ${ms}ms` : 'interpreting…';
  wireLinks(previewEl);
}

function wireLinks(root) {
  root.querySelectorAll('[data-email]').forEach((a) => {
    const [user, domain] = a.dataset.email.split('|');
    a.href = `mailto:${user}@${domain}`;
  });
}

/* ---------- typing ---------- */

function stopTyping(finish = true) {
  if (!typing) return;
  cancelAnimationFrame(typing.raf);
  const { buf } = typing;
  typing = null;
  skipBtn.hidden = true;
  if (finish) {
    typed.add(buf);
    settle(buf);
  }
}

function settle(buf) {
  const text = src(buf);
  const ls = lines(text);
  cursor = { line: 0, col: 0 };
  setMode('NORMAL');
  $('modified').textContent = '';
  drawCode(text);
  editorEl.scrollTop = 0;
  lastHTML = '';
  drawPreview(text, true);
  message(`"${buf}.rg" ${ls.length}L, ${new Blob([text]).size}B`);
}

function startTyping(buf) {
  const text = src(buf);
  const duration = typed.size === 0 ? 2600 : 1700;   // the first file takes a little longer
  const perFrame = Math.max(2, Math.ceil(text.length / (duration / 16.7)));
  typing = { buf, i: 0, raf: 0 };
  setMode('INSERT');
  $('modified').textContent = '[+]';
  skipBtn.hidden = false;
  lastHTML = '';
  previewEl.innerHTML = '';
  $('run-status').textContent = 'interpreting…';
  message('');

  const step = () => {
    if (!typing || typing.buf !== buf) return;
    // move faster through runs of spaces so indentation doesn't drag
    let i = typing.i + perFrame;
    while (i < text.length && text[i] === ' ' && text[i - 1] === ' ') i++;
    typing.i = Math.min(i, text.length);
    const part = text.slice(0, typing.i);
    const line = drawCode(part, typing.i);
    keepLineVisible(line);
    drawPreview(part, false);
    if (typing.i >= text.length) { stopTyping(true); return; }
    typing.raf = requestAnimationFrame(step);
  };
  typing.raf = requestAnimationFrame(step);
}

/* ---------- buffers ---------- */

function open(buf, { scrollTo } = {}) {
  if (!BUFFERS.includes(buf)) return false;
  if (typing) stopTyping(true);
  current = buf;
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.buf === buf)));
  tabs.find((t) => t.dataset.buf === buf)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('file').textContent = `${buf}.rg`;
  $('run-file').textContent = `${buf}.rg`;
  if (location.hash.slice(1) !== buf && !scrollTo) history.replaceState(null, '', `#${buf}`);

  const showCode = app.dataset.view !== 'preview';
  if (typed.has(buf) || reduced || !showCode || scrollTo) {
    typed.add(buf);
    settle(buf);
  } else {
    startTyping(buf);
  }
  previewEl.scrollTop = 0;
  if (scrollTo) {
    const target = previewEl.querySelector(`#${CSS.escape(scrollTo)}`);
    if (target) target.scrollIntoView({ block: 'start' });
  }
  return true;
}

function step(dir) {
  const i = BUFFERS.indexOf(current);
  open(BUFFERS[(i + dir + BUFFERS.length) % BUFFERS.length]);
}

// Old links like /#shop-weh point at a block inside a buffer
function bufferFor(hash) {
  if (BUFFERS.includes(hash)) return { buf: hash };
  const name = hash.replace(/-/g, '_');
  const buf = BUFFERS.find((b) => new RegExp(`^\\s*\\w+\\s+${name}\\s*\\{`, 'm').test(src(b)));
  return buf ? { buf, scrollTo: hash } : null;
}

/* ---------- status line, messages, modes ---------- */

function setMode(m) {
  const el = $('mode');
  el.textContent = m;
  el.dataset.mode = m.toLowerCase();
}

function message(text, isError = false) {
  msgEl.textContent = text;
  msgEl.classList.toggle('error', isError);
}

function moveCursor(line) {
  if (typing) return;
  const max = lines(src(current)).length - 1;
  cursor.line = Math.max(0, Math.min(max, line));
  cursor.col = 0;
  drawCode(src(current));
  keepLineVisible(cursor.line);
}

/* ---------- command line ---------- */

function openCmd(prefill = '') {
  cmdForm.hidden = false;
  msgEl.hidden = true;
  cmdInput.value = prefill;
  setMode('COMMAND');
  cmdInput.focus();
}

function closeCmd() {
  cmdForm.hidden = true;
  msgEl.hidden = false;
  if (!typing) setMode('NORMAL');
}

function run(cmd) {
  const c = cmd.trim().replace(/^:/, '');
  if (!c) return;
  const [name, ...args] = c.split(/\s+/);
  const arg = (args[0] || '').replace(/\.rg$/, '');
  if (/^\d+$/.test(c)) return moveCursor(Number(c) - 1);
  switch (name) {
    case 'e': case 'edit': case 'o': case 'open':
      if (!arg) return message('E32: No file name', true);
      if (!open(arg)) message(`E484: Can't open file ${arg}.rg  (try: ${BUFFERS.join(', ')})`, true);
      return;
    case 'b': case 'buffer': {
      const n = Number(arg);
      if (n >= 1 && n <= BUFFERS.length) return open(BUFFERS[n - 1]);
      if (BUFFERS.includes(arg)) return open(arg);
      return message(`E86: Buffer ${arg || '?'} does not exist`, true);
    }
    case 'bn': case 'bnext': case 'tabn': case 'tabnext': return step(1);
    case 'bp': case 'bprev': case 'bprevious': case 'tabp': case 'tabprevious': return step(-1);
    case 'ls': case 'buffers': return message(BUFFERS.map((b, i) => `${i + 1} ${b}.rg`).join('   '));
    case 'h': case 'help': return showHelp();
    case 'w': case 'write': {
      const text = src(current);
      return message(`"${current}.rg" ${lines(text).length}L, ${new Blob([text]).size}B written`);
    }
    case 'q': case 'q!': case 'wq': case 'x': case 'qa': case 'quit':
      return message('There’s nothing to quit, it’s a website. Try :e contact');
    default:
      return message(`E492: Not an editor command: ${c}`, true);
  }
}

cmdForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = cmdInput.value;
  closeCmd();
  run(value);
});
cmdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeCmd(); message(''); }
});
cmdInput.addEventListener('blur', () => { if (!cmdForm.hidden) closeCmd(); });

/* ---------- help ---------- */

function showHelp() { helpEl.hidden = false; helpEl.querySelector('.help-box').focus?.(); }
function hideHelp() { helpEl.hidden = true; }
helpEl.addEventListener('click', (e) => { if (e.target === helpEl) hideHelp(); });

/* ---------- input ---------- */

let pendingG = false;
document.addEventListener('keydown', (e) => {
  if (e.target === cmdInput) return;
  if (e.metaKey || e.ctrlKey || e.altKey) {
    if (e.ctrlKey && (e.key === 'd' || e.key === 'u') && !typing) {
      e.preventDefault();
      const half = Math.floor(editorEl.clientHeight / LINE_H / 2);
      moveCursor(cursor.line + (e.key === 'd' ? half : -half));
    }
    return;
  }
  if (!helpEl.hidden) {
    if (e.key === 'Escape' || e.key === 'q') { e.preventDefault(); hideHelp(); }
    return;
  }
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  if (e.key === 'Escape') { if (typing) { e.preventDefault(); stopTyping(true); } return; }
  if (e.key === ':') { e.preventDefault(); if (typing) stopTyping(true); openCmd(); return; }
  if (e.key === '?') { e.preventDefault(); showHelp(); return; }
  if (/^[1-7]$/.test(e.key)) { e.preventDefault(); open(BUFFERS[Number(e.key) - 1]); return; }

  if (pendingG) {
    pendingG = false;
    if (e.key === 't') { e.preventDefault(); step(1); return; }
    if (e.key === 'T') { e.preventDefault(); step(-1); return; }
    if (e.key === 'g') { e.preventDefault(); moveCursor(0); return; }
  }
  if (e.key === 'g') { pendingG = true; return; }
  if (e.key === 'G') { e.preventDefault(); moveCursor(Infinity); return; }
  if (e.key === 'j') { e.preventDefault(); moveCursor(cursor.line + 1); return; }
  if (e.key === 'k') { e.preventDefault(); moveCursor(cursor.line - 1); return; }
});

tabs.forEach((t) => t.addEventListener('click', () => open(t.dataset.buf)));

// Links in the preview that point at another buffer
previewEl.addEventListener('click', (e) => {
  const a = e.target.closest('[data-buf]');
  if (!a) return;
  e.preventDefault();
  open(a.dataset.buf);
  if (narrow.matches) app.scrollIntoView({ block: 'start' });
});

// Clicking the code skips the typing, or moves the cursor to that line
codeEl.parentElement.addEventListener('click', (e) => {
  if (typing) { stopTyping(true); return; }
  const row = e.target.closest('[data-line]');
  if (row) moveCursor(Number(row.dataset.line));
});
skipBtn.addEventListener('click', () => stopTyping(true));

// Phone layout: switch between the preview and the code
app.querySelectorAll('.view-toggle button').forEach((b) => b.addEventListener('click', () => {
  app.dataset.view = b.dataset.view;
  syncToggle();
  if (b.dataset.view === 'code' && !typed.has(current)) open(current);
  else if (b.dataset.view === 'code') drawCode(src(current));
}));
function syncToggle() {
  app.querySelectorAll('.view-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === app.dataset.view)));
}
narrow.addEventListener('change', () => {
  app.dataset.view = narrow.matches ? 'preview' : 'split';
  syncToggle();
  if (current && !typing) drawCode(src(current));
});
window.addEventListener('resize', () => { if (current && !typing) drawCode(src(current)); });

window.addEventListener('hashchange', () => {
  const t = bufferFor(location.hash.slice(1));
  if (t && t.buf !== current) open(t.buf, t);
});

/* ---------- start ---------- */

syncToggle();
const start = bufferFor(location.hash.slice(1)) || { buf: 'about' };
open(start.buf, start);
