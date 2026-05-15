// 管理后台 JS
const API = '/admin/api';
let siteConfigData = {};
let authToken = localStorage.getItem('admin_token') || '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  if (authToken) {
    showAdmin();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.getElementById('login-wrapper').style.display = 'flex';
  document.getElementById('admin-layout').style.display = 'none';
}

function showAdmin() {
  document.getElementById('login-wrapper').style.display = 'none';
  document.getElementById('admin-layout').style.display = 'flex';
  const username = localStorage.getItem('admin_username') || '管理员';
  document.getElementById('admin-username').textContent = username;
  showPage('dashboard');
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.style.display = 'none';

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      authToken = data.token;
      localStorage.setItem('admin_token', authToken);
      localStorage.setItem('admin_username', data.user.display_name || data.user.username);
      showAdmin();
    } else {
      errorEl.textContent = data.error || '登录失败';
      errorEl.style.display = 'block';
    }
  } catch (err) {
    errorEl.textContent = '网络错误，请重试';
    errorEl.style.display = 'block';
  }
  return false;
}

function handleLogout() {
  authToken = '';
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_username');
  showLogin();
}

// 页面切换
function showPage(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');
  
  const titles = {
    'dashboard': '仪表盘',
    'site-config': '站点配置',
    'modules': '模块管理',
    'menu': '菜单管理',
    'contacts': '咨询管理'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  
  const renderers = {
    'dashboard': renderDashboard,
    'site-config': renderSiteConfig,
    'modules': renderModules,
    'menu': renderMenu,
    'contacts': renderContacts
  };
  
  if (renderers[page]) renderers[page]();
}

// API 工具（带认证）
async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': authToken } : {})
  };
  const res = await fetch(`${API}${path}`, {
    headers,
    ...options
  });
  if (res.status === 401) {
    handleLogout();
    showToast('登录已过期，请重新登录', 'error');
    return null;
  }
  return res.json();
}

