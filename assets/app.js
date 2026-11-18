// The site: a narrow Vim-style editor with the portfolio's rg source, and a large live
// preview of what the rg interpreter renders. Visitors can edit the code and the preview
// re-renders; hovering the preview highlights the code behind it, and the cursor line
// in the code highlights its block in the preview.
import { parse, toHTML, highlight } from './rg.js';
import SOURCES from './sources.js';

const BUFFERS = ['about', 'experience', 'projects', 'security', 'skills', 'education', 'contact'];
const LINE_H = 22;
const PAD_TOP = 8;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = window.matchMedia('(max-width: 899px)');
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* ---------- shell ---------- */

const app = document.getElementById('app');
app.className = 'vim';
app.dataset.view = narrow.matches ? 'preview' : 'split';
if (store.get('rg-code') === 'hidden') app.classList.add('code-hidden');
app.innerHTML = `
  <div class="tabline">
    <div class="tabs" role="tablist" aria-label="Sections">
      ${BUFFERS.map((b, i) => `<button class="tab" role="tab" type="button" data-buf="${b}" aria-selected="false"><span class="tab-n">${i + 1}</span>${b}.rg</button>`).join('')}
    </div>
    <button type="button" class="code-toggle" id="code-toggle"></button>
    <div class="view-toggle" role="group" aria-label="View">
      <button type="button" data-view="preview">Preview</button>
      <button type="button" data-view="code">Code</button>
    </div>
  </div>
  <div class="panes" id="panes">
    <section class="editor" id="editor" aria-label="rg source code">
      <div class="code-wrap">
        <div class="band band-link" id="band-link" hidden></div>
        <div class="band band-cur" id="band-cur"></div>
        <div class="gutter-col" id="gutter" aria-hidden="true"></div>
        <div class="text-col">
          <pre class="hl" id="hl" aria-hidden="true"></pre>
          <textarea class="ta" id="ta" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="rg source code. Edit it to change the preview."></textarea>
        </div>
      </div>
    </section>
    <div class="splitter" id="splitter" role="separator" aria-orientation="vertical" aria-label="Resize code pane" tabindex="0"></div>
    <section class="preview" aria-label="Preview">
      <div class="browser-bar">
        <span class="addr"><span class="addr-host">rajaedev.space</span><span id="addr-path">/#about</span></span>
        <span class="run-status" id="run-status"></span>
      </div>
      <div class="preview-body pv" id="preview" tabindex="-1"></div>
    </section>
  </div>
  <div class="statusline">
    <span class="mode" id="mode">NORMAL</span>
    <span class="file" id="file">about.rg</span>
    <span class="modified" id="modified"></span>
    <button type="button" class="sl-btn" id="skip" hidden>skip typing ▸</button>
    <button type="button" class="sl-btn" id="reset" hidden>undo my edits</button>
    <span class="fill"></span>
    <span class="hint" id="hint">click the code to edit it · <kbd>:help</kbd></span>
    <span class="ft">rg</span>
    <span class="pos" id="pos">1:1</span>
  </div>
  <div class="cmdline">
    <form id="cmd-form" hidden><label for="cmd">:</label><input id="cmd" autocomplete="off" spellcheck="false" aria-label="Editor command"></form>
    <span id="msg" class="msg" aria-live="polite"></span>
  </div>
  <div class="overlay" id="help" hidden role="dialog" aria-modal="true" aria-label="Help">
    <div class="help-box">
      <p class="help-title">How this works</p>
      <p class="help-text">The left pane is this site’s source, written in rg. The right pane is what it renders. Edit the code and the preview changes; your edits stay in this tab only.</p>
      <dl>
        <dt>click a tab</dt><dd>open that section</dd>
        <dt>click the code</dt><dd>edit it (<kbd>Esc</kbd> to stop)</dd>
        <dt>hover the preview</dt><dd>see the code behind it</dd>
        <dt><kbd>1</kbd>–<kbd>7</kbd>, <kbd>gt</kbd> <kbd>gT</kbd></dt><dd>switch sections</dd>
        <dt><kbd>j</kbd> <kbd>k</kbd> <kbd>gg</kbd> <kbd>G</kbd></dt><dd>move the cursor</dd>
        <dt><kbd>:e projects</kbd></dt><dd>open a section by name</dd>
        <dt><kbd>:e!</kbd></dt><dd>undo your edits</dd>
      </dl>
      <p class="help-foot">Press <kbd>Esc</kbd> to close.</p>
    </div>
  </div>
  <div class="overlay lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="Screenshot">
    <button type="button" class="lightbox-close" aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button>
    <img id="lightbox-img" alt="">
  </div>`;

