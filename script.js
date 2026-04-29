// ---------- helpers ----------
const get = (obj, path) =>
  path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );

const thumbClass = (i) => `thumb thumb-${(i % 6) + 1}`;

// ---------- render ----------
function applyContent(data) {
  // simple text/href bindings
  document.querySelectorAll('[data-bind]').forEach((el) => {
    const value = get(data, el.dataset.bind);
    if (value != null) el.textContent = value;
  });
  document.querySelectorAll('[data-bind-href]').forEach((el) => {
    const value = get(data, el.dataset.bindHref);
    if (value != null) el.setAttribute('href', value);
  });

  // projects grid
  const projectsEl = document.querySelector('[data-render="projects"]');
  if (projectsEl) {
    projectsEl.innerHTML = (data.work?.projects || [])
      .map((p, i) => {
        const thumb = p.image
          ? `<div class="thumb" style="background-image:url('${escapeHtml(p.image)}');background-size:cover;background-position:center"></div>`
          : `<div class="${thumbClass(i)}"></div>`;
        return `
          <article class="project">
            ${thumb}
            <div class="meta">
              <h3>${escapeHtml(p.title)}</h3>
              <p>${escapeHtml(p.description)}</p>
              <span class="tag">${escapeHtml(p.tag)}</span>
            </div>
          </article>`;
      })
      .join('');
  }

  // about paragraphs
  const aboutP = document.querySelector('[data-render="about-paragraphs"]');
  if (aboutP) {
    aboutP.innerHTML = (data.about?.paragraphs || [])
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join('');
  }

  // capabilities / tools / strengths
  const lists = {
    capabilities: data.about?.capabilities,
    tools: data.about?.tools,
    strengths: data.about?.strengths,
  };
  Object.entries(lists).forEach(([key, items]) => {
    const el = document.querySelector(`[data-render="${key}"]`);
    if (el && items) {
      el.innerHTML = items.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
    }
  });

  // experience timeline
  const expEl = document.querySelector('[data-render="experience"]');
  if (expEl) {
    expEl.innerHTML = (data.experience?.roles || [])
      .map(
        (r) => `
        <li>
          <span class="years">${escapeHtml(r.years)}</span>
          <div>
            <h3>${escapeHtml(r.role)}</h3>
            <p class="company">${escapeHtml(r.company)}</p>
            <ul>
              ${(r.bullets || []).map((b) => `<li>${escapeHtml(b)}</li>`).join('')}
            </ul>
          </div>
        </li>`
      )
      .join('');
  }

  // contact cards
  const contactEl = document.querySelector('[data-render="contact"]');
  if (contactEl && data.contact) {
    const c = data.contact;
    contactEl.innerHTML = `
      <a href="mailto:${escapeHtml(c.email)}" class="contact-card">
        <span class="eyebrow">Email</span>
        <p>${escapeHtml(c.email)}</p>
      </a>
      <a href="tel:${escapeHtml(c.phone_link)}" class="contact-card">
        <span class="eyebrow">Phone</span>
        <p>${escapeHtml(c.phone_display)}</p>
      </a>
      <div class="contact-card">
        <span class="eyebrow">Location</span>
        <p>${escapeHtml(c.location)}</p>
      </div>`;
  }

  // page title from hero
  if (data.hero?.heading_line_1) {
    document.title = `Adam Tiran — Senior Multimedia Designer`;
  }
}

// ---------- reveal on scroll ----------
function setupReveal() {
  const els = document.querySelectorAll('section, .project, .timeline li, .contact-card');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    el.style.transition = 'opacity .7s ease, transform .7s ease';
    io.observe(el);
  });
}

// ---------- boot ----------
fetch('content.json', { cache: 'no-store' })
  .then((r) => r.json())
  .then((data) => {
    applyContent(data);
    setupReveal();
  })
  .catch((err) => {
    console.error('Failed to load content.json:', err);
  });

// ---------- Netlify Identity: redirect on login ----------
if (window.netlifyIdentity) {
  window.netlifyIdentity.on('init', (user) => {
    if (!user) {
      window.netlifyIdentity.on('login', () => {
        document.location.href = '/admin/';
      });
    }
  });
}
