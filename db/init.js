const initSQL = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'site.db');

let db = null;

async function getDB() {
  if (db) return db;

  const SQL = await initSQL();

  // 确保 data 目录存在
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 如果数据库文件存在则加载，否则新建
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    // 运行迁移
    runMigrations(db);
  } else {
    db = new SQL.Database();
    initTables(db);
    seedData(db);
    saveDB();
  }

  return db;
}

function runMigrations(db) {
  try {
    // 检查 menu_items 是否有 module_id 列
    const cols = db.exec("PRAGMA table_info(menu_items)");
    if (cols.length > 0) {
      const colNames = cols[0].values.map(r => r[1]);
      if (!colNames.includes('module_id')) {
        db.run('ALTER TABLE menu_items ADD COLUMN module_id INTEGER DEFAULT NULL REFERENCES modules(id) ON DELETE SET NULL');
        saveDB();
      }
    }
  } catch (e) {
    console.log('Migration check:', e.message);
  }
}

function saveDB() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initTables(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS site_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      label TEXT DEFAULT '',
      type TEXT DEFAULT 'text',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS modules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT DEFAULT '',
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      config TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS content_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module_id INTEGER NOT NULL,
      block_key TEXT NOT NULL,
      title TEXT DEFAULT '',
      content TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      link_url TEXT DEFAULT '',
      extra_data TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      icon TEXT DEFAULT '',
      parent_id INTEGER DEFAULT NULL,
      module_id INTEGER DEFAULT NULL,
      sort_order INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      target TEXT DEFAULT '_self',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES menu_items(id) ON DELETE SET NULL,
      FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT DEFAULT '',
      size INTEGER DEFAULT 0,
      url TEXT NOT NULL,
      alt_text TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function seedData(db) {
  // 站点配置
  const configs = [
    ['site_name', '科技领航', '站点名称', 'text'],
    ['site_slogan', '创新科技，引领未来', '站点标语', 'text'],
    ['site_logo', '/css/logo.svg', '站点Logo', 'text'],
    ['primary_color', '#2563eb', '主题色', 'color'],
    ['secondary_color', '#7c3aed', '辅助色', 'color'],
    ['contact_email', 'contact@techlead.com', '联系邮箱', 'email'],
    ['contact_phone', '400-888-9999', '联系电话', 'text'],
    ['contact_address', '北京市朝阳区科技大厦A座28层', '公司地址', 'text'],
    ['icp_number', '京ICP备2026XXXXXX号', 'ICP备案号', 'text'],
    ['footer_text', '© 2026 科技领航. All rights reserved.', '页脚文字', 'text'],
    ['wechat_qr', '', '微信二维码', 'text'],
    ['hero_bg', '', '首页背景图', 'text'],
  ];

  const stmtConfig = db.prepare('INSERT INTO site_config (key, value, label, type) VALUES (?, ?, ?, ?)');
  configs.forEach(([key, value, label, type]) => {
    stmtConfig.run([key, value, label, type]);
  });
  stmtConfig.free();

  // 模块注册
  const modules = [
    ['hero', '首页横幅', 'hero', '🎯', 1, 1, '{"slides":3}'],
    ['about', '关于我们', 'about', '🏢', 1, 2, '{"layout":"split"}'],
    ['services', '服务项目', 'services', '⚙️', 1, 3, '{"columns":3}'],
    ['products', '产品展示', 'products', '📦', 1, 4, '{"columns":4}'],
    ['team', '团队介绍', 'team', '👥', 1, 5, '{"style":"cards"}'],
    ['stats', '数据统计', 'stats', '📊', 1, 6, '{"animation":true}'],
    ['testimonials', '客户评价', 'testimonials', '💬', 1, 7, '{"autoplay":true}'],
    ['contact', '联系我们', 'contact', '📧', 1, 8, '{"showMap":true}'],
  ];

  const stmtModule = db.prepare('INSERT INTO modules (name, label, type, icon, enabled, sort_order, config) VALUES (?, ?, ?, ?, ?, ?, ?)');
  modules.forEach(([name, label, type, icon, enabled, sort_order, config]) => {
    stmtModule.run([name, label, type, icon, enabled, sort_order, config]);
  });
  stmtModule.free();

  // 内容数据
  const blocks = [
    // Hero 模块 (module_id=1)
    [1, 'slide_1', '智领未来', '以AI驱动的创新解决方案，助力企业数字化转型升级', '', '#', '{}', 1, 1],
    [1, 'slide_2', '云原生架构', '高可用、弹性扩展的企业级云平台，99.99% SLA保障', '', '#', '{}', 2, 1],
    [1, 'slide_3', '数据智能', '大数据分析与机器学习，让数据驱动每一个商业决策', '', '#', '{}', 3, 1],

    // About 模块 (module_id=2)
    [2, 'main', '关于我们', '科技领航成立于2018年，是一家专注于企业数字化转型的高科技公司。我们汇聚了来自国内外顶尖科技企业的精英人才，拥有超过200项核心技术专利。', '', '', '{"founded":"2018","employees":"500+","patents":"200+"}', 1, 1],
    [2, 'mission', '我们的使命', '用创新科技赋能千行百业，让每一家企业都能享受数字化带来的红利。', '', '', '{}', 2, 1],
    [2, 'vision', '我们的愿景', '成为全球领先的企业数字化转型服务商，构建万物互联的智能世界。', '', '', '{}', 3, 1],

    // Services 模块 (module_id=3)
    [3, 'service_1', 'AI智能解决方案', '基于深度学习和自然语言处理技术，为企业提供智能客服、智能推荐、图像识别等AI解决方案，全面提升运营效率。', '', '#', '{"icon":"🤖"}', 1, 1],
    [3, 'service_2', '云计算服务', '提供公有云、私有云、混合云全栈解决方案，支持容器化部署、微服务架构，助力企业IT基础设施全面升级。', '', '#', '{"icon":"☁️"}', 2, 1],
    [3, 'service_3', '大数据分析', '海量数据采集、存储、处理、分析全链路服务，帮助企业挖掘数据价值，实现数据驱动的精准决策。', '', '#', '{"icon":"📈"}', 3, 1],
    [3, 'service_4', '物联网平台', '端到端IoT解决方案，覆盖设备接入、数据采集、边缘计算、云端管理，赋能智能制造和智慧城市。', '', '#', '{"icon":"🔗"}', 4, 1],
    [3, 'service_5', '区块链服务', '企业级区块链BaaS平台，支持供应链金融、数字资产、溯源存证等多种应用场景。', '', '#', '{"icon":"⛓️"}', 5, 1],
    [3, 'service_6', '网络安全', '全方位安全防护体系，包括渗透测试、安全审计、应急响应、合规咨询，守护企业数字资产安全。', '', '#', '{"icon":"🛡️"}', 6, 1],

    // Products 模块 (module_id=4)
    [4, 'product_1', 'DataFlow 数据平台', '一站式企业数据中台，支持实时数据集成、数据治理、数据服务，日处理数据量达PB级别。', '', '#', '{"badge":"热门","price":"按需定价"}', 1, 1],
    [4, 'product_2', 'CloudOps 运维平台', '智能运维平台，提供监控告警、日志分析、自动化运维、成本优化，降低运维成本40%。', '', '#', '{"badge":"新品","price":"¥9999/月起"}', 2, 1],
    [4, 'product_3', 'AI Bot 智能客服', '基于大语言模型的智能客服系统，支持多轮对话、知识库管理、工单系统，客服效率提升300%。', '', '#', '{"badge":"推荐","price":"¥5999/月起"}', 3, 1],
    [4, 'product_4', 'SecGuard 安全中枢', '企业安全运营中心，集成威胁检测、漏洞管理、态势感知，实现安全事件分钟级响应。', '', '#', '{"badge":"","price":"按需定价"}', 4, 1],

    // Team 模块 (module_id=5)
    [5, 'member_1', '张明远', 'CEO & 创始人', '', '', '{"avatar":"","bio":"前谷歌高级工程师，斯坦福大学CS博士，15年行业经验","social":{"linkedin":"#"}}', 1, 1],
    [5, 'member_2', '李思涵', 'CTO', '', '', '{"avatar":"","bio":"前阿里云首席架构师，清华大学博士，专注分布式系统","social":{"github":"#"}}', 2, 1],
    [5, 'member_3', '王浩然', '产品VP', '', '', '{"avatar":"","bio":"前腾讯产品总监，10年产品管理经验，擅长B端产品设计","social":{"twitter":"#"}}', 3, 1],
    [5, 'member_4', '陈雨薇', '设计总监', '', '', '{"avatar":"","bio":"前字节跳动设计负责人，多次获得红点设计大奖","social":{"dribbble":"#"}}', 4, 1],

    // Stats 模块 (module_id=6)
    [6, 'stat_1', '企业客户', '', '', '', '{"number":"500+","suffix":""}', 1, 1],
    [6, 'stat_2', '技术专利', '', '', '', '{"number":"200+","suffix":""}', 2, 1],
    [6, 'stat_3', '核心员工', '', '', '', '{"number":"500+","suffix":""}', 3, 1],
    [6, 'stat_4', '服务可用性', '', '', '', '{"number":"99.99","suffix":"%"}', 4, 1],

    // Testimonials 模块 (module_id=7)
    [7, 'review_1', '科技领航的AI解决方案帮助我们将客服效率提升了300%，客户满意度显著提高。', '王总监\n某大型电商平台', '', '', '{"rating":5,"company":"某大型电商平台"}', 1, 1],
    [7, 'review_2', 'DataFlow数据平台让我们的数据治理工作变得简单高效，数据质量提升了80%。', '李CTO\n某金融科技公司', '', '', '{"rating":5,"company":"某金融科技公司"}', 2, 1],
    [7, 'review_3', '合作三年来，科技领航的专业团队始终提供超出预期的服务，值得信赖。', '张VP\n某制造集团', '', '', '{"rating":5,"company":"某制造集团"}', 3, 1],

    // Contact 模块 (module_id=8)
    [8, 'main', '联系我们', '无论是项目咨询还是技术合作，我们都期待与您的沟通。', '', '', '{}', 1, 1],
  ];

  const stmtBlock = db.prepare(
    'INSERT INTO content_blocks (module_id, block_key, title, content, image_url, link_url, extra_data, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  blocks.forEach(([mid, key, title, content, img, link, extra, sort, vis]) => {
    stmtBlock.run([mid, key, title, content, img, link, extra, sort, vis]);
  });
  stmtBlock.free();

  // 导航菜单
  const menus = [
    ['首页', '#hero', '', null, 1, 1, 1, '_self'],
    ['关于我们', '#about', '', null, 2, 2, 1, '_self'],
    ['服务项目', '#services', '', null, 3, 3, 1, '_self'],
    ['产品展示', '#products', '', null, 4, 4, 1, '_self'],
    ['团队', '#team', '', null, 5, 5, 1, '_self'],
    ['联系我们', '#contact', '', null, 6, 8, 1, '_self'],
  ];

  const stmtMenu = db.prepare('INSERT INTO menu_items (label, url, icon, parent_id, module_id, sort_order, visible, target) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  menus.forEach(([label, url, icon, pid, mid, sort, vis, target]) => {
    stmtMenu.run([label, url, icon, pid, mid, sort, vis, target]);
  });
  stmtMenu.free();

  // 管理员账号 (密码: admin123 的简单hash)
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  db.run('INSERT INTO admin_users (username, password_hash, display_name) VALUES (?, ?, ?)', ['admin', hash, '系统管理员']);

  saveDB();
}

module.exports = { getDB, saveDB };