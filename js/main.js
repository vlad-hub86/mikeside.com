// mikeside.com — shared behavior
document.addEventListener('DOMContentLoaded', () => {
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav ul');
  if (toggle && menu) {
    toggle.addEventListener('click', () => menu.classList.toggle('open'));
    menu.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => menu.classList.remove('open'))
    );
  }

  // Mark the current page's nav link active
  const here = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.nav ul a').forEach(a => {
    const href = a.getAttribute('href').replace(/index\.html$/, '');
    if (href !== '/' && here.startsWith(href)) a.classList.add('active');
    else if (href === '/' && (here === '/' || here === '')) a.classList.add('active');
  });

  // Footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
});