const $ = (id) => document.getElementById(id);
const panes = $('panes');
const editorEl = $('editor');
const ta = $('ta');
const hl = $('hl');
const gutter = $('gutter');
const bandCur = $('band-cur');
const bandLink = $('band-link');
const previewEl = $('preview');
const tabs = [...app.querySelectorAll('.tab')];
const cmdForm = $('cmd-form');
const cmdInput = $('cmd');
const msgEl = $('msg');
const helpEl = $('help');
const lightbox = $('lightbox');

/* ---------- state ---------- */

let current = null;
const typed = new Set();         // buffers already written out once
const edits = {};                // visitor edits, per buffer, this tab only
let typing = null;               // { buf, raf }
let cursorLine = 0;
let lastHTML = '';

const text = (b = current) => edits[b] ?? SOURCES[b];
const editorVisible = () => !app.classList.contains('code-hidden') && app.dataset.view !== 'preview';

/* ---------- editor drawing ---------- */

function drawCode(value, { caretAt = null } = {}) {
  const ls = value.split('\n');
  let body = ls.map((l) => highlight(l)).join('\n');
  if (caretAt != null) {
    // a steady block caret at the end of what has been typed so far
    body = value.slice(0, caretAt).split('\n').map((l) => highlight(l)).join('\n') + '<span class="caret"> </span>';
  }
  hl.innerHTML = body + '\n';
  const fill = Math.max(0, Math.ceil(editorEl.clientHeight / LINE_H) - ls.length);
  gutter.innerHTML = ls.map((_, n) => `<span data-n="${n}">${n + 1}</span>`).join('') + '<span class="tilde">~</span>'.repeat(fill);
  markCursor(caretAt != null ? value.slice(0, caretAt).split('\n').length - 1 : cursorLine, { scroll: false });
}

function markCursor(line, { scroll = true, sync = false } = {}) {
  const max = (typing ? ta.value || hl.textContent : text()).split('\n').length - 1;
  cursorLine = Math.max(0, Math.min(Math.max(max, 0), line));
  bandCur.style.transform = `translateY(${PAD_TOP + cursorLine * LINE_H}px)`;
  gutter.querySelector('.cur')?.classList.remove('cur');
  gutter.querySelector(`[data-n="${cursorLine}"]`)?.classList.add('cur');
  const col = ta === document.activeElement ? ta.selectionStart - ta.value.lastIndexOf('\n', ta.selectionStart - 1) : 1;
  $('pos').textContent = `${cursorLine + 1}:${col}`;
  if (scroll) scrollEditorTo(cursorLine, cursorLine);
  if (sync) syncPreviewTo(cursorLine);
}

function scrollEditorTo(l0, l1, { smooth = false } = {}) {
  const top = PAD_TOP + l0 * LINE_H;
  const bottom = PAD_TOP + (l1 + 1) * LINE_H;
  const view = editorEl.clientHeight;
  let to = null;
  if (top < editorEl.scrollTop + LINE_H) to = top - LINE_H * 2;
  else if (bottom > editorEl.scrollTop + view - LINE_H) to = Math.min(top - LINE_H * 2, bottom - view + LINE_H * 2);
  if (to != null) editorEl.scrollTo({ top: Math.max(0, to), behavior: smooth && !reduced ? 'smooth' : 'auto' });
}

/* ---------- preview ---------- */

function drawPreview(value, { done = true } = {}) {
  const t0 = performance.now();
  const { nodes } = parse(value, { partial: !done });
  const html = toHTML(nodes);
  if (html === lastHTML && !done) return;
  lastHTML = html;
  const open = [...previewEl.querySelectorAll('details[open]')].map((d) => d.id);
  previewEl.innerHTML = html;
  open.forEach((id) => { const d = previewEl.querySelector(`#${CSS.escape(id)}`); if (d) d.open = true; });
  const ms = (performance.now() - t0).toFixed(1);
  const blocks = nodes.filter((n) => n.name).length;
  $('run-status').textContent = done ? `rg run ${current}.rg · ${blocks} block${blocks === 1 ? '' : 's'} · ${ms}ms` : 'rg run · interpreting…';
  previewEl.querySelectorAll('[data-email]').forEach((a) => {
    const [user, domain] = a.dataset.email.split('|');
    a.href = `mailto:${user}@${domain}`;
  });
}

