// Stats 数据统计模块
export default function render(blocks, config, siteConfig) {
  return `
    <div class="container">
      <div class="stats-grid">
        ${blocks.map(b => `
          <div class="stat-item">
            <div class="stat-number">${b.title}</div>
            <div class="stat-label">${b.content}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}