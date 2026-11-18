// Access page: each section is a "file". Opening one prints a short access log,
// then shows the section. Everything stays reachable in any order, by click or by URL hash.
const view = document.querySelector('.os-view');
const log = document.getElementById('os-log');
const count = document.getElementById('os-count');
const nodes = [...document.querySelectorAll('.node')];
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const opened = new Set();
let run = 0;

document.body.classList.add('os-ready');

const lines = (label) => [
  `$ open ${label.toLowerCase().replace(/ /g, '-')}`,
  'resolving target ... ok',
  'checking credentials ... ok',
  `<span class="ok">access granted</span>`,
];

function show(key, { focus = true } = {}) {
  const panel = document.getElementById(`p-${key}`);
  const node = nodes.find((n) => n.dataset.node === key);
  if (!panel || !node) return;

  nodes.forEach((n) => n.removeAttribute('aria-current'));
  node.setAttribute('aria-current', 'true');
  document.querySelectorAll('.os-panel').forEach((p) => p.classList.remove('open'));

  const reveal = () => {
    panel.classList.add('open');
    if (!opened.has(key)) {
      opened.add(key);
      node.classList.add('done');
      node.querySelector('.node-mark').textContent = '[✓]';
      node.querySelector('.node-state').textContent = 'open';
      count.textContent = opened.size;
    }
    if (focus) panel.focus({ preventScroll: true });
    if (focus && window.innerWidth < 900) view.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  // Already opened, or reduced motion: no log, straight to the content
  if (reduced || opened.has(key)) { log.innerHTML = ''; reveal(); return; }

  const id = ++run;
  const steps = lines(node.querySelector('.node-name').textContent);
  log.innerHTML = '';
  steps.forEach((text, i) => {
    setTimeout(() => {
      if (id !== run) return;
      const row = document.createElement('div');
      row.innerHTML = text;
      log.appendChild(row);
      if (i === steps.length - 1) setTimeout(() => { if (id === run) reveal(); }, 180);
    }, i * 140);
  });
}

nodes.forEach((n) => n.addEventListener('click', () => {
  history.replaceState(null, '', `#${n.dataset.node}`);
  show(n.dataset.node);
}));
document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  history.replaceState(null, '', `#${a.dataset.open}`);
  show(a.dataset.open);
}));
window.addEventListener('hashchange', () => show(location.hash.slice(1)));

// First load: open the section in the URL, or About
const start = location.hash.slice(1);
show(nodes.some((n) => n.dataset.node === start) ? start : 'about', { focus: false });

// Email links are built here so the address isn't sitting in the page source
document.querySelectorAll('[data-email]').forEach((a) => {
  const [user, domain] = a.dataset.email.split('|');
  a.href = `mailto:${user}@${domain}`;
});
