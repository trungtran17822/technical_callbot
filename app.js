(() => {
  const deck = document.getElementById('deck');
  const evalQualityTemplate = document.getElementById('evalQualityTemplate');
  const qcTemplate = document.getElementById('qcBenchmarkTemplate');
  const beforeSpeechBenchmarks = document.getElementById('slide-14');
  if (evalQualityTemplate && beforeSpeechBenchmarks) {
    beforeSpeechBenchmarks.before(evalQualityTemplate.content.firstElementChild.cloneNode(true));
  }
  if (qcTemplate && beforeSpeechBenchmarks) {
    beforeSpeechBenchmarks.before(qcTemplate.content.firstElementChild.cloneNode(true));
  }
  const slides = [...document.querySelectorAll('.slide')];
  const overview = document.getElementById('overview');
  const overviewList = document.getElementById('overviewList');
  const currentCounter = document.getElementById('currentNum');
  const progressBar = document.getElementById('progressBar');
  const overviewButton = document.getElementById('overviewBtn');
  const previousButton = document.getElementById('prevBtn');
  const nextButton = document.getElementById('nextBtn');
  const fullscreenButton = document.getElementById('fullscreenBtn');
  const overviewCount = document.querySelector('.overview-head h2 em');
  if (overviewCount) overviewCount.textContent = `${slides.length} slides`;
  const closingCount = document.querySelector('.close-bottom span:last-child');
  if (closingCount) closingCount.innerHTML = `THANK YOU <i>✚</i> ${slides.length} / ${slides.length}`;
  const coverCount = document.querySelector('.cover-bottom span:last-child');
  if (coverCount) coverCount.innerHTML = `01 <i>/</i> ${slides.length}`;

  // Keep slide footers outside the measured body so the fitting area stays clear.
  const slideBodies = slides.map(slide => {
    const body = document.createElement('div');
    body.className = 'slide-content';
    [...slide.children].forEach(child => {
      if (!child.matches('.slide-foot,.cover-bottom,.close-bottom,.section-label,.slide-no')) body.append(child);
    });
    slide.prepend(body);
    return body;
  });

  function fitSlides() {
    const viewportHeight = window.innerHeight;
    slides.forEach((slide, index) => {
      slide.classList.add('measure');
      const body = slideBodies[index];
      body.style.zoom = '1';
      body.style.width = '100%';
      const styles = getComputedStyle(slide);
      const paddingTop = parseFloat(styles.paddingTop) || 0;
      const paddingBottom = parseFloat(styles.paddingBottom) || 0;
      const availableWidth = slide.clientWidth - (parseFloat(styles.paddingLeft) || 0) - (parseFloat(styles.paddingRight) || 0);
      const naturalHeight = Math.ceil(body.scrollHeight);
      const availableHeight = Math.max(240, viewportHeight - paddingTop - paddingBottom - 12);
      const scale = naturalHeight > 0 ? Math.min(1, (availableHeight / naturalHeight) * .985) : 1;
      body.style.zoom = scale.toFixed(3);
      body.style.width = `${availableWidth / scale}px`;
      slide.classList.remove('measure');
      slide.style.setProperty('--fit-scale', scale.toFixed(3));
    });
  }
  let fitFrame = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fitSlides);
  };
  window.addEventListener('resize', scheduleFit, { passive: true });
  window.addEventListener('load', scheduleFit, { once: true });
  slides.forEach(slide => slide.querySelectorAll('img').forEach(image => image.addEventListener('load', scheduleFit, { once: true })));

  // Rebuild the controls as the compact floating navigation used in the reference deck.
  const oldControls = document.querySelector('.deck-controls');
  const controls = document.createElement('nav');
  controls.className = 'controls';
  controls.setAttribute('aria-label', 'Điều khiển trình chiếu');
  overviewButton.textContent = '▦';
  overviewButton.title = 'Mục lục';
  overviewButton.setAttribute('aria-label', 'Mở mục lục');
  currentCounter.className = 'counter';
  [overviewButton, previousButton, currentCounter, nextButton, fullscreenButton].forEach(node => controls.append(node));
  oldControls?.remove();
  document.querySelector('.topbar')?.remove();
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.append(progressBar);
  document.body.append(controls, progress);

  const pageMark = document.createElement('div');
  pageMark.className = 'page-mark';
  pageMark.innerHTML = '<span class="page-mark-cross">✚</span><span>CARE/VOICE <i>·</i> TECHNICAL REVIEW</span>';
  document.body.append(pageMark);

  let current = Math.max(0, Math.min(slides.length - 1, parseHash() ?? 0));
  let transitioning = false;
  let transitionTimer = null;
  let wheelTotal = 0;
  let wheelLocked = false;
  let wheelReset = null;
  let touchStart = null;
  let suppressClickUntil = 0;

  function parseHash() {
    const raw = location.hash.slice(1);
    const n = Number(raw.startsWith('slide-') ? raw.slice(6) : raw);
    return Number.isFinite(n) && n >= 1 ? n - 1 : null;
  }
  const pad = number => String(number).padStart(2, '0');

  function show(index, { hash = true, direction = null } = {}) {
    const next = (index + slides.length) % slides.length;
    if (transitioning) {
      clearTimeout(transitionTimer);
      slides.forEach(slide => slide.classList.remove('active','is-leaving','enter-forward','enter-backward','leave-forward','leave-backward'));
      slides[current].classList.add('active');
      transitioning = false;
    }
    if (next !== current && slides[current].classList.contains('active')) {
      transitioning = true;
      const previous = slides[current];
      const upcoming = slides[next];
      const forward = direction ? direction === 'forward' : next > current;
      const enterClass = forward ? 'enter-forward' : 'enter-backward';
      const leaveClass = forward ? 'leave-forward' : 'leave-backward';
      previous.classList.remove('active','enter-forward','enter-backward');
      previous.classList.add('is-leaving',leaveClass);
      upcoming.classList.remove('is-leaving','leave-forward','leave-backward');
      upcoming.classList.add('active',enterClass);
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(() => {
        previous.classList.remove('is-leaving',leaveClass);
        upcoming.classList.remove(enterClass);
        transitioning = false;
      }, 580);
    } else {
      slides.forEach((slide, i) => slide.classList.toggle('active', i === next));
    }
    current = next;
    currentCounter.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
    scheduleFit();
    progressBar.style.width = `${((current + 1) / slides.length) * 100}%`;
    document.title = `${pad(current + 1)} · ${slides[current].dataset.title} — Callbot y tế`;
    pageMark.classList.toggle('on-dark', slides[current].classList.contains('slide-cover') || slides[current].classList.contains('slide-close'));
    document.querySelectorAll('.overview-item').forEach((item, i) => {
      item.classList.toggle('active', i === current);
      if (i === current) item.setAttribute('aria-current','page');
      else item.removeAttribute('aria-current');
    });
    if (hash) history.replaceState(null, '', `#${current + 1}`);
    closeOverview();
  }
  function next() { show(current + 1, { direction: 'forward' }); }
  function previous() { show(current - 1, { direction: 'backward' }); }
  function openOverview() {
    overview.classList.add('open');
    overview.setAttribute('aria-hidden','false');
    overviewList.querySelectorAll('.overview-item')[current]?.focus();
  }
  function closeOverview() {
    overview.classList.remove('open');
    overview.setAttribute('aria-hidden','true');
  }
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  slides.forEach((slide, index) => {
    const item = document.createElement('button');
    item.className = 'overview-item';
    item.innerHTML = `<span>${pad(index + 1)}</span><b>${slide.dataset.title}</b>`;
    item.addEventListener('click', () => show(index, { direction: index >= current ? 'forward' : 'backward' }));
    overviewList.append(item);
  });

  previousButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  overviewButton.addEventListener('click', openOverview);
  document.getElementById('closeOverview').addEventListener('click', closeOverview);
  fullscreenButton.addEventListener('click', toggleFullscreen);
  overview.addEventListener('click', event => { if (event.target === overview) closeOverview(); });

  deck.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil || overview.classList.contains('open')) return;
    const slide = event.target.closest('.slide');
    if (!slide || event.target.closest('a,button,input,textarea,select,[role="button"]')) return;
    if (window.getSelection?.().toString()) return;
    if (event.clientX < window.innerWidth / 2) previous();
    else next();
  });
  deck.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#slide-"]');
    if (!link) return;
    event.preventDefault();
    const destination = Number(link.getAttribute('href').slice(7)) - 1;
    if (Number.isFinite(destination)) show(destination, { direction: destination >= current ? 'forward' : 'backward' });
  });

  document.addEventListener('keydown', event => {
    if (overview.classList.contains('open')) {
      const items = [...overviewList.querySelectorAll('.overview-item')];
      const active = items.indexOf(document.activeElement);
      if (event.key === 'Escape') { closeOverview(); return; }
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); items[Math.min(items.length - 1, active + 1)]?.focus(); }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); items[Math.max(0, active - 1)]?.focus(); }
      if (event.key === 'Enter' && active >= 0) show(active, { direction: active >= current ? 'forward' : 'backward' });
      return;
    }
    if (['ArrowRight','ArrowDown','PageDown',' '].includes(event.key)) { event.preventDefault(); next(); }
    else if (['ArrowLeft','ArrowUp','PageUp'].includes(event.key)) { event.preventDefault(); previous(); }
    else if (event.key.toLowerCase() === 'f') toggleFullscreen();
    else if (event.key.toLowerCase() === 'o') openOverview();
    else if (event.key === 'Home') show(0, { direction: 'backward' });
    else if (event.key === 'End') show(slides.length - 1, { direction: 'forward' });
  });

  document.addEventListener('wheel', event => {
    if (overview.classList.contains('open')) return;
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (!delta) return;
    event.preventDefault();
    if (wheelLocked) return;
    wheelTotal += delta;
    clearTimeout(wheelReset);
    wheelReset = setTimeout(() => { wheelTotal = 0; }, 130);
    if (Math.abs(wheelTotal) < 50) return;
    const forward = wheelTotal > 0;
    wheelTotal = 0;
    wheelLocked = true;
    show(current + (forward ? 1 : -1), { direction: forward ? 'forward' : 'backward' });
    setTimeout(() => { wheelLocked = false; }, 640);
  }, { passive: false });

  document.addEventListener('touchstart', event => {
    const t = event.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  document.addEventListener('touchend', event => {
    if (!touchStart || overview.classList.contains('open')) { touchStart = null; return; }
    const t = event.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 60) {
      const forward = (Math.abs(dx) >= Math.abs(dy) ? dx : dy) < 0;
      suppressClickUntil = Date.now() + 450;
      show(current + (forward ? 1 : -1), { direction: forward ? 'forward' : 'backward' });
    }
    touchStart = null;
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const destination = parseHash();
    if (destination !== null) show(destination, { hash: false, direction: destination >= current ? 'forward' : 'backward' });
  });
  show(current, { hash: false });
})();
