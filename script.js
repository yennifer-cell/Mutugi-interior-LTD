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
const enquiryForm = document.querySelector('#enquiry-form');
const formStatus = document.querySelector('#form-status');
const apiBaseUrl = window.location.protocol === 'file:' || (['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port !== '3000') ? 'http://localhost:3000' : '';

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

  enquiryForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = enquiryForm.querySelector('button[type="submit"]');
    const formData = Object.fromEntries(new FormData(enquiryForm));
    submitButton.disabled = true;
    formStatus.textContent = 'Sending your enquiry...';
    formStatus.className = 'form-status';

    try {
      const response = await fetch(`${apiBaseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json') ? await response.json() : {};
      if (!contentType.includes('application/json')) throw new Error('The enquiry service is unavailable. Please open the site with npm start and try again.');
      if (!response.ok) throw new Error(result.error || 'Unable to send enquiry.');
      enquiryForm.reset();
      formStatus.textContent = 'Thank you. We will be in touch shortly.';
      formStatus.classList.add('is-success');
    } catch (error) {
      formStatus.textContent = error.message;
      formStatus.classList.add('is-error');
    } finally {
      submitButton.disabled = false;
    }
  });
})();