const express = require('express');
const { getDB, saveDB } = require('../db/init');

const router = express.Router();

// 辅助函数：将 sql.js 查询结果转为对象数组
function queryToArray(results) {
  if (!results || results.length === 0) return [];
  const cols = results[0].columns;
  return results[0].values.map(row => {
    const obj = {};
    cols.forEach((c, i) => obj[c] = row[i]);
    return obj;
  });
}

// ============ 站点配置 ============
router.get('/config', async (req, res) => {
  const db = await getDB();
  const results = db.exec('SELECT key, value, label, type FROM site_config');
  const configs = {};
  queryToArray(results).forEach(row => {
    configs[row.key] = row.value;
  });
  res.json(configs);
});

// ============ 导航菜单 ============
router.get('/menus', async (req, res) => {
  const db = await getDB();
  const results = db.exec('SELECT * FROM menu_items WHERE visible = 1 ORDER BY sort_order');
  res.json(queryToArray(results));
});

// ============ 已启用模块列表（按排序） ============
router.get('/modules', async (req, res) => {
  const db = await getDB();
  const results = db.exec('SELECT * FROM modules WHERE enabled = 1 ORDER BY sort_order');
  const modules = queryToArray(results).map(m => ({
    ...m,
    config: typeof m.config === 'string' ? JSON.parse(m.config || '{}') : m.config,
    enabled: !!m.enabled
  }));
  res.json(modules);
});

// ============ 模块内容 ============
router.get('/modules/:name', async (req, res) => {
  const db = await getDB();

  const modResult = db.exec('SELECT * FROM modules WHERE name = ? AND enabled = 1', [req.params.name]);
  const modules = queryToArray(modResult);
  if (modules.length === 0) {
    return res.status(404).json({ error: '模块不存在或未启用' });
  }

  const mod = modules[0];
  const blocksResult = db.exec(
    'SELECT * FROM content_blocks WHERE module_id = ? AND visible = 1 ORDER BY sort_order',
    [mod.id]
  );

  const blocks = queryToArray(blocksResult).map(b => ({
    ...b,
    extra_data: typeof b.extra_data === 'string' ? JSON.parse(b.extra_data || '{}') : b.extra_data
  }));

  res.json({
    module: {
      ...mod,
      config: typeof mod.config === 'string' ? JSON.parse(mod.config || '{}') : mod.config
    },
    blocks
  });
});

// ============ 所有模块及内容（一次性加载） ============
router.get('/all', async (req, res) => {
  const db = await getDB();

  const modsResult = db.exec('SELECT * FROM modules WHERE enabled = 1 ORDER BY sort_order');
  const modules = queryToArray(modsResult);

  const allData = modules.map(mod => {
    const blocksResult = db.exec(
      'SELECT * FROM content_blocks WHERE module_id = ? AND visible = 1 ORDER BY sort_order',
      [mod.id]
    );
    const blocks = queryToArray(blocksResult).map(b => ({
      ...b,
      extra_data: typeof b.extra_data === 'string' ? JSON.parse(b.extra_data || '{}') : b.extra_data
    }));

    return {
      ...mod,
      config: typeof mod.config === 'string' ? JSON.parse(mod.config || '{}') : mod.config,
      enabled: !!mod.enabled,
      blocks
    };
  });

  const configResult = db.exec('SELECT key, value FROM site_config');
  const siteConfig = {};
  queryToArray(configResult).forEach(row => {
    siteConfig[row.key] = row.value;
  });

  const menuResult = db.exec('SELECT * FROM menu_items WHERE visible = 1 ORDER BY sort_order');
  const menus = queryToArray(menuResult);

  res.json({ config: siteConfig, menus, modules: allData });
});

// ============ 提交联系表单 ============
router.post('/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: '请填写必填字段（姓名和咨询内容）' });
  }
  const db = await getDB();
  db.run(
    `INSERT INTO content_blocks (module_id, block_key, title, content, extra_data, sort_order, visible)
     VALUES (8, ?, ?, ?, ?, 99, 1)`,
    [
      'msg_' + Date.now(),
      name,
      message,
      JSON.stringify({ email, phone: phone || '', subject: subject || '', status: 'new' })
    ]
  );
  saveDB();
  res.json({ success: true, message: '留言已提交，我们会尽快与您联系！' });
});

module.exports = router;