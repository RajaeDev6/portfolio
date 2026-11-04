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

document.getElementById('year').textContent = new Date().getFullYear();
