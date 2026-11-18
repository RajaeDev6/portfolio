// The site: a narrow Vim-style editor with the portfolio's rg source, and a large live
// preview of what the rg interpreter renders. Visitors can edit the code and the preview
// re-renders; hovering the preview highlights the code behind it, and the cursor line
// in the code highlights its block in the preview.
import { parse, toHTML, highlight, urlsIn, findInjection } from './rg.js';
import SOURCES from './sources.js';

const BUFFERS = ['about', 'experience', 'projects', 'security', 'skills', 'education', 'contact'];
const HIDDEN = ['.notes'];                         // unlisted buffers (part of the CTF)
const ALL = [...BUFFERS, ...HIDDEN];
// Only URLs that appear in the original source may ever become working links
const ALLOWED_URLS = urlsIn(Object.values(SOURCES).join('\n'));
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
      ${BUFFERS.map((b, i) => `<button class="tab" role="tab" type="button" data-buf="${b}" aria-selected="false"><span class="tab-n">${i + 1}</span>${b}<span class="tab-ext">.rg</span></button>`).join('')}
    </div>
    <button type="button" class="code-toggle" id="code-toggle"></button>
    <span class="site-wrap">
      <a class="site-link" href="/site/" id="site-link">Normal portfolio</a>
      <div class="nudge" id="nudge" hidden role="note">
        <svg class="nudge-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <p><b>This is Rajae Givans’ portfolio</b>, built as a code editor. Prefer a plain page?</p>
        <div class="nudge-actions"><a class="btn btn-primary" href="/site/">Open the normal portfolio</a><button type="button" class="btn" id="nudge-close">Stay here</button></div>
      </div>
    </span>
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
      <div class="mission" id="mission">
        <span class="mission-tag">CTF</span>
        <span class="mission-text" id="mission-text"></span>
        <button type="button" class="mission-btn" id="mission-btn">Open the board</button>
      </div>
      <div class="edit-note" id="edit-note" hidden>You’re editing a copy. Changes only show in your browser and reset when you reload, and links are switched off. <button type="button" id="edit-undo">Undo my edits</button></div>
      <div class="preview-body pv" id="preview" tabindex="-1"></div>
      <div class="intro" id="intro" hidden role="note">
        <p class="wide-only"><b>This is my portfolio as a code editor, with a CTF hidden in it.</b> The left side is the source, the right side is what it renders. Click the tabs to look around, or open the challenge board and start hunting. No Vim experience needed: the board shows the few keys you’ll use.</p>
        <div class="narrow-only">
          <p><b>I’m Rajae Givans, and this is my portfolio.</b></p>
          <ul class="intro-steps"><li>Scroll down to read it.</li><li>Tap the tabs at the top (about, experience, projects…) to switch sections.</li><li>Tap <b>Code</b> to see the code behind it.</li></ul>
        </div>
        <div class="intro-actions wide-only"><button type="button" class="btn btn-primary intro-ctf">Challenge board</button><button type="button" class="btn intro-ok">Look around</button><a class="btn" href="/site/">Normal portfolio</a></div>
        <div class="intro-actions narrow-only"><a class="btn btn-primary" href="/site/">Normal portfolio</a><button type="button" class="btn btn-soft intro-ok">Start reading</button><button type="button" class="btn intro-ctf">Try the CTF</button></div>
      </div>
    </section>
  </div>
  <div class="statusline">
    <span class="mode" id="mode">NORMAL</span>
    <span class="file" id="file">about.rg</span>
    <span class="modified" id="modified"></span>
    <button type="button" class="sl-btn" id="skip" hidden>skip typing ▸</button>
    <button type="button" class="sl-btn" id="reset" hidden>undo my edits</button>
    <span class="fill"></span>
    <button type="button" class="sl-btn flags" id="flags">CTF 0/4</button>
    <span class="hint" id="hint">click the code to edit it · <kbd>:help</kbd></span>
    <span class="ft">rg</span>
    <span class="pos" id="pos">1:1</span>
  </div>
  <div class="cmdline">
    <form id="cmd-form" hidden><label for="cmd" id="cmd-label">:</label><input id="cmd" autocomplete="off" spellcheck="false" aria-label="Editor command"></form>
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
        <dt><kbd>:ctf</kbd></dt><dd>the capture-the-flag challenges</dd>
      </dl>
      <dl>
        <dt><kbd>/word</kbd>, <kbd>n</kbd></dt><dd>search the code</dd>
        <dt><kbd>:decode</kbd> <kbd>:hex</kbd> <kbd>:rot13</kbd> <kbd>:rev</kbd></dt><dd>decode the line under the cursor, or text typed after it</dd>
        <dt><kbd>:ctf</kbd>, <kbd>:flag rg{…}</kbd></dt><dd>challenge board, submit a flag</dd>
      </dl>
      <p class="help-text">Not into code? The <a href="/site/">normal portfolio</a> has the same content as a plain page.</p>
      <p class="help-foot">Press <kbd>Esc</kbd> to close.</p>
    </div>
  </div>
  <div class="overlay" id="ctf" hidden role="dialog" aria-modal="true" aria-label="Capture the flag">
    <div class="help-box ctf-box">
      <div class="board-head"><p class="help-title">Challenge board</p><p class="score" id="score">0 / 900 pts</p><button type="button" class="dialog-close" id="ctf-close" aria-label="Close"><svg class="icon" aria-hidden="true"><use href="#i-x"/></svg></button></div>
      <p class="help-text">Flags look like <code>rg{...}</code>. Decoding one with <kbd>:decode</kbd>, <kbd>:hex</kbd>, <kbd>:rot13</kbd> or <kbd>:rev</kbd> submits it automatically, or paste it below. Not playing? The <a href="/site/">normal portfolio</a> has everything.</p>
      <form class="flag-form" id="flag-form"><input id="flag-input" placeholder="rg{...}" autocomplete="off" spellcheck="false" aria-label="Flag"><button type="submit" class="btn btn-primary">Submit</button></form>
      <p class="flag-msg" id="flag-msg" aria-live="polite"></p>
      <div class="vim-help">
        <p><b>New to Vim?</b> These are all you need:</p>
        <dl>
          <dt><kbd>:</kbd></dt><dd>opens the command line at the bottom. Type a command, press Enter.</dd>
          <dt><kbd>/</kbd></dt><dd>searches the code. Type a word, press Enter.</dd>
          <dt>click a line</dt><dd>puts the cursor on it (or use <kbd>j</kbd> / <kbd>k</kbd>)</dd>
          <dt><kbd>i</kbd></dt><dd>edits the code, <kbd>Esc</kbd> stops</dd>
        </dl>
        <p class="vim-phone">On a phone: switch to Code, tap a line to put the cursor there, and tap the bar at the bottom to type a command (or <kbd>/word</kbd> to search).</p>
      </div>
      <ol class="ctf-list" id="ctf-list"></ol>
      <p class="help-foot">Press <kbd>Esc</kbd> to close.</p>
    </div>
  </div>
  <div class="overlay" id="done" hidden role="dialog" aria-modal="true" aria-labelledby="done-title">
    <div class="help-box start-box">
      <p class="start-kicker">900 / 900 pts</p>
      <h2 class="start-title" id="done-title">Board cleared</h2>
      <p class="help-text">Thanks for playing. If you’d like to talk about a role or a project, here’s where to find me.</p>
      <div class="intro-actions">
        <a class="btn btn-primary" id="done-email" href="#contact"><svg class="icon" aria-hidden="true"><use href="#i-mail"/></svg>Email me</a>
        <a class="btn" href="https://github.com/RajaeDev6" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-github"/></svg>GitHub</a>
        <a class="btn" href="https://linkedin.com/in/rajae-g" target="_blank" rel="noopener"><svg class="icon" aria-hidden="true"><use href="#i-linkedin"/></svg>LinkedIn</a>
      </div>
      <p class="help-foot"><button type="button" class="linkish" id="done-close">Close</button> to keep looking around.</p>
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
const ctfEl = $('ctf');
const intro = $('intro');

