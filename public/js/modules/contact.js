// Contact 联系我们模块
export default function render(blocks, config, siteConfig) {
  return `
    <div class="container">
      <div class="section-header">
        <h2>联系我们</h2>
        <p>随时与我们取得联系，期待与您合作</p>
      </div>
      <div class="contact-grid">
        <div class="contact-info">
          <div class="contact-item">
            <div class="icon">📧</div>
            <div>
              <h4>电子邮箱</h4>
              <p>${siteConfig.contact_email || 'contact@example.com'}</p>
            </div>
          </div>
          <div class="contact-item">
            <div class="icon">📞</div>
            <div>
              <h4>联系电话</h4>
              <p>${siteConfig.contact_phone || '400-000-0000'}</p>
            </div>
          </div>
          <div class="contact-item">
            <div class="icon">📍</div>
            <div>
              <h4>公司地址</h4>
              <p>${siteConfig.contact_address || '请填写公司地址'}</p>
            </div>
          </div>
          ${blocks.map(b => {
            const extra = b.extra_data || {};
            return `
              <div class="contact-item">
                <div class="icon">${extra.icon || '📌'}</div>
                <div>
                  <h4>${b.title}</h4>
                  <p>${b.content}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="contact-form" id="contact-form-area">
          <div class="form-group">
            <label>您的姓名 <span style="color:#ef4444">*</span></label>
            <input type="text" id="contact-name" placeholder="请输入您的姓名" />
          </div>
          <div class="form-group">
            <label>联系电话</label>
            <input type="text" id="contact-phone" placeholder="请输入联系电话" />
          </div>
          <div class="form-group">
            <label>电子邮箱</label>
            <input type="email" id="contact-email" placeholder="请输入电子邮箱" />
          </div>
          <div class="form-group">
            <label>咨询内容 <span style="color:#ef4444">*</span></label>
            <textarea id="contact-message" rows="4" placeholder="请输入您的需求或问题..."></textarea>
          </div>
          <button class="btn btn-primary" style="width:100%" id="contact-submit-btn">提交咨询 →</button>
          <div id="contact-result" style="display:none;margin-top:12px;padding:12px;border-radius:8px;text-align:center;font-size:0.9rem"></div>
        </div>
      </div>
    </div>
  `;
}

// 表单提交逻辑 - 在模块渲染后由 app.js 调用
export function init() {
  const btn = document.getElementById('contact-submit-btn');
  if (!btn) return;
  
  btn.addEventListener('click', async () => {
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const resultEl = document.getElementById('contact-result');
    
    if (!name || !message) {
      resultEl.style.display = 'block';
      resultEl.style.background = '#fef2f2';
      resultEl.style.color = '#dc2626';
      resultEl.textContent = '请至少填写姓名和咨询内容';
      return;
    }
    
    btn.disabled = true;
    btn.textContent = '提交中...';
    
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message })
      });
      const data = await res.json();
      
      if (data.success) {
        resultEl.style.display = 'block';
        resultEl.style.background = '#f0fdf4';
        resultEl.style.color = '#16a34a';
        resultEl.textContent = '提交成功！我们会尽快与您联系。';
        document.getElementById('contact-name').value = '';
        document.getElementById('contact-phone').value = '';
        document.getElementById('contact-email').value = '';
        document.getElementById('contact-message').value = '';
      } else {
        resultEl.style.display = 'block';
        resultEl.style.background = '#fef2f2';
        resultEl.style.color = '#dc2626';
        resultEl.textContent = data.error || '提交失败，请稍后重试';
      }
    } catch (e) {
      resultEl.style.display = 'block';
      resultEl.style.background = '#fef2f2';
      resultEl.style.color = '#dc2626';
      resultEl.textContent = '网络错误，请稍后重试';
    }
    
    btn.disabled = false;
    btn.textContent = '提交咨询 →';
  });
}