// 前台API
async function publicApi(path) {
  const res = await fetch(`/api${path}`);
  return res.json();
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.background = 'var(--danger)';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ========== 仪表盘 ==========
async function renderDashboard() {
  const area = document.getElementById('content-area');
  
  const [configArr, modules, siteConfig] = await Promise.all([
    api('/config'),
    api('/modules'),
    publicApi('/config')
  ]);
  
  const enabledModules = modules.filter(m => m.enabled).length;
  
  area.innerHTML = `
    <div class="stats-row">
      <div class="stat-card">
        <div class="icon" style="background:#dbeafe">🧩</div>
        <div class="info">
          <h4>${enabledModules}/${modules.length}</h4>
          <p>已启用模块</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#ede9fe">🌐</div>
        <div class="info">
          <h4 style="font-size:1rem">${siteConfig.site_name || '企业官网'}</h4>
          <p>站点名称</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#d1fae5">📧</div>
        <div class="info">
          <h4 style="font-size:0.9rem">${siteConfig.contact_email || '-'}</h4>
          <p>联系邮箱</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="icon" style="background:#fef3c7">📞</div>
        <div class="info">
          <h4 style="font-size:0.9rem">${siteConfig.contact_phone || '-'}</h4>
          <p>联系电话</p>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>模块概览</h3>
        <button class="btn btn-outline btn-sm" onclick="showPage('modules')">管理模块</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>模块名称</th><th>类型</th><th>排序</th><th>状态</th></tr></thead>
          <tbody>
            ${modules.map(m => `
              <tr>
                <td style="font-weight:600">${m.label}</td>
                <td><span class="badge badge-info">${m.name}</span></td>
                <td>${m.sort_order}</td>
                <td><span class="badge ${m.enabled ? 'badge-success' : 'badge-danger'}">${m.enabled ? '已启用' : '已禁用'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>快速操作</h3>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="showPage('site-config')">🌐 编辑站点信息</button>
        <button class="btn btn-outline" onclick="showPage('modules')">🧩 管理模块</button>
        <button class="btn btn-outline" onclick="showPage('menu')">📋 管理菜单</button>
        <button class="btn btn-outline" onclick="window.open('/', '_blank')">👁️ 预览前台</button>
      </div>
    </div>
  `;
}

// ========== 站点配置 ==========
async function renderSiteConfig() {
  const area = document.getElementById('content-area');
  const configArr = await api('/config');
  
  // 转为 key-value 对象
  siteConfigData = {};
  configArr.forEach(c => { siteConfigData[c.key] = c.value; });
  
  const imageKeys = ['site_logo', 'site_favicon', 'wechat_qrcode'];
  
  const configFields = [
    { key: 'site_name', label: '站点名称', half: true },
    { key: 'site_slogan', label: '站点标语', half: true },
    { key: 'site_logo', label: 'Logo', half: true, image: true },
    { key: 'site_favicon', label: 'Favicon', half: true, image: true },
    { key: 'primary_color', label: '主题色', type: 'color', half: true },
    { key: 'secondary_color', label: '辅助色', type: 'color', half: true },
    { key: 'icp_number', label: 'ICP备案号', half: true },
    { key: 'copyright_text', label: '版权信息', half: true },
    { key: 'contact_email', label: '联系邮箱', half: true },
    { key: 'contact_phone', label: '联系电话', half: true },
    { key: 'contact_address', label: '联系地址', full: true },
    { key: 'seo_title', label: 'SEO标题', full: true },
    { key: 'seo_description', label: 'SEO描述', textarea: true, full: true },
    { key: 'seo_keywords', label: 'SEO关键词', full: true },
    { key: 'wechat_qrcode', label: '微信二维码', half: true, image: true },
    { key: 'weibo_url', label: '微博链接', half: true },
    { key: 'custom_head', label: '自定义HEAD代码', textarea: true, full: true },
    { key: 'custom_footer', label: '自定义页脚代码', textarea: true, full: true },
  ];
  
  area.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>🌐 站点全局配置</h3>
        <button class="btn btn-primary" onclick="saveSiteConfig()">💾 保存配置</button>
      </div>
      <div class="config-grid" id="config-form">
        ${configFields.map(f => `
          <div class="form-group ${f.full ? 'full' : ''}">
            <label>${f.label}</label>
            ${f.textarea 
              ? `<textarea id="cfg_${f.key}" rows="3">${siteConfigData[f.key] || ''}</textarea>`
              : f.image
                ? `<div class="image-upload-wrap">
                     <div class="image-preview-box" data-preview-id="cfg_preview_${f.key}" style="${siteConfigData[f.key] ? '' : 'display:none'}">
                       <img src="${siteConfigData[f.key] || ''}" class="image-preview-img" id="cfg_preview_${f.key}" onerror="this.parentElement.style.display='none'" />
                       <button type="button" class="image-remove-btn" onclick="removeImage(this, 'cfg_${f.key}')">✕</button>
                     </div>
                     <div class="image-input-row">
                       <input type="text" id="cfg_${f.key}" value="${(siteConfigData[f.key] || '').replace(/"/g, '"')}" placeholder="输入URL或上传图片" oninput="previewImageUrl(this)" />
                       <label class="btn btn-outline btn-sm image-upload-btn">
                         📤 上传
                         <input type="file" accept="image/*" style="display:none" onchange="uploadImage(this, 'cfg_${f.key}', 'cfg_preview_${f.key}')" />
                       </label>
                     </div>
                   </div>`
                : `<input type="${f.type || 'text'}" id="cfg_${f.key}" value="${(siteConfigData[f.key] || '').replace(/"/g, '"')}" />`
            }
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function saveSiteConfig() {
  const inputs = document.querySelectorAll('#config-form input, #config-form textarea');
  const configs = [];
  inputs.forEach(input => {
    const key = input.id.replace('cfg_', '');
    configs.push({ key, value: input.value });
  });
  
  await api('/config', {
    method: 'PUT',
    body: JSON.stringify({ configs })
  });
  showToast('站点配置已保存');
}

// ========== 模块管理 ==========
async function renderModules() {
  const area = document.getElementById('content-area');
  const modules = await api('/modules');
  
  area.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>🧩 模块管理</h3>
      </div>
      <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:16px">拖拽调整模块顺序，开关控制模块是否在前台显示</p>
      <div class="module-list" id="module-list">
        ${modules.map(m => `
          <div class="module-item" data-id="${m.id}" draggable="true">
            <span class="drag-handle">⋮⋮</span>
            <div class="module-info">
              <h4>${m.label}</h4>
              <p>${m.name} · 排序: ${m.sort_order}</p>
            </div>
            <div class="module-actions">
              <button class="btn btn-outline btn-sm" onclick="editModuleBlocks(${m.id}, '${m.label}')">编辑内容</button>
              <button class="toggle ${m.enabled ? 'active' : ''}" onclick="toggleModule(${m.id}, ${m.enabled ? 0 : 1})"></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  initDragSort();
}

async function toggleModule(id, enabled) {
  await api(`/modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled })
  });
  showToast(enabled ? '模块已启用' : '模块已禁用');
  renderModules();
}

// 拖拽排序
function initDragSort() {
  const list = document.getElementById('module-list');
  if (!list) return;
  
  let draggedItem = null;
  
  list.querySelectorAll('.module-item').forEach(item => {
    item.addEventListener('dragstart', () => {
      draggedItem = item;
      setTimeout(() => item.style.opacity = '0.4', 0);
    });
    
    item.addEventListener('dragend', () => {
      item.style.opacity = '1';
      draggedItem = null;
      saveModuleOrder();
    });
    
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (draggedItem && item !== draggedItem) {
        const rect = item.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          list.insertBefore(draggedItem, item);
        } else {
          list.insertBefore(draggedItem, item.nextSibling);
        }
      }
    });
  });
}

