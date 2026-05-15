const express = require('express');
const path = require('path');
const fs = require('fs');
const { getDB } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/api', require('./routes/api'));
app.use('/admin/api', require('./routes/admin'));

// 管理后台页面
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 初始化数据库并启动服务器
async function start() {
  try {
    await getDB();
    console.log('✅ 数据库初始化完成');

    app.listen(PORT, () => {
      console.log(`🚀 企业官网服务已启动: http://localhost:${PORT}`);
      console.log(`📊 管理后台: http://localhost:${PORT}/admin`);
      console.log(`   默认账号: admin / admin123`);
    });
  } catch (err) {
    console.error('❌ 启动失败:', err);
    process.exit(1);
  }
}

start();