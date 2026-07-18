(() => {
  const data = window.PORTFOLIO_DATA;
  if (!data) return;
  const esc = (value = "") => String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
  const slugStatus = status => status.toLowerCase().replace(/\s+/g, "-");
  const media = project => `<video muted loop playsinline preload="none" poster="${esc(project.hero)}" aria-label="Animated system overview for ${esc(project.title)}"><source src="${esc(project.video)}" type="video/mp4"></video>`;

  function renderHome() {
    const grid = document.querySelector("#project-grid");
    const earlier = document.querySelector("#earlier-list");
    if (!grid || !earlier) return;
    grid.innerHTML = data.featured.map((p, i) => `<article class="project-card reveal" data-status="${slugStatus(p.status)}">
      <div class="project-media">${media(p)}<span class="project-index">${String(i + 1).padStart(2, "0")} / 08</span><span class="project-status ${p.status === "In progress" ? "active" : ""}">${esc(p.status)}</span></div>
      <div class="project-body"><div class="project-meta"><span>${esc(p.eyebrow)}</span><span>${esc(p.period)}</span></div><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><div class="tag-row">${p.tags.slice(0,4).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><a class="project-link" href="project.html?project=${encodeURIComponent(p.slug)}" aria-label="Read ${esc(p.title)} case study">View engineering case study <span aria-hidden="true">↗</span></a></div>
    </article>`).join("");
    earlier.innerHTML = data.earlier.map(p => `<${p.link ? "a" : "article"} class="earlier-card reveal" ${p.link ? `href="${esc(p.link)}" target="_blank" rel="noopener"` : ""}><img src="${esc(p.image)}" alt="" loading="lazy"><div><h3>${esc(p.title)}</h3><small>${esc(p.meta)}</small></div><p>${esc(p.summary)}</p><div class="tag-row">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div></${p.link ? "a" : "article"}>`).join("");

    document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(item => { item.classList.remove("is-active"); item.setAttribute("aria-pressed", "false"); });
      button.classList.add("is-active"); button.setAttribute("aria-pressed", "true");
      const filter = button.dataset.filter;
      document.querySelectorAll(".project-card").forEach(card => card.hidden = filter !== "all" && card.dataset.status !== filter);
    }));
    setupVideoPlayback();
  }

  function renderCase() {
    const root = document.querySelector("#case-root");
    if (!root) return;
    const slug = new URLSearchParams(location.search).get("project");
    const p = data.featured.find(item => item.slug === slug) || data.featured[0];
    document.title = `${p.title} — Muhammad Umer Sajid`;
    root.innerHTML = `<section class="case-hero section"><a class="case-back" href="index.html#projects">← Back to selected work</a><p class="kicker">${esc(p.eyebrow)} · ${esc(p.status)}</p><h1 class="case-title">${esc(p.title)}</h1><p class="case-summary">${esc(p.summary)}</p><div class="tag-row">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><dl class="case-facts"><div><dt>Context</dt><dd>${esc(p.context)}</dd></div><div><dt>Role</dt><dd>${esc(p.role)}</dd></div><div><dt>Timeline</dt><dd>${esc(p.period)}</dd></div><div><dt>Duration</dt><dd>${esc(p.duration)}</dd></div></dl><div class="case-media">${media(p)}</div></section>
      <section class="section case-layout"><aside class="case-aside"><p class="kicker">Case study map</p><nav aria-label="Case study sections"><a href="#problem">01 — Problem</a><a href="#decisions">02 — Decisions</a><a href="#architecture">03 — Architecture</a><a href="#engineering">04 — Engineering</a><a href="#evidence">05 — Evidence</a><a href="#outcome">06 — Outcome</a></nav><p class="privacy-note">Public portfolio view. Complete schematics, component values and production source are intentionally not shown.</p></aside><div class="case-content">
        <section class="case-block" id="problem"><p class="kicker">01 · Problem framing</p><h2>The engineering problem</h2><p>${esc(p.challenge)}</p></section>
        <section class="case-block" id="decisions"><p class="kicker">02 · Design decisions</p><h2>Choices that shaped the system</h2><div class="decision-list">${p.decisions.map((x,i)=>`<div class="decision"><span>${String(i+1).padStart(2,"0")}</span><p>${esc(x)}</p></div>`).join("")}</div></section>
        <section class="case-block" id="architecture"><p class="kicker">03 · Architecture</p><h2>A readable system path</h2><div class="architecture-flow">${p.architecture.map((x,i)=>`${i ? '<i aria-hidden="true">→</i>' : ''}<div>${esc(x)}</div>`).join("")}</div></section>
        <section class="case-block" id="engineering"><p class="kicker">04 · Implementation</p><h2>Work completed end to end</h2><div class="decision-list">${p.engineering.map((x,i)=>`<div class="decision"><span>${String(i+1).padStart(2,"0")}</span><p>${esc(x)}</p></div>`).join("")}</div></section>
        <section class="case-block" id="evidence"><p class="kicker">05 · Selected evidence</p><h2>Enough detail to understand—without exposing the design.</h2><div class="gallery">${p.gallery.map((img,i)=>`<figure><img src="${esc(img)}" loading="lazy" alt="Selected ${esc(p.title)} engineering view ${i+1}"><figcaption>${i ? "Selected PCB / prototype view" : "Primary hardware view"}</figcaption></figure>`).join("")}</div><p>${esc(p.testing)}</p></section>
        <section class="case-block" id="outcome"><p class="kicker">06 · Outcome</p><h2>${esc(p.result)}</h2>${p.links.length ? `<div class="case-links">${p.links.map(l=>`<a class="button button-primary" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}</section>
      </div></section>`;
    setupVideoPlayback();
  }

  function setupVideoPlayback() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const videos = document.querySelectorAll("video");
    if (reduced) return;
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.isIntersecting ? entry.target.play().catch(()=>{}) : entry.target.pause()), {rootMargin:"120px", threshold:.2});
    videos.forEach(video => observer.observe(video));
  }

  function setupShell() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector(".primary-nav");
    toggle?.addEventListener("click", () => { const open = toggle.getAttribute("aria-expanded") === "true"; toggle.setAttribute("aria-expanded", String(!open)); nav?.classList.toggle("is-open", !open); });
    nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("is-open"); toggle?.setAttribute("aria-expanded", "false"); }));
    addEventListener("scroll", () => { const max = document.documentElement.scrollHeight - innerHeight; const progress = max ? scrollY / max * 100 : 0; document.querySelector(".scroll-progress span")?.style.setProperty("width", `${progress}%`); }, {passive:true});
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add("is-visible"); reveal.unobserve(entry.target); } }), {threshold:.08});
    document.querySelectorAll(".reveal").forEach(el => reveal.observe(el));
  }
  renderHome(); renderCase(); setupShell();
})();
