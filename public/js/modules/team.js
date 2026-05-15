// Team 团队模块
export default function render(blocks, config, siteConfig) {
  return `
    <div class="container">
      <div class="section-header">
        <h2>核心团队</h2>
        <p>汇聚行业精英，打造卓越技术团队</p>
      </div>
      <div class="team-grid">
        ${blocks.map(b => {
          const extra = b.extra_data || {};
          return `
            <div class="team-card">
              ${b.image_url 
                ? `<div class="team-avatar" style="overflow:hidden;padding:0"><img src="${b.image_url}" alt="${b.title}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" /></div>`
                : `<div class="team-avatar">${extra.avatar || '👤'}</div>`
              }
              <h3>${b.title}</h3>
              <div class="role">${extra.position || '职位'}</div>
              <p class="bio">${b.content}</p>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}