async function saveModuleOrder() {
  const items = document.querySelectorAll('#module-list .module-item');
  const orders = [];
  items.forEach((item, i) => {
    orders.push({ id: parseInt(item.dataset.id), sort_order: i });
  });
  
  await api('/modules-sort', {
    method: 'PUT',
    body: JSON.stringify({ orders })
  });
  showToast('模块顺序已更新');
}

// 编辑模块内容块
async function editModuleBlocks(moduleId, moduleName) {
  const blocks = await api(`/blocks/${moduleId}`);
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:700px">
      <h3>编辑「${moduleName}」内容</h3>
      <div id="blocks-editor">
        ${blocks.length === 0 ? '<p style="color:var(--text-light);text-align:center;padding:20px">暂无内容块</p>' : ''}
        ${blocks.map(b => `
          <div class="card" style="margin-bottom:12px;padding:16px" data-block-id="${b.id}">
            <div class="form-row">
              <div class="form-group">
                <label>标题</label>
                <input type="text" class="block-title" value="${(b.title || '').replace(/"/g, '"')}" placeholder="标题" />
              </div>
              <div class="form-group">
                <label>标识 (block_key)</label>
                <input type="text" class="block-key" value="${b.block_key}" placeholder="block_key" />
              </div>
            </div>
            <div class="form-group">
              <label>内容</label>
              <textarea class="block-content" rows="3">${b.content || ''}</textarea>
            </div>
            <div class="form-group">
              <label>图片</label>
              <div class="image-upload-wrap">
                <div class="image-preview-box" data-preview-id="preview_${b.id}" style="${b.image_url ? '' : 'display:none'}">
                  <img src="${b.image_url || ''}" class="image-preview-img" id="preview_${b.id}" onerror="this.parentElement.style.display='none'" />
                  <button type="button" class="image-remove-btn" onclick="removeImage(this, 'image_${b.id}')">✕</button>
                </div>
                <div class="image-input-row">
                  <input type="text" class="block-image" id="image_${b.id}" value="${(b.image_url || '').replace(/"/g, '"')}" placeholder="输入图片URL或上传图片" oninput="previewImageUrl(this)" />
                  <label class="btn btn-outline btn-sm image-upload-btn">
                    📤 上传
                    <input type="file" accept="image/*" style="display:none" onchange="uploadImage(this, 'image_${b.id}', 'preview_${b.id}')" />
                  </label>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label>额外数据 (JSON)</label>
              <textarea class="block-extra" rows="4" style="font-family:monospace;font-size:0.85rem;resize:vertical">${b.extra_data ? JSON.stringify(b.extra_data, null, 2) : '{}'}</textarea>
            </div>
            <div class="form-row" style="align-items:flex-end">
              <div class="form-group" style="flex:1">
                <div class="json-preview-area" style="display:none;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-top:4px;font-family:monospace;font-size:0.85rem;max-height:200px;overflow:auto;white-space:pre-wrap;word-break:break-all;line-height:1.6"></div>
              </div>
              <div class="form-group" style="display:flex;align-items:flex-end;gap:8px;flex-shrink:0">
                <button class="btn btn-outline btn-sm" onclick="formatJsonBlock(this)" title="格式化 JSON">格式化</button>
                <button class="btn btn-outline btn-sm" onclick="previewJsonBlock(this)" title="预览 JSON">👁 预览</button>
                <button class="btn btn-primary btn-sm" onclick="saveBlock(this, ${b.id})">保存</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBlock(${b.id}, this)">删除</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="addNewBlock(${moduleId})">+ 添加内容块</button>
        <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">关闭</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

async function saveBlock(btn, blockId) {
  const card = btn.closest('[data-block-id]');
  let extraData = card.querySelector('.block-extra').value;
  try { JSON.parse(extraData); } catch { extraData = '{}'; }
  
  const data = {
    title: card.querySelector('.block-title').value,
    block_key: card.querySelector('.block-key').value,
    content: card.querySelector('.block-content').value,
    image_url: card.querySelector('.block-image').value,
    extra_data: extraData
  };
  
  await api(`/blocks/${blockId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  showToast('内容块已保存');
}

// JSON 格式化
function formatJsonBlock(btn) {
  const card = btn.closest('[data-block-id]');
  const textarea = card.querySelector('.block-extra');
  try {
    const parsed = JSON.parse(textarea.value);
    textarea.value = JSON.stringify(parsed, null, 2);
    showToast('JSON 已格式化');
  } catch (e) {
    showToast('JSON 格式错误: ' + e.message, 'error');
  }
}

// JSON 预览
function previewJsonBlock(btn) {
  const card = btn.closest('[data-block-id]');
  const textarea = card.querySelector('.block-extra');
  const previewArea = card.querySelector('.json-preview-area');
  
  if (previewArea.style.display !== 'none') {
    previewArea.style.display = 'none';
    return;
  }
  
  try {
    const parsed = JSON.parse(textarea.value);
    // 语法高亮渲染
    previewArea.innerHTML = syntaxHighlight(JSON.stringify(parsed, null, 2));
    previewArea.style.display = 'block';
  } catch (e) {
    previewArea.innerHTML = `<span style="color:#ef4444">❌ JSON 语法错误: ${e.message}</span>`;
    previewArea.style.display = 'block';
  }
}

// JSON 语法高亮
function syntaxHighlight(json) {
  const amp = '&', lt = '<', gt = '>';
  json = json.replace(/&/g, amp + 'amp;').replace(/</g, amp + 'lt;').replace(/>/g, amp + 'gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'color:#b91c1c';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'color:#1e40af';
      }
    } else if (/true|false/.test(match)) {
      cls = 'color:#047857';
    } else if (/null/.test(match)) {
      cls = 'color:#6b7280';
    } else {
      cls = 'color:#9333ea';
    }
    return lt + 'span style="' + cls + '"' + gt + match + lt + '/span' + gt;
  });
}

