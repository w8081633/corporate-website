// Testimonials 客户评价模块
export default function render(blocks, config, siteConfig) {
  return `
    <div class="container">
      <div class="section-header">
        <h2>客户评价</h2>
        <p>来自合作伙伴的真实反馈</p>
      </div>
      <div class="services-grid">
        ${blocks.map(b => {
          const extra = b.extra_data || {};
          return `
            <div class="service-card" style="position:relative">
              <div style="font-size:2.5rem;color:var(--primary);opacity:0.2;margin-bottom:12px">"</div>
              <p style="font-size:0.95rem;color:var(--text-light);line-height:1.8;margin-bottom:20px;font-style:italic">${b.content}</p>
              <div style="display:flex;align-items:center;gap:12px;border-top:1px solid var(--border);padding-top:16px">
                ${b.image_url 
                  ? `<img src="${b.image_url}" alt="${b.title}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" />`
                  : `<div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:1.1rem">${extra.avatar || b.title.charAt(0)}</div>`
                }
                <div>
                  <div style="font-weight:700;font-size:0.95rem">${b.title}</div>
                  <div style="font-size:0.85rem;color:var(--text-muted)">${extra.position || ''}</div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}