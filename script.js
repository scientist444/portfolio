(() => {
  const data = window.PORTFOLIO_DATA;
  if (!data) return;

  const esc = (value = "") => String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);

  const media = project => `<video muted loop playsinline preload="none" poster="${esc(project.hero)}" aria-label="Short visual overview of ${esc(project.title)}"><source src="${esc(project.video)}" type="video/mp4"></video>`;
  const numberedList = (items, className = "decision-list") => `<div class="${className}">${items.map((item, index) => `<div class="decision"><span>${String(index + 1).padStart(2, "0")}</span><p>${esc(item)}</p></div>`).join("")}</div>`;

  function renderHome() {
    const grid = document.querySelector("#project-grid");
    const earlier = document.querySelector("#earlier-list");
    if (!grid || !earlier) return;

    grid.innerHTML = data.featured.map((project, index) => `<article class="project-card reveal">
      <div class="project-media">
        ${media(project)}
        <span class="project-index">${String(index + 1).padStart(2, "0")} / ${String(data.featured.length).padStart(2, "0")}</span>
        <span class="project-status ${project.status === "In progress" ? "active" : ""}">${esc(project.status)}</span>
        <div class="thumbnail-caption">
          <p class="thumbnail-role">${esc(project.role)}</p>
          <h3>${esc(project.title)}</h3>
          <div class="thumbnail-tags">${project.tags.slice(0, 3).map(tag => `<span>${esc(tag)}</span>`).join("")}</div>
        </div>
      </div>
      <div class="project-body">
        <div class="project-meta"><span>${esc(project.eyebrow)}</span><span>${esc(project.period)}</span></div>
        <p>${esc(project.summary)}</p>
        <a class="project-link" href="project.html?project=${encodeURIComponent(project.slug)}" aria-label="Read how I built ${esc(project.title)}">Read how I built it <span aria-hidden="true">↗</span></a>
      </div>
    </article>`).join("");

    earlier.innerHTML = data.earlier.map(project => `<${project.link ? "a" : "article"} class="earlier-card reveal" ${project.link ? `href="${esc(project.link)}" target="_blank" rel="noopener"` : ""}>
      <img src="${esc(project.image)}" alt="" loading="lazy">
      <div><h3>${esc(project.title)}</h3><small>${esc(project.meta)}</small></div>
      <p>${esc(project.summary)}</p>
      <div class="tag-row">${project.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
    </${project.link ? "a" : "article"}>`).join("");

    setupVideoPlayback();
  }

  function renderCase() {
    const root = document.querySelector("#case-root");
    if (!root) return;

    const slug = new URLSearchParams(location.search).get("project");
    const project = data.featured.find(item => item.slug === slug) || data.featured[0];
    document.title = `${project.title} — Muhammad Umer Sajid`;

    root.innerHTML = `<section class="case-hero section">
      <a class="case-back" href="index.html#projects">← Back to projects</a>
      <div class="case-title-row">
        <div>
          <p class="kicker">${esc(project.eyebrow)}</p>
          <h1 class="case-title">${esc(project.title)}</h1>
        </div>
        <span class="case-status ${project.status === "In progress" ? "active" : ""}">${esc(project.status)}</span>
      </div>
      <p class="case-summary">${esc(project.summary)}</p>
      <div class="tag-row">${project.tags.map(tag => `<span class="tag">${esc(tag)}</span>`).join("")}</div>
      <dl class="case-facts">
        <div><dt>Context</dt><dd>${esc(project.context)}</dd></div>
        <div><dt>My role</dt><dd>${esc(project.role)}</dd></div>
        <div><dt>Timeline</dt><dd>${esc(project.period)}</dd></div>
        <div><dt>Time spent</dt><dd>${esc(project.duration)}</dd></div>
      </dl>
      <div class="case-media">${media(project)}</div>
    </section>
    <section class="section case-layout">
      <aside class="case-aside">
        <p class="kicker">On this page</p>
        <nav aria-label="Case study sections">
          <a href="#brief">01 — What I was solving</a>
          <a href="#requirements">02 — Requirements</a>
          <a href="#architecture">03 — System layout</a>
          <a href="#circuit">04 — Circuit detail</a>
          <a href="#build">05 — What I built</a>
          <a href="#testing">06 — What I tested</a>
          <a href="#outcome">07 — Where it stands</a>
        </nav>
        <p class="privacy-note">I show focused circuit and board excerpts here. Full schematics, exact values and production source stay private.</p>
      </aside>
      <div class="case-content">
        <section class="case-block case-opening" id="brief">
          <p class="kicker">01 · Starting point</p>
          <h2>What I was trying to solve</h2>
          <p class="case-lead">${esc(project.challenge)}</p>
        </section>

        <section class="case-block" id="requirements">
          <p class="kicker">02 · Design requirements</p>
          <h2>What the system needed to do</h2>
          <div class="requirements-grid">${project.requirements.map((item, index) => `<article><span>R${String(index + 1).padStart(2, "0")}</span><p>${esc(item)}</p></article>`).join("")}</div>
          <h3 class="subsection-title">The choices I made</h3>
          ${numberedList(project.decisions)}
        </section>

        <section class="case-block" id="architecture">
          <p class="kicker">03 · System layout</p>
          <h2>How I broke the system down</h2>
          <div class="architecture-flow">${project.architecture.map((item, index) => `${index ? '<i aria-hidden="true">→</i>' : ""}<div>${esc(item)}</div>`).join("")}</div>
        </section>

        <section class="case-block" id="circuit">
          <p class="kicker">04 · ${esc(project.schematic.type)}</p>
          <h2>${esc(project.schematic.title)}</h2>
          <div class="schematic-panel">
            <figure class="schematic-canvas"><img src="${esc(project.schematic.src)}" loading="lazy" alt="${esc(project.schematic.title)} from ${esc(project.title)}"><figcaption>Focused public excerpt — not the complete design</figcaption></figure>
            <div class="schematic-explanation">
              <p>${esc(project.schematic.caption)}</p>
              <ul>${project.schematic.points.map(point => `<li>${esc(point)}</li>`).join("")}</ul>
            </div>
          </div>
          <div class="gallery evidence-gallery">${project.gallery.map((image, index) => `<figure><img src="${esc(image)}" loading="lazy" alt="${esc(project.title)} ${index ? "PCB or prototype" : "hardware"} view"><figcaption>${index ? "Selected PCB / prototype view" : "Primary hardware view"}</figcaption></figure>`).join("")}</div>
        </section>

        <section class="case-block" id="build">
          <p class="kicker">05 · Implementation</p>
          <h2>What I built myself</h2>
          ${numberedList(project.engineering)}
        </section>

        <section class="case-block" id="testing">
          <p class="kicker">06 · Bring-up and testing</p>
          <h2>How I checked the design</h2>
          <div class="validation-list">${project.validation.map(item => `<div><span aria-hidden="true">✓</span><p>${esc(item)}</p></div>`).join("")}</div>
          <p class="testing-note">${esc(project.testing)}</p>
        </section>

        <section class="case-block outcome-block" id="outcome">
          <p class="kicker">07 · Current status</p>
          <h2>Where the project stands</h2>
          <p class="outcome-statement">${esc(project.result)}</p>
          <div class="next-step"><span>What I would do next</span><p>${esc(project.nextStep)}</p></div>
          ${project.links.length ? `<div class="case-links">${project.links.map(link => `<a class="button button-primary" href="${esc(link.url)}" target="_blank" rel="noopener">${esc(link.label)} ↗</a>`).join("")}</div>` : ""}
        </section>
      </div>
    </section>`;

    setupVideoPlayback();
  }

  function setupVideoPlayback() {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting ? entry.target.play().catch(() => {}) : entry.target.pause()), {rootMargin: "120px", threshold: 0.2});
    document.querySelectorAll("video").forEach(video => observer.observe(video));
  }

  function setupShell() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".primary-nav");
    toggle?.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isOpen));
      nav?.classList.toggle("is-open", !isOpen);
    });
    nav?.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle?.setAttribute("aria-expanded", "false");
    }));
    addEventListener("scroll", () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const progress = max ? scrollY / max * 100 : 0;
      document.querySelector(".scroll-progress span")?.style.setProperty("width", `${progress}%`);
    }, {passive: true});
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        reveal.unobserve(entry.target);
      }
    }), {threshold: 0.08});
    document.querySelectorAll(".reveal").forEach(element => reveal.observe(element));
  }

  renderHome();
  renderCase();
  setupShell();
})();