async function deleteBlock(blockId, btn) {
  if (!confirm('确定删除此内容块？')) return;
  await api(`/blocks/${blockId}`, { method: 'DELETE' });
  btn.closest('[data-block-id]').remove();
  showToast('内容块已删除');
}

async function addNewBlock(moduleId) {
  const key = prompt('请输入 block_key (如 feature_1, slide_2):');
  if (!key) return;
  
  await api('/blocks', {
    method: 'POST',
    body: JSON.stringify({ module_id: moduleId, block_key: key, title: '', content: '', extra_data: '{}' })
  });
  showToast('内容块已添加');
  
  // 重新打开编辑窗口
  document.querySelector('.modal-overlay')?.remove();
  const modules = await api('/modules');
  const mod = modules.find(m => m.id === moduleId);
  if (mod) editModuleBlocks(moduleId, mod.label);
}

// ========== 菜单管理 ==========
async function renderMenu() {
  const area = document.getElementById('content-area');
  const menus = await api('/menus');
  const modules = await api('/modules');
  const moduleMap = {};
  modules.forEach(m => { moduleMap[m.id] = m; });
  
  area.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📋 菜单管理</h3>
        <button class="btn btn-primary btn-sm" onclick="showMenuItemModal()">+ 添加菜单项</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>名称</th><th>链接</th><th>关联模块</th><th>图标</th><th>排序</th><th>状态</th><th>操作</th></tr></thead>
          <tbody id="menu-tbody">
            ${menus.map(m => `
              <tr>
                <td style="font-weight:600">${m.label}</td>
                <td style="color:var(--primary)">${m.url}</td>
                <td>${m.module_id && moduleMap[m.module_id] ? `<span class="badge badge-success">${moduleMap[m.module_id].label}</span>` : '<span style="color:var(--text-light)">-</span>'}</td>
                <td>${m.icon || '-'}</td>
                <td>${m.sort_order}</td>
                <td>
                  <span class="badge ${m.visible ? 'badge-success' : 'badge-danger'}">
                    ${m.visible ? '显示' : '隐藏'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="editMenuItem(${m.id}, '${m.label}', '${m.url}', '${m.icon || ''}', ${m.sort_order}, ${m.visible}, ${m.module_id || 'null'})">编辑</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteMenuItem(${m.id})">删除</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-light)">暂无菜单项</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function showMenuItemModal() {
  const modules = await api('/modules');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>添加菜单项</h3>
      <div class="form-group">
        <label>菜单名称</label>
        <input type="text" id="menu_label" placeholder="如：博客、案例展示" oninput="autoFillModuleName(this.value)" />
      </div>
      <div class="form-group">
        <label>模块英文名（用于锚点链接，如 blog、cases）</label>
        <input type="text" id="menu_module_name" placeholder="自动生成或手动输入" />
      </div>
      <div class="form-group">
        <label>链接地址（自动生成）</label>
        <input type="text" id="menu_url" placeholder="如：#blog" readonly style="background:#f1f5f9" />
      </div>
      <div class="form-group">
        <label>图标 (emoji)</label>
        <input type="text" id="menu_icon" placeholder="如：📝" />
      </div>
      <div class="form-group">
        <label>排序（数字越小越靠前）</label>
        <input type="number" id="menu_order" value="0" />
      </div>
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px;margin-bottom:16px;font-size:0.85rem;color:#0369a1">
        💡 添加菜单项将自动创建一个对应的模块，之后可在"模块管理"中编辑该模块的内容。
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="addMenuItem()">添加</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

// 自动生成模块名
function autoFillModuleName(label) {
  const moduleNameInput = document.getElementById('menu_module_name');
  const urlInput = document.getElementById('menu_url');
  
  // 中文转拼音映射（常用词）
  const pinyinMap = {
    '博客': 'blog', '新闻': 'news', '案例': 'cases', '作品': 'portfolio',
    '下载': 'download', '常见问题': 'faq', '帮助': 'help', '价格': 'pricing',
    '合作伙伴': 'partners', '活动': 'events', '招聘': 'careers', '视频': 'videos',
    '画廊': 'gallery', '日志': 'log', '公告': 'announce', '会员': 'member',
    '社区': 'community', '资源': 'resources', '文档': 'docs', '教程': 'tutorials'
  };
  
  // 检查是否能直接匹配
  let moduleName = pinyinMap[label];
  
  // 如果没有直接匹配，尝试部分匹配
  if (!moduleName) {
    for (const [cn, en] of Object.entries(pinyinMap)) {
      if (label.includes(cn)) {
        moduleName = en;
        break;
      }
    }
  }
  
  // 如果还是没有，使用时间戳
  if (!moduleName) {
    moduleName = 'module_' + Date.now().toString(36);
  }
  
  moduleNameInput.value = moduleName;
  urlInput.value = '#' + moduleName;
}

async function addMenuItem() {
  const label = document.getElementById('menu_label').value.trim();
  const moduleName = document.getElementById('menu_module_name').value.trim();
  const url = document.getElementById('menu_url').value.trim();
  const icon = document.getElementById('menu_icon').value.trim();
  const order = parseInt(document.getElementById('menu_order').value) || 0;
  
  if (!label || !moduleName) {
    showToast('请填写菜单名称和模块英文名', 'error');
    return;
  }
  
  // 1. 先创建新模块
  const moduleResult = await api('/modules/create', {
    method: 'POST',
    body: JSON.stringify({ 
      name: moduleName, 
      label: label, 
      type: 'custom',
      icon: icon || '📄'
    })
  });
  
  if (!moduleResult || !moduleResult.id) {
    showToast('创建模块失败', 'error');
    return;
  }
  
  // 2. 创建菜单项并关联到新模块
  await api('/menus', {
    method: 'POST',
    body: JSON.stringify({ 
      label, 
      url, 
      icon, 
      sort_order: order, 
      module_id: moduleResult.id 
    })
  });
  
  document.querySelector('.modal-overlay')?.remove();
  showToast('菜单项已添加');
  renderMenu();
}

async function editMenuItem(id, label, url, icon, order, visible, moduleId) {
  const modules = await api('/modules');
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>编辑菜单项</h3>
      <div class="form-group">
        <label>菜单名称</label>
        <input type="text" id="edit_menu_label" value="${label}" />
      </div>
      <div class="form-group">
        <label>关联模块（选择后自动填充链接）</label>
        <select id="edit_menu_module_id" onchange="onEditMenuModuleSelect(this, 'edit_menu_url')">
          <option value="">-- 不关联模块 --</option>
          ${modules.map(m => `<option value="${m.id}" data-name="${m.name}" ${m.id === moduleId ? 'selected' : ''}>${m.label} (${m.name})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>链接地址</label>
        <input type="text" id="edit_menu_url" value="${url}" />
      </div>
      <div class="form-group">
        <label>图标</label>
        <input type="text" id="edit_menu_icon" value="${icon}" />
      </div>
      <div class="form-group">
        <label>排序</label>
        <input type="number" id="edit_menu_order" value="${order}" />
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
        <button class="btn btn-primary" onclick="updateMenuItem(${id})">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function onEditMenuModuleSelect(select, urlInputId) {
  const option = select.options[select.selectedIndex];
  const urlInput = document.getElementById(urlInputId);
  if (option.value) {
    urlInput.value = '#' + option.dataset.name;
  }
}

async function updateMenuItem(id) {
  const label = document.getElementById('edit_menu_label').value.trim();
  const url = document.getElementById('edit_menu_url').value.trim();
  const icon = document.getElementById('edit_menu_icon').value.trim();
  const order = parseInt(document.getElementById('edit_menu_order').value) || 0;
  const moduleId = document.getElementById('edit_menu_module_id').value || null;
  
  await api(`/menus/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ label, url, icon, sort_order: order, module_id: moduleId })
  });
  
  document.querySelector('.modal-overlay')?.remove();
  showToast('菜单项已更新');
  renderMenu();
}

async function deleteMenuItem(id) {
  if (!confirm('确定删除此菜单项？')) return;
  await api(`/menus/${id}`, { method: 'DELETE' });
  showToast('菜单项已删除');
  renderMenu();
}

// ========== 咨询管理 ==========
async function renderContacts() {
  const area = document.getElementById('content-area');
  
  // 从数据库获取联系表单提交（存在 content_blocks 中 module_id=8, block_key like 'msg_%'）
  let contacts = [];
  try {
    const blocks = await api('/blocks/8');
    contacts = blocks.filter(b => b.block_key && b.block_key.startsWith('msg_')).map(b => {
      let extra = {};
      try { extra = typeof b.extra_data === 'string' ? JSON.parse(b.extra_data) : (b.extra_data || {}); } catch {}
      return {
        id: b.id,
        name: b.title,
        message: b.content,
        email: extra.email || '',
        phone: extra.phone || '',
        status: extra.status || 'new',
        created_at: b.updated_at || ''
      };
    });
  } catch {}
  
  area.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3>📬 咨询管理</h3>
        <span style="font-size:0.85rem;color:var(--text-light)">共 ${contacts.length} 条记录</span>
      </div>
      ${contacts.length === 0 ? '<p style="text-align:center;color:var(--text-light);padding:40px">暂无咨询记录。用户提交表单后将在此显示。</p>' : `
      <div class="table-wrap">
        <table>
          <thead><tr><th>姓名</th><th>联系方式</th><th>内容</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>
            ${contacts.map(c => `
              <tr>
                <td style="font-weight:600">${c.name}</td>
                <td>
                  <div style="font-size:0.85rem">${c.email || '-'}</div>
                  <div style="font-size:0.85rem;color:var(--text-light)">${c.phone || '-'}</div>
                </td>
                <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.message}</td>
                <td>
                  <span class="badge ${c.status === 'new' ? 'badge-warning' : 'badge-success'}">
                    ${c.status === 'new' ? '待处理' : '已处理'}
                  </span>
                </td>
                <td>
                  ${c.status === 'new' ? `<button class="btn btn-success btn-sm" onclick="markContactDone(${c.id}, '${c.name}', '${c.message}')">标记已处理</button>` : ''}
                  <button class="btn btn-danger btn-sm" onclick="deleteContact(${c.id})">删除</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      `}
    </div>
  `;
}

async function markContactDone(id, name, message) {
  await api(`/blocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ extra_data: JSON.stringify({ status: 'done' }) })
  });
  showToast('已标记为已处理');
  renderContacts();
}

// ========== 图片上传与预览 ==========
function previewImageUrl(input) {
  const card = input.closest('.image-upload-wrap') || input.closest('.form-group');
  const previewBox = card.querySelector('.image-preview-box');
  const previewImg = card.querySelector('.image-preview-img');
  const url = input.value.trim();

  if (url && previewBox && previewImg) {
    previewImg.src = url;
    previewBox.style.display = 'block';
    previewImg.onerror = () => { previewBox.style.display = 'none'; };
  } else if (previewBox) {
    previewBox.style.display = 'none';
  }
}

async function uploadImage(fileInput, inputId, previewId) {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${API}/upload`, {
      method: 'POST',
      headers: { 'Authorization': authToken },
      body: formData
    });
    const data = await res.json();
    if (data.success && data.url) {
      const urlInput = document.getElementById(inputId);
      const previewBox = urlInput.closest('.image-upload-wrap').querySelector('.image-preview-box');
      const previewImg = document.getElementById(previewId);

      urlInput.value = data.url;
      if (previewImg) {
        previewImg.src = data.url;
        previewBox.style.display = 'block';
      }
      showToast('图片上传成功');
    } else {
      showToast(data.error || '上传失败', 'error');
    }
  } catch (err) {
    showToast('上传出错: ' + err.message, 'error');
  }

  // 重置 file input
  fileInput.value = '';
}

function removeImage(btn, inputId) {
  const urlInput = document.getElementById(inputId);
  if (urlInput) urlInput.value = '';
  const previewBox = btn.closest('.image-preview-box');
  if (previewBox) previewBox.style.display = 'none';
}

async function deleteContact(id) {
  if (!confirm('确定删除此咨询记录？')) return;
  await api(`/blocks/${id}`, { method: 'DELETE' });
  showToast('咨询记录已删除');
  renderContacts();
}