// Services 服务模块
export default function render(blocks, config, siteConfig) {
  return `
    <div class="container">
      <div class="section-header">
        <h2>核心服务</h2>
        <p>我们提供全方位的技术解决方案，助力企业数字化升级</p>
      </div>
      <div class="services-grid">
        ${blocks.map(b => `
          <div class="service-card">
            ${b.image_url 
              ? `<div style="margin-bottom:16px;border-radius:12px;overflow:hidden"><img src="${b.image_url}" alt="${b.title}" style="width:100%;height:140px;object-fit:cover;display:block" /></div>`
              : `<div class="service-icon">${b.extra_data?.icon || '🔧'}</div>`
            }
            <h3>${b.title}</h3>
            <p>${b.content}</p>
            <span class="learn-more">了解详情 →</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}