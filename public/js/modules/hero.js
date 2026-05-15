// Hero 首页横幅模块
let heroSlidesData = [];

export default function render(blocks, config, siteConfig) {
  const slides = blocks.filter(b => b.block_key.startsWith('slide_'));
  heroSlidesData = slides.map(s => ({ title: s.title, content: s.content, image_url: s.image_url }));
  const currentSlide = slides[0] || { title: '欢迎', content: '' };
  const heroBg = currentSlide.image_url 
    ? `background-image:linear-gradient(rgba(15,23,42,0.7),rgba(15,23,42,0.8)),url(${currentSlide.image_url});background-size:cover;background-position:center` 
    : '';

  return `
    <div class="hero" ${heroBg ? `style="${heroBg}"` : ''}>
      <div class="hero-grid"></div>
      <div class="container">
        <div class="hero-content">
          <div class="hero-badge">🚀 ${siteConfig.site_slogan || '创新科技，引领未来'}</div>
          <h1><span>${currentSlide.title}</span></h1>
          <p>${currentSlide.content}</p>
          <div class="hero-buttons">
            <a href="#contact" class="btn btn-primary">免费咨询 →</a>
            <a href="#about" class="btn btn-outline">了解更多</a>
          </div>
          <div class="hero-slides">
            ${slides.map((_, i) => `<div class="hero-slide-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></div>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// 轮播逻辑 - 模块渲染后由 app.js 调用
export function init() {
  const slides = heroSlidesData;
  if (!slides || slides.length <= 1) return;

  let current = 0;
  const dots = document.querySelectorAll('.hero-slide-dot');
  const h1 = document.querySelector('.hero h1 span');
  const p = document.querySelector('.hero p');

  if (!h1 || !p) return;

  // 添加过渡动画样式
  h1.style.transition = 'opacity 0.5s ease';
  p.style.transition = 'opacity 0.5s ease';

  const heroEl = document.querySelector('.hero');

  function goTo(index) {
    if (!slides[index]) return;
    // 淡出
    h1.style.opacity = '0';
    p.style.opacity = '0';
    setTimeout(() => {
      current = index;
      h1.textContent = slides[index].title;
      p.textContent = slides[index].content;
      // 更新背景图
      if (heroEl) {
        if (slides[index].image_url) {
          heroEl.style.backgroundImage = `linear-gradient(rgba(15,23,42,0.7),rgba(15,23,42,0.8)),url(${slides[index].image_url})`;
          heroEl.style.backgroundSize = 'cover';
          heroEl.style.backgroundPosition = 'center';
        } else {
          heroEl.style.backgroundImage = '';
        }
      }
      dots.forEach((d, i) => d.classList.toggle('active', i === index));
      // 淡入
      h1.style.opacity = '1';
      p.style.opacity = '1';
    }, 300);
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

  // 自动轮播
  setInterval(() => goTo((current + 1) % slides.length), 5000);
}