/* ---------- state ---------- */

let current = null;
const typed = new Set();         // buffers already written out once
const edits = {};                // visitor edits, per buffer, this tab only
let typing = null;               // { buf, raf }
let cursorLine = 0;
let lastHTML = '';

const text = (b = current) => edits[b] ?? SOURCES[b];
// On phones the Preview/Code switch decides; on desktop the Hide code toggle does
const editorVisible = () => (narrow.matches ? app.dataset.view === 'code' : !app.classList.contains('code-hidden'));

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
  const edited = current in edits;
  const html = toHTML(nodes, { allow: ALLOWED_URLS, trusted: !edited, buffers: ALL });
  $('edit-note').hidden = !edited;
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
  if (!ALL.includes(buf)) return false;
  syncHiddenTab(buf);
  if (typing) stopTyping();
  current = buf;
  app.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.buf === buf)));
  app.querySelector(`.tab[data-buf="${CSS.escape(buf)}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
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

// An unlisted buffer gets a tab only while it is open
function syncHiddenTab(buf) {
  app.querySelector('.tab.hidden-tab')?.remove();
  if (!HIDDEN.includes(buf)) return;
  const t = document.createElement('button');
  t.className = 'tab hidden-tab';
  t.type = 'button';
  t.setAttribute('role', 'tab');
  t.dataset.buf = buf;
  t.innerHTML = `<span class="tab-n">~</span>${buf}.rg`;
  t.addEventListener('click', () => open(buf));
  app.querySelector('.tabs').appendChild(t);
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
  const attack = findInjection(ta.value);
  if (attack && attack !== lastAttack) {
    lastAttack = attack;
    message(`Blocked ${attack}. Everything you type is rendered as plain text, so it can’t run. flag 3: ${flag3()}`);
  } else if (!attack) lastAttack = null;
});
let lastAttack = null;
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
$('edit-undo').addEventListener('click', resetEdits);
$('skip').addEventListener('click', stopTyping);

/* ---------- preview ⇄ code links ---------- */

previewEl.addEventListener('mouseover', (e) => showLink(e.target.closest('[data-l0]')));
previewEl.addEventListener('mouseleave', () => { bandLink.hidden = true; });
previewEl.addEventListener('focusin', (e) => showLink(e.target.closest('[data-l0]')));

previewEl.addEventListener('click', (e) => {
  const shot = e.target.closest('.shot');
  if (shot) { openLightbox(shot); return; }
  if (e.target.closest('[data-inert]')) {
    e.preventDefault();
    message(current in edits
      ? 'Links are switched off while the code is edited. :e! puts the original back.'
      : 'That link was blocked: only links from the original source can be opened.', !(current in edits));
    return;
  }
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

// An empty command line shows how to use it
const IDLE = 'press : to type a command, try :ctf';
function message(t, isError = false) {
  msgEl.textContent = t || IDLE;
  msgEl.classList.toggle('error', isError);
  msgEl.classList.toggle('idle', !t);
}

/* ---------- command line ---------- */

let cmdPrefix = ':';
function openCmd(prefix = ':') {
  if (typing) stopTyping();
  cmdPrefix = prefix;
  $('cmd-label').textContent = prefix;
  cmdForm.hidden = false;
  msgEl.hidden = true;
  cmdInput.value = '';
  setMode(prefix === '/' ? 'SEARCH' : 'COMMAND');
  cmdInput.focus();
}

// /pattern: jump to the next line containing it (n and N repeat)
let lastSearch = '';
function search(term, dir = 1) {
  if (!term) return;
  lastSearch = term;
  const ls = (ta.value || text()).split('\n');
  const needle = term.toLowerCase();
  for (let k = 1; k <= ls.length; k++) {
    const n = (cursorLine + dir * k + ls.length * 2) % ls.length;
    if (ls[n].toLowerCase().includes(needle)) {
      markCursor(n, { sync: true });
      message(`/${term}`);
      return;
    }
  }
  message(`E486: Pattern not found: ${term}`, true);
}

function closeCmd() {
  cmdForm.hidden = true;
  msgEl.hidden = false;
  if (!typing) setMode('NORMAL');
}

function run(cmd) {
  const c = cmd.trim().replace(/^:/, '');
  if (!c) return;
  if (c.startsWith('/')) return search(c.slice(1));   // lets phones search from the command line
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
    case 'ls!': case 'buffers!': return message([...BUFFERS.map((b, i) => `${i + 1} ${b}.rg`), `${BUFFERS.length + 1}u ${HIDDEN[0]}.rg (unlisted)`].join('   '));
    case 'ctf': return showCtf();
    case 'decode': case 'b64': case 'base64': return decodeWith('base64', args.join(' '));
    case 'hex': return decodeWith('hex', args.join(' '));
    case 'rot13': return decodeWith('rot13', args.join(' '));
    case 'rev': case 'reverse': return decodeWith('rev', args.join(' '));
    case 'flag': return submitFlag(args.join(' '));
    case 'site': case 'normal': location.href = '/site/'; return;
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
  if (cmdPrefix === '/') search(value);
  else run(value);
});
cmdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); closeCmd(); message(''); }
});
cmdInput.addEventListener('blur', () => { if (!cmdForm.hidden) closeCmd(); });
// Tapping the command line opens it (phones have no ":" key handy)
app.querySelector('.cmdline').addEventListener('click', () => { if (cmdForm.hidden) openCmd(); });

/* ---------- help ---------- */

function showHelp() { helpEl.hidden = false; }
function hideHelp() { helpEl.hidden = true; }
helpEl.addEventListener('click', (e) => { if (e.target === helpEl) hideHelp(); });

/* ---------- keys (when not typing in the code or the command line) ---------- */

let pendingG = false;
document.addEventListener('keydown', (e) => {
  if (e.target === cmdInput || e.target === ta || e.target.id === 'flag-input') { if (e.key === 'Escape' && e.target.id === 'flag-input') ctfEl.hidden = true; return; }
  if (!lightbox.hidden) { if (e.key === 'Escape') closeLightbox(); return; }
  if (!ctfEl.hidden) { if (e.key === 'Escape' || e.key === 'q') { e.preventDefault(); ctfEl.hidden = true; } return; }
  if (!intro.hidden && e.key === 'Escape') { dismissIntro(); return; }
  if (!$('done').hidden) { if (e.key === 'Escape') $('done').hidden = true; return; }
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
  if (e.key === '/') { e.preventDefault(); openCmd('/'); return; }
  if (e.key === 'n' && lastSearch && !typing) { e.preventDefault(); search(lastSearch, 1); return; }
  if (e.key === 'N' && lastSearch && !typing) { e.preventDefault(); search(lastSearch, -1); return; }
  if (e.key === '?') { e.preventDefault(); showHelp(); return; }
  if (e.key === 'i' && editorVisible()) { e.preventDefault(); if (typing) stopTyping(); placeCaret(cursorLine); return; }
  if (/^[1-7]$/.test(e.key)) { dismissIntro(); e.preventDefault(); open(BUFFERS[Number(e.key) - 1]); return; }
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

tabs.forEach((t) => t.addEventListener('click', () => { dismissIntro(); open(t.dataset.buf); }));

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

/* ---------- capture the flag ---------- */

// A small jeopardy-style board. Each flag is hidden somewhere a real CTF would hide it,
// next to something on the site worth a look. Flags are checked by SHA-256 hash.
const CHALLENGES = [
  {
    category: 'Recon', points: 100, title: 'Unlisted',
    blurb: 'Not everything open in this editor has a tab.',
    hints: ['Vim can list buffers that are hidden from the normal list.', 'Run :ls! and open what you find with :e.'],
    hash: '5b78a99b3c6c582b58cc6c42989ed5e0d62d21782d78c98e15720a391b7dd7e9',
  },
  {
    category: 'Crypto', points: 200, title: 'Summer job',
    blurb: 'One line in my internship isn’t written for humans.',
    hints: ['Open experience.rg and read the internship’s code closely.', 'Put the cursor on the odd line and try the decoders, starting with :decode.'],
    hash: 'f633a3187b0e3e9c9a0adf0296d301377a9031729c9b21b6a48b57d412b6a203',
  },
  {
    category: 'Web', points: 300, title: 'Defended',
    blurb: 'This editor says you can’t run code in it. Prove it wrong.',
    hints: ['Press i to edit the code; the preview re-renders as you type.', 'Change a link to javascript:alert(1), or slip in a <script> tag.'],
    hash: 'f55a6d298066c78a134b366dd482a88d2a84fc4e4aebddeda7a602c37eb7ff8b',
  },
  {
    category: 'Forensics', points: 300, title: 'View source',
    blurb: 'The normal portfolio left a note for anyone who reads its source.',
    hints: ['Open the normal portfolio and view the page source (Ctrl+U, or Cmd+Option+U on a Mac).', 'Look near SOC Shift, copy the numbers and run :hex followed by them here.'],
    hash: '118ed10ece64dc05d9ef5675fd698c3e5605b9fa92155f6c9d9eb4bcccd5f61b',
  },
];
const TOTAL = CHALLENGES.reduce((n, c) => n + c.points, 0);
const found = new Set(JSON.parse(store.get('rg-ctf') || '[]').filter((i) => i < CHALLENGES.length));
const hintsShown = CHALLENGES.map(() => 0);
const score = () => [...found].reduce((n, i) => n + CHALLENGES[i].points, 0);

// The Web flag is shown when an injection attempt is blocked; it is stored scrambled
function flag3() {
  return [97, 125, 90, 77, 92, 85, 92, 52, 46, 13, 60, 22, 2, 28, 12, 8, 235, 227, 255, 255, 226]
    .map((c, i) => String.fromCharCode(c ^ ((19 + i * 7) % 256))).join('');
}

/* decoders: the line under the cursor, or the text after the command */

const DECODERS = {
  base64: (t) => { const out = atob(t.replace(/\s+/g, '')); if (!/^[\x20-\x7e]+$/.test(out)) throw new Error(); return out; },
  hex: (t) => {
    const clean = t.replace(/0x/gi, '').replace(/[^0-9a-f]/gi, '');
    if (!clean || clean.length % 2) throw new Error();
    const out = clean.match(/../g).map((h) => String.fromCharCode(parseInt(h, 16))).join('');
    if (!/^[\x20-\x7e]+$/.test(out)) throw new Error();
    return out;
  },
  rot13: (t) => t.replace(/[a-z]/gi, (c) => String.fromCharCode((c <= 'Z' ? 65 : 97) + ((c.toLowerCase().charCodeAt(0) - 97 + 13) % 26))),
  rev: (t) => [...t].reverse().join(''),
};

// The text on the cursor line: a "string", or a comment
function payloadAtCursor() {
  const ls = (ta.value || text()).split('\n');
  const line = ls[ta === document.activeElement ? lineOfCaret() : cursorLine] || '';
  if (/^\s*--/.test(line)) return line.replace(/^\s*--\s?/, '').trim();
  const str = line.match(/"([^"]*)"/);
  return str ? str[1] : null;
}

function decodeWith(kind, arg) {
  const input = arg.trim() || payloadAtCursor();
  const cmd = kind === 'base64' ? 'decode' : kind;
  if (!input) return message(`Put the cursor on a line to decode, or type :${cmd} followed by some text.`, true);
  let out;
  try { out = DECODERS[kind](input); } catch {
    return message(`That doesn’t decode as ${kind}. Try another decoder.`, true);
  }
  message(`${kind} → ${out}`);
  const flag = out.match(/rg\{[^}]+\}/);
  if (flag) submitFlag(flag[0], { quiet: true });
}

async function sha256(t) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function submitFlag(value, { quiet = false } = {}) {
  const say = (t, err = false) => { message(t, err); $('flag-msg').textContent = t; $('flag-msg').classList.toggle('error', err); };
  const v = value.trim();
  if (!v) return say('Usage: :flag rg{...}', true);
  if (!window.crypto?.subtle) return say('Your browser can’t check flags here.', true);
  const h = await sha256(v);
  const i = CHALLENGES.findIndex((c) => c.hash === h);
  if (i < 0) return quiet ? undefined : say('Not a flag. Keep looking.', true);
  const c = CHALLENGES[i];
  if (found.has(i)) return say(`Already solved: ${c.category} · ${c.title}.`);
  found.add(i);
  store.set('rg-ctf', JSON.stringify([...found]));
  syncFlags();
  if (found.size === CHALLENGES.length) { finish(); return; }
  say(`Solved ${c.category} · ${c.title} (+${c.points}). ${score()} / ${TOTAL} pts. :ctf for the board.`);
}

// Board cleared: open the contact buffer and show where to reach me
function finish() {
  ctfEl.hidden = true;
  open('contact');
  $('done-email').href = `mailto:${['rgivans9', 'gmail.com'].join('@')}`;
  $('done').hidden = false;
  $('done-email').focus();
}
$('done-close').addEventListener('click', () => { $('done').hidden = true; });
$('done').addEventListener('click', (e) => { if (e.target.id === 'done') $('done').hidden = true; });
$('flag-form').addEventListener('submit', (e) => {
  e.preventDefault();
  submitFlag($('flag-input').value);
  $('flag-input').value = '';
});

function syncFlags() {
  $('flags').textContent = `CTF ${found.size}/${CHALLENGES.length}`;
  const cleared = found.size === CHALLENGES.length;
  $('mission').classList.toggle('complete', cleared);
  $('mission-text').innerHTML = cleared
    ? `<b>Board cleared.</b> ${TOTAL} / ${TOTAL} points. Thanks for playing.`
    : found.size
      ? `<b>${found.size} of ${CHALLENGES.length} solved</b> · ${score()} / ${TOTAL} points`
      : `<b>There’s a CTF hidden in this site.</b> ${CHALLENGES.length} challenges, ${TOTAL} points. No Vim experience needed.`;
  $('mission-btn').textContent = cleared ? 'Contact me' : 'Open the board';
  $('score').textContent = `${score()} / ${TOTAL} pts`;
  $('ctf-list').innerHTML = CHALLENGES.map((c, i) => {
    const solved = found.has(i);
    const shown = solved ? '' : c.hints.slice(0, hintsShown[i]).map((h) => `<span class="tip">${h}</span>`).join('');
    const more = !solved && hintsShown[i] < c.hints.length ? `<button type="button" class="linkish" data-hint="${i}">Hint ${hintsShown[i] + 1}</button>` : '';
    return `<li class="chal${solved ? ' done' : ''}">
      <div class="chal-head"><span class="chal-cat">${c.category}</span><b>${c.title}</b><span class="chal-pts">${solved ? 'solved' : c.points + ' pts'}</span></div>
      <span class="chal-blurb">${c.blurb}</span>${shown}${more}
    </li>`;
  }).join('');
}
$('ctf-list').addEventListener('click', (e) => {
  const b = e.target.closest('[data-hint]');
  if (!b) return;
  hintsShown[Number(b.dataset.hint)]++;
  syncFlags();
});

function showCtf() { dismissIntro(); syncFlags(); $('flag-msg').textContent = ''; ctfEl.hidden = false; }
$('flags').addEventListener('click', showCtf);
$('mission-btn').addEventListener('click', () => {
  if (found.size === CHALLENGES.length) { finish(); return; }
  showCtf();
});
ctfEl.addEventListener('click', (e) => { if (e.target === ctfEl) ctfEl.hidden = true; });
$('ctf-close').addEventListener('click', () => { ctfEl.hidden = true; });

/* ---------- first visit ---------- */

function dismissIntro() {
  if (intro.hidden) return;
  intro.hidden = true;
  store.set('rg-intro', 'seen');
}
app.querySelectorAll('.intro-ok').forEach((b) => b.addEventListener('click', dismissIntro));
app.querySelectorAll('.intro-ctf').forEach((b) => b.addEventListener('click', showCtf));
if (!store.get('rg-intro')) intro.hidden = false;

// A pointer to the normal portfolio, so nobody is lost in the editor. Shows until closed or used.
const nudge = $('nudge');
function closeNudge() { nudge.hidden = true; store.set('rg-nudge', 'closed'); }
function showNudge() { if (!store.get('rg-nudge')) setTimeout(() => { nudge.hidden = false; }, 700); }
// On phones, don't stack it on top of the first-visit note; wait until that's closed
if (narrow.matches && !intro.hidden) app.querySelectorAll('.intro-ok, .intro-ctf').forEach((b) => b.addEventListener('click', showNudge));
else showNudge();
$('nudge-close').addEventListener('click', closeNudge);
nudge.querySelector('a').addEventListener('click', () => store.set('rg-nudge', 'closed'));
$('site-link').addEventListener('click', () => store.set('rg-nudge', 'closed'));

/* ---------- start ---------- */

syncFlags();

syncCodeToggle();
syncViewToggle();
const start = bufferFor(location.hash.slice(1)) || { buf: 'about' };
open(start.buf, start);
