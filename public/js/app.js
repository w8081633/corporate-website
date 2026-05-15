// ============ 前台动态模块加载引擎 ============

class SiteApp {
  constructor() {
    this.data = null;
    this.modules = new Map();
    this.init();
  }

  async init() {
    try {
      // 并行加载数据和模块
      const [data] = await Promise.all([
        this.loadData(),
        this.loadModules()
      ]);

      this.data = data;
      this.renderConfig();
      this.renderMenus();
      this.renderModules();
      this.initScrollEffects();
      this.initNavToggle();

      // 隐藏加载动画
      setTimeout(() => {
        document.getElementById('page-loader').classList.add('hidden');
      }, 300);
    } catch (err) {
      console.error('初始化失败:', err);
      document.getElementById('page-loader').innerHTML = `
        <div style="text-align:center;color:#64748b">
          <p style="font-size:1.25rem;margin-bottom:8px">加载失败</p>
          <p style="font-size:0.9rem">${err.message}</p>
          <button onclick="location.reload()" style="margin-top:16px;padding:8px 24px;background:#2563eb;color:#fff;border:none;border-radius:8px;cursor:pointer">重试</button>
        </div>
      `;
    }
  }

  async loadData() {
    const res = await fetch('/api/all');
    if (!res.ok) throw new Error('API 请求失败');
    return await res.json();
  }

  async loadModules() {
    // 动态导入所有模块组件（保存整个模块对象以便调用 init 等方法）
    const moduleTypes = ['hero', 'about', 'services', 'products', 'team', 'stats', 'testimonials', 'contact'];
    const imports = moduleTypes.map(async type => {
      try {
        const mod = await import(`/js/modules/${type}.js`);
        this.modules.set(type, mod);
      } catch (e) {
        console.warn(`模块 ${type} 加载失败:`, e);
      }
    });
    await Promise.all(imports);
  }

  renderConfig() {
    const { config } = this.data;
    if (!config) return;

    // 更新页面标题
    document.title = `${config.site_name || '企业官网'} - ${config.site_slogan || ''}`;

    // 更新导航站点名和Logo
    const navName = document.getElementById('nav-site-name');
    if (navName) navName.textContent = config.site_name || '企业官网';

    // 更新导航Logo
    const navLogo = document.getElementById('nav-logo-img');
    if (navLogo && config.site_logo) {
      navLogo.src = config.site_logo;
      navLogo.style.display = 'block';
      const navLogoIcon = document.getElementById('nav-logo-icon');
      if (navLogoIcon) navLogoIcon.style.display = 'none';
    }

    // 更新Favicon
    if (config.site_favicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.site_favicon;
    }

    // 更新页脚
    const footerName = document.getElementById('footer-site-name');
    if (footerName) footerName.textContent = config.site_name || '';

    const footerText = document.getElementById('footer-text');
    if (footerText && config.site_slogan) footerText.textContent = config.site_slogan;

    const footerIcp = document.getElementById('footer-icp');
    if (footerIcp) footerIcp.textContent = config.footer_text || config.icp_number || '';

    const footerEmail = document.getElementById('footer-email');
    if (footerEmail && config.contact_email) {
      footerEmail.textContent = config.contact_email;
      footerEmail.href = `mailto:${config.contact_email}`;
    }

    const footerPhone = document.getElementById('footer-phone');
    if (footerPhone && config.contact_phone) footerPhone.textContent = config.contact_phone;

    const footerAddress = document.getElementById('footer-address');
    if (footerAddress && config.contact_address) footerAddress.textContent = config.contact_address;

    // 更新主题色
    if (config.primary_color) {
      document.documentElement.style.setProperty('--primary', config.primary_color);
    }
    if (config.secondary_color) {
      document.documentElement.style.setProperty('--secondary', config.secondary_color);
    }
  }

  renderMenus() {
    const { menus } = this.data;
    const navMenu = document.getElementById('nav-menu');
    const footerLinks = document.getElementById('footer-links');

    if (navMenu && menus) {
      navMenu.innerHTML = menus.map(m => 
        `<a href="${m.url}">${m.label}</a>`
      ).join('');
    }

    if (footerLinks && menus) {
      footerLinks.innerHTML = menus.slice(0, 4).map(m => 
        `<a href="${m.url}">${m.label}</a>`
      ).join('');
    }
  }

  renderModules() {
    const { modules } = this.data;
    const app = document.getElementById('app');
    if (!app || !modules) return;

    app.innerHTML = '';

    modules.forEach(mod => {
      const renderer = this.modules.get(mod.type);
      if (!renderer) {
        console.warn(`未找到模块渲染器: ${mod.type}`);
        return;
      }

      const section = document.createElement('section');
      section.id = mod.name;
      section.className = `section fade-in ${mod.type === 'hero' ? '' : mod.type === 'stats' ? '' : mod.type === 'about' || mod.type === 'team' ? 'section-gray' : ''}`;
      
      if (mod.type === 'stats') {
        section.className = 'stats-section fade-in';
      }

      try {
        const modExports = this.modules.get(mod.type);
        const renderer = modExports.default || modExports;
        section.innerHTML = renderer(mod.blocks || [], mod.config || {}, this.data.config);
        app.appendChild(section);

        // 模块渲染后初始化（如 contact 的表单事件绑定）
        if (modExports.init) {
          modExports.init();
        }
      } catch (e) {
        console.error(`渲染模块 ${mod.name} 失败:`, e);
      }
    });
  }

  initScrollEffects() {
    // 滚动显示动画
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // 导航栏滚动效果
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }

      // 高亮当前导航项
      this.highlightActiveNav();
    }, { passive: true });
  }

  highlightActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    let current = '';
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150 && rect.bottom > 150) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  initNavToggle() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');
    
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
      });

      // 点击菜单项后关闭
      menu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          menu.classList.remove('open');
        }
      });
    }
  }

}

// 启动应用
new SiteApp();