// The innermost preview element whose source lines contain `line`
function blockAt(line) {
  let best = null;
  previewEl.querySelectorAll('[data-l0]').forEach((el) => {
    const l0 = Number(el.dataset.l0);
    const l1 = Number(el.dataset.l1);
    if (line >= l0 && line <= l1 && (!best || l1 - l0 <= Number(best.dataset.l1) - Number(best.dataset.l0))) best = el;
  });
  return best;
}

function syncPreviewTo(line) {
  previewEl.querySelector('.pv-active')?.classList.remove('pv-active');
  const el = blockAt(line);
  if (!el) return;
  el.classList.add('pv-active');
  el.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
}

function showLink(el) {
  if (!el || !editorVisible()) { bandLink.hidden = true; return; }
  const l0 = Number(el.dataset.l0);
  const l1 = Number(el.dataset.l1);
  bandLink.hidden = false;
  bandLink.style.transform = `translateY(${PAD_TOP + l0 * LINE_H}px)`;
  bandLink.style.height = `${(l1 - l0 + 1) * LINE_H}px`;
}

/* ---------- typing ---------- */

function stopTyping() {
  if (!typing) return;
  cancelAnimationFrame(typing.raf);
  const { buf } = typing;
  typing = null;
  typed.add(buf);
  $('skip').hidden = true;
  settle(buf);
}

function settle(buf) {
  const value = text(buf);
  ta.readOnly = false;
  ta.value = value;
  setMode(ta === document.activeElement ? 'INSERT' : 'NORMAL');
  updateModified();
  cursorLine = 0;
  drawCode(value);
  editorEl.scrollTop = 0;
  lastHTML = '';
  drawPreview(value);
  message(`"${buf}.rg" ${value.split('\n').length}L, ${new Blob([value]).size}B`);
}

function startTyping(buf) {
  const value = text(buf);
  const duration = typed.size === 0 ? 2200 : 1400;   // the first file takes a little longer
  const perFrame = Math.max(3, Math.ceil(value.length / (duration / 16.7)));
  typing = { buf, raf: 0 };
  let i = 0;
  ta.readOnly = true;
  ta.value = '';
  setMode('INSERT');
  $('modified').textContent = '[+]';
  $('skip').hidden = false;
  lastHTML = '';
  previewEl.innerHTML = '';
  $('run-status').textContent = 'rg run · interpreting…';
  message('');

  const step = () => {
    if (!typing || typing.buf !== buf) return;
    i += perFrame;
    while (i < value.length && value[i] === ' ' && value[i - 1] === ' ') i++; // skip through indentation
    i = Math.min(i, value.length);
    const part = value.slice(0, i);
    drawCode(part, { caretAt: i });
    scrollEditorTo(cursorLine, cursorLine);
    drawPreview(part, { done: false });
    if (i >= value.length) { stopTyping(); return; }
    typing.raf = requestAnimationFrame(step);
  };
  typing.raf = requestAnimationFrame(step);
}

/* ---------- buffers ---------- */

function open(buf, { scrollTo } = {}) {
  if (!BUFFERS.includes(buf)) return false;
  if (typing) stopTyping();
  current = buf;
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.buf === buf)));
  tabs.find((t) => t.dataset.buf === buf)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  $('file').textContent = `${buf}.rg`;
  $('addr-path').textContent = `/#${scrollTo || buf}`;
  if (location.hash.slice(1) !== (scrollTo || buf)) history.replaceState(null, '', `#${scrollTo || buf}`);
  bandLink.hidden = true;

  if (typed.has(buf) || reduced || !editorVisible() || scrollTo) {
    typed.add(buf);
    settle(buf);
  } else {
    startTyping(buf);
  }
  previewEl.scrollTop = 0;
  if (scrollTo) {
    const target = previewEl.querySelector(`#${CSS.escape(scrollTo)}`);
    if (target) {
      if (target.tagName === 'DETAILS') target.open = true;
      target.scrollIntoView({ block: 'start' });
      markCursor(Number(target.dataset.l0));
    }
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
  if (!/^[\w-]+$/.test(hash)) return null;
  const name = hash.replace(/-/g, '_');
  const buf = BUFFERS.find((b) => new RegExp(`^\\w+\\s+${name}\\s*\\{`, 'm').test(SOURCES[b]));
  return buf ? { buf, scrollTo: hash } : null;
}

/* ---------- editing ---------- */

