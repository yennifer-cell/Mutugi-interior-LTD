(() => {
  if (typeof document === 'undefined') {
    return;
  }

const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const searchToggle = document.querySelector('.search-toggle');
const searchPanel = document.querySelector('.search-panel');
const searchInput = document.querySelector('#search-input');
const projects = document.querySelectorAll('.project');

menuToggle?.addEventListener('click', () => {
  const open = siteNav.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(open));
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('is-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.contact-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', window.location.pathname + window.location.search);
  });
});

document.querySelectorAll('.project').forEach((project) => {
  project.addEventListener('click', () => {
    if (window.matchMedia('(max-width: 800px)').matches) {
      project.classList.toggle('is-open');
    }
  });
});

searchToggle?.addEventListener('click', () => {
  const open = searchPanel.classList.toggle('is-open');
  searchToggle.setAttribute('aria-expanded', String(open));
  if (open) searchInput?.focus();
});

  searchInput?.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  projects.forEach((project) => {
    project.hidden = Boolean(query) && !project.textContent.toLowerCase().includes(query);
  });
  });
})();