const express = require('express');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
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

// 辅助函数：获取单条记录
function queryFirst(results) {
  const arr = queryToArray(results);
  return arr.length > 0 ? arr[0] : null;
}

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============ 认证中间件 ============
function requireAuth(req, res, next) {
  const token = req.headers['authorization'] || req.query.token;
  if (!token || token !== req.app.locals.adminToken) {
    return res.status(401).json({ error: '未授权，请先登录' });
  }
  next();
}

// ============ 登录 ============
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const db = await getDB();
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    const results = db.exec('SELECT * FROM admin_users WHERE username = ? AND password_hash = ?', [username, hash]);
    const user = queryFirst(results);

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      req.app.locals.adminToken = token;
      res.json({ success: true, token, user: { id: user.id, username: user.username, display_name: user.display_name } });
    } else {
      res.status(401).json({ error: '用户名或密码错误' });
    }
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============ 站点配置管理 ============
router.get('/config', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    const results = db.exec('SELECT * FROM site_config ORDER BY key');
    res.json(queryToArray(results));
  } catch (err) {
    console.error('获取配置错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/config', requireAuth, async (req, res) => {
  try {
    const { configs } = req.body;
    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({ error: '无效的配置数据' });
    }

    const db = await getDB();
    configs.forEach(({ key, value }) => {
      db.run('UPDATE site_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
    });
    saveDB();
    res.json({ success: true, message: '配置已保存' });
  } catch (err) {
    console.error('保存配置错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============ 模块管理 ============
router.get('/modules', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    const results = db.exec('SELECT * FROM modules ORDER BY sort_order');
    res.json(queryToArray(results));
  } catch (err) {
    console.error('获取模块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/modules/create', requireAuth, async (req, res) => {
  try {
    const { name, label, type, icon, config } = req.body;
    if (!name || !label) {
      return res.status(400).json({ error: '模块名称和标签不能为空' });
    }

    const db = await getDB();
    
    // 检查 name 是否已存在
    const existing = db.exec('SELECT id FROM modules WHERE name = ?', [name]);
    if (existing.length > 0 && existing[0].values.length > 0) {
      return res.status(400).json({ error: '模块英文名已存在，请使用其他名称' });
    }

    // 获取最大排序号
    const maxSort = db.exec('SELECT MAX(sort_order) FROM modules');
    const nextSort = (maxSort.length > 0 && maxSort[0].values[0][0] != null) ? maxSort[0].values[0][0] + 1 : 1;

    db.run(
      'INSERT INTO modules (name, label, type, icon, enabled, sort_order, config) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, label, type || 'custom', icon || '📄', 1, nextSort, config || '{}']
    );
    const lastId = db.exec('SELECT last_insert_rowid()');
    const moduleId = lastId[0].values[0][0];
    saveDB();
    
    res.json({ success: true, id: moduleId, name, label });
  } catch (err) {
    console.error('创建模块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/modules/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, enabled, sort_order, config } = req.body;
    const db = await getDB();

    const updates = [];
    const values = [];
    if (label !== undefined) { updates.push('label = ?'); values.push(label); }
    if (enabled !== undefined) { updates.push('enabled = ?'); values.push(enabled ? 1 : 0); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (config !== undefined) { updates.push('config = ?'); values.push(typeof config === 'string' ? config : JSON.stringify(config)); }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length > 1) {
      values.push(Number(id));
      db.run(`UPDATE modules SET ${updates.join(', ')} WHERE id = ?`, values);
      saveDB();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('更新模块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/modules-sort', requireAuth, async (req, res) => {
  try {
    const { orders } = req.body;
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ error: '无效的排序数据' });
    }

    const db = await getDB();
    orders.forEach(({ id, sort_order }) => {
      db.run('UPDATE modules SET sort_order = ? WHERE id = ?', [sort_order, Number(id)]);
    });
    saveDB();
    res.json({ success: true });
  } catch (err) {
    console.error('排序模块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============ 内容块管理 ============
router.get('/blocks/:moduleId', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    const results = db.exec(
      'SELECT * FROM content_blocks WHERE module_id = ? ORDER BY sort_order',
      [Number(req.params.moduleId)]
    );
    res.json(queryToArray(results));
  } catch (err) {
    console.error('获取内容块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/blocks', requireAuth, async (req, res) => {
  try {
    const { module_id, block_key, title, content, image_url, link_url, extra_data, sort_order, visible } = req.body;
    const db = await getDB();
    db.run(
      `INSERT INTO content_blocks (module_id, block_key, title, content, image_url, link_url, extra_data, sort_order, visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [module_id, block_key, title || '', content || '', image_url || '', link_url || '', typeof extra_data === 'string' ? extra_data : JSON.stringify(extra_data || {}), sort_order || 0, visible !== undefined ? (visible ? 1 : 0) : 1]
    );
    saveDB();
    const lastId = db.exec('SELECT last_insert_rowid()');
    res.json({ success: true, id: lastId[0].values[0][0] });
  } catch (err) {
    console.error('创建内容块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/blocks/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image_url, link_url, extra_data, sort_order, visible } = req.body;
    const db = await getDB();

    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (content !== undefined) { updates.push('content = ?'); values.push(content); }
    if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
    if (link_url !== undefined) { updates.push('link_url = ?'); values.push(link_url); }
    if (extra_data !== undefined) { updates.push('extra_data = ?'); values.push(typeof extra_data === 'string' ? extra_data : JSON.stringify(extra_data)); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (visible !== undefined) { updates.push('visible = ?'); values.push(visible ? 1 : 0); }
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length > 1) {
      values.push(Number(id));
      db.run(`UPDATE content_blocks SET ${updates.join(', ')} WHERE id = ?`, values);
      saveDB();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('更新内容块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/blocks/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    db.run('DELETE FROM content_blocks WHERE id = ?', [Number(req.params.id)]);
    saveDB();
    res.json({ success: true });
  } catch (err) {
    console.error('删除内容块错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============ 菜单管理 ============
router.get('/menus', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    const results = db.exec('SELECT * FROM menu_items ORDER BY sort_order');
    res.json(queryToArray(results));
  } catch (err) {
    console.error('获取菜单错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.post('/menus', requireAuth, async (req, res) => {
  try {
    const { label, url, icon, parent_id, module_id, sort_order, visible, target } = req.body;
    const db = await getDB();
    db.run(
      'INSERT INTO menu_items (label, url, icon, parent_id, module_id, sort_order, visible, target) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [label, url, icon || '', parent_id || null, module_id || null, sort_order || 0, visible !== undefined ? (visible ? 1 : 0) : 1, target || '_self']
    );
    saveDB();
    const lastId = db.exec('SELECT last_insert_rowid()');
    res.json({ success: true, id: lastId[0].values[0][0] });
  } catch (err) {
    console.error('创建菜单错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.put('/menus/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { label, url, icon, parent_id, module_id, sort_order, visible, target } = req.body;
    const db = await getDB();

    const updates = [];
    const values = [];
    if (label !== undefined) { updates.push('label = ?'); values.push(label); }
    if (url !== undefined) { updates.push('url = ?'); values.push(url); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (parent_id !== undefined) { updates.push('parent_id = ?'); values.push(parent_id); }
    if (module_id !== undefined) { updates.push('module_id = ?'); values.push(module_id || null); }
    if (sort_order !== undefined) { updates.push('sort_order = ?'); values.push(sort_order); }
    if (visible !== undefined) { updates.push('visible = ?'); values.push(visible ? 1 : 0); }
    if (target !== undefined) { updates.push('target = ?'); values.push(target); }

    if (updates.length > 0) {
      values.push(Number(id));
      db.run(`UPDATE menu_items SET ${updates.join(', ')} WHERE id = ?`, values);
      saveDB();
    }
    res.json({ success: true });
  } catch (err) {
    console.error('更新菜单错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.delete('/menus/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    db.run('DELETE FROM menu_items WHERE id = ?', [Number(req.params.id)]);
    saveDB();
    res.json({ success: true });
  } catch (err) {
    console.error('删除菜单错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ============ 媒体管理 ============
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }

    const db = await getDB();
    const url = '/uploads/' + req.file.filename;
    db.run(
      'INSERT INTO media (filename, original_name, mime_type, size, url, alt_text) VALUES (?, ?, ?, ?, ?, ?)',
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, url, '']
    );
    saveDB();
    const lastId = db.exec('SELECT last_insert_rowid()');
    res.json({ success: true, url, id: lastId[0].values[0][0] });
  } catch (err) {
    console.error('上传文件错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/media', requireAuth, async (req, res) => {
  try {
    const db = await getDB();
    const results = db.exec('SELECT * FROM media ORDER BY created_at DESC LIMIT 100');
    res.json(queryToArray(results));
  } catch (err) {
    console.error('获取媒体错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;