ta.addEventListener('focus', () => { if (typing) stopTyping(); setMode('INSERT'); });
ta.addEventListener('blur', () => { if (!typing) setMode('NORMAL'); });
ta.addEventListener('input', () => {
  edits[current] = ta.value;
  if (edits[current] === SOURCES[current]) delete edits[current];
  drawCode(ta.value);
  drawPreview(ta.value, { done: false });
  markCursor(lineOfCaret(), { scroll: false, sync: true });
  $('run-status').textContent = `rg run ${current}.rg · live`;
  updateModified();
});
ta.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); ta.blur(); }
});
['keyup', 'click', 'select'].forEach((ev) => ta.addEventListener(ev, () => {
  if (!typing) markCursor(lineOfCaret(), { scroll: false, sync: true });
}));
ta.addEventListener('pointerdown', () => { if (typing) stopTyping(); });

function lineOfCaret() {
  return ta.value.slice(0, ta.selectionStart).split('\n').length - 1;
}

function updateModified() {
  const changed = current in edits;
  $('modified').textContent = changed ? '[+]' : '';
  $('reset').hidden = !changed;
}

function resetEdits() {
  delete edits[current];
  settle(current);
  message(`"${current}.rg" restored`);
}
$('reset').addEventListener('click', resetEdits);
$('skip').addEventListener('click', stopTyping);

/* ---------- preview ⇄ code links ---------- */

previewEl.addEventListener('mouseover', (e) => showLink(e.target.closest('[data-l0]')));
previewEl.addEventListener('mouseleave', () => { bandLink.hidden = true; });
previewEl.addEventListener('focusin', (e) => showLink(e.target.closest('[data-l0]')));

previewEl.addEventListener('click', (e) => {
  const shot = e.target.closest('.shot');
  if (shot) { openLightbox(shot); return; }
  const a = e.target.closest('[data-buf]');
  if (a) {
    e.preventDefault();
    open(a.dataset.buf);
    return;
  }
  const block = e.target.closest('[data-l0]');
  if (block && editorVisible() && !typing) {
    markCursor(Number(block.dataset.l0), { scroll: false });
    scrollEditorTo(Number(block.dataset.l0), Number(block.dataset.l1), { smooth: true });
  }
});

/* ---------- lightbox ---------- */

let lastFocus = null;
function openLightbox(btn) {
  const img = btn.querySelector('img');
  $('lightbox-img').src = btn.dataset.full;
  $('lightbox-img').alt = img?.alt || '';
  lastFocus = btn;
  lightbox.hidden = false;
  lightbox.querySelector('.lightbox-close').focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  lastFocus?.focus();
}
lightbox.addEventListener('click', closeLightbox);

/* ---------- status line, messages, modes ---------- */

function setMode(m) {
  const el = $('mode');
  el.textContent = m;
  el.dataset.mode = m.toLowerCase();
}

function message(t, isError = false) {
  msgEl.textContent = t;
  msgEl.classList.toggle('error', isError);
}

/* ---------- command line ---------- */

