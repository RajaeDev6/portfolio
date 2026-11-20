// Mobile menu
const btn = document.getElementById('menu-btn');
const links = document.getElementById('nav-links');
const setMenu = (open) => {
  links.classList.toggle('open', open);
  btn.setAttribute('aria-expanded', String(open));
  btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  btn.querySelector('use').setAttribute('href', open ? '#i-x' : '#i-menu');
};
btn.addEventListener('click', () => setMenu(!links.classList.contains('open')));
links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// Show a border under the nav once the page has scrolled
const nav = document.querySelector('.nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Highlight the nav link for the section on screen (home page only)
const navLinks = [...links.querySelectorAll('a[href^="#"]')];
const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if (sections.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => observer.observe(s));
}

document.getElementById('year').textContent = new Date().getFullYear();

// Build email links at runtime so the address isn't sitting in the page source for scrapers
document.querySelectorAll('[data-email]').forEach((a) => {
  const [user, domain] = a.dataset.email.split('|');
  a.href = `mailto:${user}@${domain}`;
});

// Suggest the interactive version once, pointing at its nav link. Hidden for good once closed or used.
const tip = document.getElementById('nav-tip');
if (tip) {
  const KEY = 'rg-tip';
  let seen = false;
  try { seen = localStorage.getItem(KEY) === 'closed'; } catch {}
  const close = () => { tip.hidden = true; try { localStorage.setItem(KEY, 'closed'); } catch {} };
  if (!seen) tip.hidden = false;
  document.getElementById('nav-tip-close').addEventListener('click', close);
  document.querySelector('.nav-editor').addEventListener('click', close);
}
