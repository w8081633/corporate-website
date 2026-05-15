// Products 产品模块
export default function render(blocks, config, siteConfig) {
  return `
    <div class="container">
      <div class="section-header">
        <h2>产品矩阵</h2>
        <p>基于前沿技术打造的企业级产品与解决方案</p>
      </div>
      <div class="products-grid">
        ${blocks.map(b => {
          const extra = b.extra_data || {};
          return `
            <div class="product-card">
              ${b.image_url 
                ? `<div style="margin-bottom:12px;border-radius:12px;overflow:hidden"><img src="${b.image_url}" alt="${b.title}" style="width:100%;height:160px;object-fit:cover;display:block" /></div>`
                : `<div class="product-icon">${extra.icon || '📦'}</div>`
              }
              <div>
                ${extra.badge ? `<span class="product-badge">${extra.badge}</span>` : ''}
                <h3 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">${b.title}</h3>
                <p style="font-size:0.9rem;color:var(--text-light);line-height:1.7">${b.content}</p>
                ${extra.price ? `<div class="product-price">${extra.price}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}