function openCmd() {
  if (typing) stopTyping();
  cmdForm.hidden = false;
  msgEl.hidden = true;
  cmdInput.value = '';
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
  if (/^\d+$/.test(c)) { markCursor(Number(c) - 1, { sync: true }); return; }
  switch (name) {
    case 'e!': return resetEdits();
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
    case 'ls': case 'buffers': return message(BUFFERS.map((b, i) => `${i + 1} ${b}.rg${b in edits ? ' [+]' : ''}`).join('   '));
    case 'h': case 'help': return showHelp();
    case 'w': case 'write': {
      const v = text();
      return message(`"${current}.rg" ${v.split('\n').length}L, ${new Blob([v]).size}B written (to this tab only, it resets when you reload)`);
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

function showHelp() { helpEl.hidden = false; }
function hideHelp() { helpEl.hidden = true; }
helpEl.addEventListener('click', (e) => { if (e.target === helpEl) hideHelp(); });

/* ---------- keys (when not typing in the code or the command line) ---------- */

let pendingG = false;
document.addEventListener('keydown', (e) => {
  if (e.target === cmdInput || e.target === ta) return;
  if (!lightbox.hidden) { if (e.key === 'Escape') closeLightbox(); return; }
  if (!helpEl.hidden) { if (e.key === 'Escape' || e.key === 'q') { e.preventDefault(); hideHelp(); } return; }
  if (e.metaKey || e.altKey) return;
  if (e.ctrlKey) {
    if ((e.key === 'd' || e.key === 'u') && !typing) {
      e.preventDefault();
      const half = Math.floor(editorEl.clientHeight / LINE_H / 2);
      markCursor(cursorLine + (e.key === 'd' ? half : -half), { sync: true });
    }
    return;
  }
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

  if (e.key === 'Escape') { if (typing) { e.preventDefault(); stopTyping(); } return; }
  if (e.key === ':') { e.preventDefault(); openCmd(); return; }
  if (e.key === '?') { e.preventDefault(); showHelp(); return; }
  if (e.key === 'i' && editorVisible()) { e.preventDefault(); if (typing) stopTyping(); placeCaret(cursorLine); return; }
  if (/^[1-7]$/.test(e.key)) { e.preventDefault(); open(BUFFERS[Number(e.key) - 1]); return; }
  if (pendingG) {
    pendingG = false;
    if (e.key === 't') { e.preventDefault(); step(1); return; }
    if (e.key === 'T') { e.preventDefault(); step(-1); return; }
    if (e.key === 'g') { e.preventDefault(); markCursor(0, { sync: true }); return; }
  }
  if (typing) return;
  if (e.key === 'g') { pendingG = true; return; }
  if (e.key === 'G') { e.preventDefault(); markCursor(Infinity, { sync: true }); return; }
  if (e.key === 'j') { e.preventDefault(); markCursor(cursorLine + 1, { sync: true }); return; }
  if (e.key === 'k') { e.preventDefault(); markCursor(cursorLine - 1, { sync: true }); return; }
});

function placeCaret(line) {
  const ls = ta.value.split('\n');
  const pos = ls.slice(0, line).reduce((n, l) => n + l.length + 1, 0);
  ta.focus();
  ta.setSelectionRange(pos, pos);
}

/* ---------- layout: tabs, splitter, hide code, phone view ---------- */

tabs.forEach((t) => t.addEventListener('click', () => open(t.dataset.buf)));

function setEditorWidth(px) {
  const max = Math.max(320, panes.clientWidth * 0.6);
  const w = Math.round(Math.max(260, Math.min(max, px)));
  panes.style.setProperty('--ed-w', `${w}px`);
  return w;
}
const savedW = Number(store.get('rg-width'));
setEditorWidth(savedW || Math.min(460, window.innerWidth * 0.34));

const splitter = $('splitter');
splitter.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  splitter.setPointerCapture(e.pointerId);
  app.classList.add('resizing');
  const left = panes.getBoundingClientRect().left;
  const move = (ev) => setEditorWidth(ev.clientX - left);
  const up = (ev) => {
    splitter.releasePointerCapture(ev.pointerId);
    app.classList.remove('resizing');
    store.set('rg-width', String(setEditorWidth(ev.clientX - left)));
    splitter.removeEventListener('pointermove', move);
    splitter.removeEventListener('pointerup', up);
    drawCode(text());
  };
  splitter.addEventListener('pointermove', move);
  splitter.addEventListener('pointerup', up);
});
splitter.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  e.preventDefault();
  const w = editorEl.getBoundingClientRect().width + (e.key === 'ArrowRight' ? 32 : -32);
  store.set('rg-width', String(setEditorWidth(w)));
});

const codeToggle = $('code-toggle');
function syncCodeToggle() {
  const hidden = app.classList.contains('code-hidden');
  codeToggle.textContent = hidden ? 'Show code' : 'Hide code';
  codeToggle.setAttribute('aria-pressed', String(!hidden));
}
codeToggle.addEventListener('click', () => {
  if (typing) stopTyping();
  app.classList.toggle('code-hidden');
  store.set('rg-code', app.classList.contains('code-hidden') ? 'hidden' : 'shown');
  syncCodeToggle();
  if (editorVisible()) drawCode(text());
});

app.querySelectorAll('.view-toggle button').forEach((b) => b.addEventListener('click', () => {
  app.dataset.view = b.dataset.view;
  syncViewToggle();
  if (b.dataset.view === 'code') { if (!typed.has(current)) open(current); else drawCode(text()); }
}));
function syncViewToggle() {
  app.querySelectorAll('.view-toggle button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === app.dataset.view)));
}
narrow.addEventListener('change', () => {
  app.dataset.view = narrow.matches ? 'preview' : 'split';
  syncViewToggle();
  if (current && !typing) drawCode(text());
});
window.addEventListener('resize', () => { if (current && !typing) drawCode(text()); });

window.addEventListener('hashchange', () => {
  const t = bufferFor(location.hash.slice(1));
  if (t && (t.buf !== current || t.scrollTo)) open(t.buf, t);
});

/* ---------- start ---------- */

syncCodeToggle();
syncViewToggle();
const start = bufferFor(location.hash.slice(1)) || { buf: 'about' };
open(start.buf, start);
