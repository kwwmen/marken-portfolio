/**
 * VideoPulse — Main App
 * Загружает данные из JSON, рендерит секции, управляет видео и модалкой
 */

const App = {
  data: {
    site: null,
    works: [],
    pricing: [],
    testimonials: []
  },

  async init() {
    await this.loadData();
    this.render();
    this.setupVideoLazyLoad();
    this.setupModal();
    this.setupScrollReveal();
    this.setupTransformAnimation();
  },

  async loadData() {
    try {
      const [site, works, pricing, testimonials] = await Promise.all([
        fetch('data/site.json').then(r => r.json()),
        fetch('data/works.json').then(r => r.json()),
        fetch('data/pricing.json').then(r => r.json()),
        fetch('data/testimonials.json').then(r => r.json())
      ]);
      this.data = { site, works, pricing, testimonials };
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  },

  render() {
    this.renderHero();
    this.renderWorks();
    this.renderPricing();
    this.renderTestimonials();
    this.renderContact();
  },

  renderHero() {
    const { hero } = this.data.site;
    document.querySelector('.hero__title').textContent = hero.title;
    document.querySelector('.hero__subtitle').innerHTML = hero.subtitle;
    document.querySelector('.hero__cta .btn').textContent = hero.cta;
    document.querySelector('.hero__price').textContent = hero.priceNote;
  },

  renderWorks() {
    const grid = document.querySelector('.works__grid');
    if (!grid) return;

    grid.innerHTML = this.data.works.map((work, idx) => `
      <article class="work-card reveal" data-delay="${idx % 6}" data-work-id="${work.id}">
        <div class="work-card__media">
          <img 
            class="work-card__poster" 
            src="${work.poster}" 
            alt="${work.title}"
            width="540"
            height="960"
          />
          <video 
            class="work-card__video" 
            src="${work.video}"
            loop
            muted
            playsinline
            preload="none"
          ></video>
          <div class="work-card__play">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="work-card__info">
          <h3 class="work-card__title">${work.title}</h3>
          <div class="work-card__meta">
            <span>${work.category}</span>
            <span>•</span>
            <span>${work.duration} сек</span>
          </div>
        </div>
      </article>
    `).join('');
  },

  renderPricing() {
    const grid = document.querySelector('.pricing__grid');
    if (!grid) return;

    grid.innerHTML = this.data.pricing.map((item, idx) => `
      <article class="price-card reveal ${item.featured ? 'is-featured' : ''}" data-delay="${idx}">
        <h3 class="price-card__title">${item.title}</h3>
        <p class="price-card__description">${item.description}</p>
        <div class="price-card__price">${item.price}</div>
        <ul class="price-card__features">
          ${item.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
        <button class="btn btn-outline" onclick="window.open('${this.data.site.contact.telegramUrl}', '_blank')">
          Заказать
        </button>
        <p class="price-card__note">${item.note}</p>
      </article>
    `).join('');
  },

  renderTestimonials() {
    const grid = document.querySelector('.testimonials__grid');
    if (!grid) return;

    grid.innerHTML = this.data.testimonials.map((item, idx) => `
      <article class="testimonial reveal" data-delay="${idx % 3}">
        <p class="testimonial__quote">"${item.quote}"</p>
        <div class="testimonial__author">${item.author}</div>
        <div class="testimonial__role">${item.role}</div>
      </article>
    `).join('');
  },

  renderContact() {
    const section = document.querySelector('.contact');
    if (!section) return;
    const btn = section.querySelector('.btn');
    if (btn) {
      btn.onclick = () => window.open(this.data.site.contact.telegramUrl, '_blank');
    }
  },

  // ———————————————————————————————————————————————————————————————————————
  // Video Lazy Load — играет только то, что в кадре
  // ———————————————————————————————————————————————————————————————————————

  setupVideoLazyLoad() {
    const options = {
      root: null,
      rootMargin: '50px',
      threshold: 0.25
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('.work-card__video');
        if (!video) return;

        if (entry.isIntersecting) {
          // Загружаем видео при первом попадании в кадр
          if (video.readyState === 0) {
            video.load();
            video.addEventListener('loadeddata', () => {
              video.classList.add('is-loaded');
              video.play().catch(() => {});
            }, { once: true });
          } else {
            video.play().catch(() => {});
          }
        } else {
          // Останавливаем, когда уходит из кадра
          video.pause();
        }
      });
    }, options);

    document.querySelectorAll('.work-card').forEach(card => observer.observe(card));
  },

  // ———————————————————————————————————————————————————————————————————————
  // Modal — раскрытие ролика в полноэкранном режиме
  // ———————————————————————————————————————————————————————————————————————

  setupModal() {
    const modal = document.querySelector('.modal');
    if (!modal) return;

    const overlay = modal.querySelector('.modal__overlay');
    const close = modal.querySelector('.modal__close');
    const videoEl = modal.querySelector('.modal__video');

    const openModal = (workId) => {
      const work = this.data.works.find(w => w.id === workId);
      if (!work) return;

      videoEl.src = work.video;
      videoEl.load();
      modal.classList.add('is-active');
      document.body.style.overflow = 'hidden';
      
      videoEl.play().catch(() => {});
    };

    const closeModal = () => {
      modal.classList.remove('is-active');
      document.body.style.overflow = '';
      videoEl.pause();
      videoEl.currentTime = 0;
    };

    // Клик по карточке
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.work-card');
      if (card) {
        const workId = card.dataset.workId;
        openModal(workId);
      }
    });

    overlay.addEventListener('click', closeModal);
    close.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) {
        closeModal();
      }
    });
  },

  // ———————————————————————————————————————————————————————————————————————
  // Scroll Reveal — анимация появления при скролле
  // ———————————————————————————————————————————————————————————————————————

  setupScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  },

  // ———————————————————————————————————————————————————————————————————————
  // Transform Animation — сигнатурная анимация «фото → видео»
  // ———————————————————————————————————————————————————————————————————————

  setupTransformAnimation() {
    const video = document.querySelector('.transform__video');
    if (!video) return;

    // Внешний вид задаёт CSS-анимация. JS только запускает/останавливает воспроизведение.
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (video.readyState === 0) {
            video.load();
            video.addEventListener('loadeddata', () => video.play().catch(() => {}), { once: true });
          } else {
            video.play().catch(() => {});
          }
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 });

    observer.observe(video);
  }
};

// Запуск
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
