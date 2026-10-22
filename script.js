(() => {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#mobile-menu');
  toggle?.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    toggle.setAttribute('aria-label', expanded ? 'Abrir menú' : 'Cerrar menú');
    menu.hidden = expanded;
    document.body.classList.toggle('menu-open', !expanded);
  });
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Abrir menú');
    document.body.classList.remove('menu-open');
  }));
  document.querySelector('#year').textContent = new Date().getFullYear();
})();
