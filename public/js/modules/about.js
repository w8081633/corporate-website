// About 关于我们模块
export default function render(blocks, config, siteConfig) {
  const stats = blocks.filter(b => b.block_key.startsWith('stat_'));
  const features = blocks.filter(b => b.block_key.startsWith('feature_'));

  return `
    <div class="container">
      <div class="section-header">
        <h2>关于我们</h2>
        <p>了解我们的故事、使命和核心优势</p>
      </div>
      <div class="about-grid">
        <div class="about-image">
          ${blocks.find(b => b.block_key === 'main_image' && b.image_url)
            ? `<img src="${blocks.find(b => b.block_key === 'main_image').image_url}" alt="关于我们" style="width:100%;height:100%;object-fit:cover;border-radius:16px" />`
            : `<svg viewBox="0 0 400 300" fill="none">
                <rect x="50" y="40" width="300" height="220" rx="16" stroke="#2563eb" stroke-width="2" fill="rgba(37,99,235,0.05)"/>
                <circle cx="200" cy="120" r="40" fill="rgba(37,99,235,0.1)" stroke="#2563eb" stroke-width="2"/>
                <path d="M180 115 L195 130 L220 105" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="100" y="180" width="80" height="8" rx="4" fill="rgba(37,99,235,0.2)"/>
                <rect x="200" y="180" width="100" height="8" rx="4" fill="rgba(124,58,237,0.2)"/>
                <rect x="120" y="200" width="160" height="6" rx="3" fill="rgba(37,99,235,0.1)"/>
              </svg>`
          }
        </div>
        <div>
          <h3 style="font-size:1.5rem;font-weight:700;margin-bottom:16px">引领数字化转型的先行者</h3>
          <p style="color:var(--text-light);line-height:1.8;margin-bottom:24px">
            我们是一家专注于企业数字化转型的高科技公司，拥有十年以上的行业经验。
            团队汇聚了来自BAT等顶级企业的技术精英，致力于为客户提供最前沿的AI、
            云计算和大数据解决方案。
          </p>
          <div class="about-features">
            ${features.map(f => `
              <div class="about-feature">
                <div class="about-feature-icon">${f.extra_data?.icon || '✨'}</div>
                <div>
                  <h4 style="font-weight:600;margin-bottom:4px">${f.title}</h4>
                  <p style="font-size:0.9rem;color:var(--text-light)">${f.content}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="about-stats">
            ${stats.map(s => `
              <div class="about-stat">
                <div class="number">${s.title}</div>
                <div class="label">${s.content}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}