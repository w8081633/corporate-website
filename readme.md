# 企业官网可配置模块系统 - 提示词文档

## 一、项目概述提示词

```
你是一个现代化企业官网CMS系统，基于 Node.js + Express + SQLite(sql.js) 构建。
特点：
- 模块化架构：每个页面区域（Hero、关于我们、服务、产品等）都是独立可配置模块
- 管理后台：可视化管理站点配置、模块开关、内容编辑
- 动态加载：前台通过 ES Module 动态加载已启用模块
- 零构建：无需 webpack/vite，纯原生 HTML/CSS/JS

技术栈：
- 后端：Node.js + Express + better-sqlite3
- 前端：原生 HTML + CSS + ES Module
- 数据库：SQLite（better-sqlite3）
- 管理后台：内置SPA管理面板
```

---

## 二、新增模块提示词

### 添加新前端模块（如"新闻动态"模块）

```
请为我的企业官网添加一个"新闻动态"模块，要求：

1. 创建前端模块文件 public/js/modules/news.js
2. 模块导出 render 函数，签名：render(container, config, data)
   - container: DOM容器元素
   - config: 模块配置对象（从数据库读取）
   - data: 模块内容数据（包含 module 信息和 blocks 数组）
3. 使用 CSS-in-JS 方式，样式前缀为 .mod-news 避免冲突
4. 响应式设计，移动端适配
5. block 数据结构：
   - title: 新闻标题
   - content: 新闻摘要
   - image_url: 新闻配图
   - extra_data: { date: "2024-01-01", category: "公司新闻", url: "/news/1" }
6. 在 db/seed.js 中添加该模块的注册和示例数据
7. 模块支持 config 配置：columns（列数）、show_date（是否显示日期）、max_items（最大显示数）
```

### 添加新后端API模块

```
请为我的企业官网添加一个独立的业务API模块（如"产品管理API"），要求：

1. 在 routes/ 目录下创建独立路由文件
2. 在 server.js 中挂载路由
3. 使用 getDB() 和 saveDB() 操作 SQLite 数据库
4. 遵循 RESTful 设计规范
5. 带认证的管理接口需要 requireAuth 中间件
6. 错误处理返回 JSON 格式：{ error: "错误信息" }
```

---

## 三、样式定制提示词

### 修改主题色

```
请修改企业官网的主题配色方案：
- 主色改为：#e74c3c（红色系）
- 辅助色改为：#2c3e50（深蓝灰色）
- 背景色改为：#fafafa
- 同时更新前台 public/css/style.css 和管理后台 public/css/admin.css 中的颜色变量
```

### 自定义某个模块样式

```
请修改 hero 模块（public/js/modules/hero.js）的样式：
- 背景改为渐变色 + 装饰粒子效果
- 标题字体放大到 3.5rem
- 添加入场动画（淡入 + 上移）
- 按钮改为圆角胶囊样式 + hover 发光效果
- 在移动端隐藏副标题
```

---

## 四、数据库操作提示词

### 修改数据模型

```
请为企业官网数据库添加新表或字段：

当前表结构：
- site_config: key, value, label, type
- modules: id, name, label, enabled, sort_order, config, created_at, updated_at
- content_blocks: id, module_id, block_key, title, content, image_url, link_url, extra_data, sort_order, visible, created_at, updated_at
- menu_items: id, label, url, icon, parent_id, sort_order, visible, target
- media: id, filename, original_name, mime_type, size, url, alt_text, created_at
- admin_users: id, username, password_hash, display_name, created_at

请在 db/init.js 中的 initDatabase() 函数中添加 CREATE TABLE IF NOT EXISTS 语句。
```

### 添加种子数据

```
请在 db/seed.js 中添加初始数据：
- 使用 INSERT OR IGNORE 语法避免重复插入
- content_blocks 的 extra_data 使用 JSON.stringify() 序列化
- 模块的 config 字段也使用 JSON.stringify()
```

---

## 五、部署提示词

### Docker 部署

```
请为这个企业官网项目创建 Docker 部署配置：
1. 创建 Dockerfile（基于 node:18-alpine）
2. 创建 docker-compose.yml
3. 挂载 data/ 目录用于 SQLite 数据持久化
4. 挂载 public/uploads/ 目录用于上传文件持久化
5. 暴露 3000 端口
6. 环境变量支持 PORT 和 NODE_ENV
```

### PM2 部署

```
请创建 PM2 部署配置：
1. 创建 ecosystem.config.js
2. 配置实例数、内存限制
3. 配置日志路径
4. 配置自动重启策略
```

---

## 六、功能扩展提示词

### 添加多语言支持

```
请为企业官网添加多语言(i18n)支持：
1. 在 site_config 中添加 language 配置
2. 创建 lang/ 目录存放语言文件（zh-CN.json, en.json）
3. 前台模块渲染时根据语言加载对应文本
4. 导航栏添加语言切换按钮
5. 支持 content_blocks 中存储多语言内容（content 字段改为 JSON 存储不同语言版本）
```

### 添加SEO优化

```
请为官网添加SEO优化：
1. 前台 index.html 根据 site_config 动态设置 title、meta description、meta keywords
2. 添加 Open Graph 标签
3. 添加结构化数据（JSON-LD）
4. 生成 sitemap.xml
5. 添加 robots.txt
6. 前台页面支持 History API 路由（单页应用模式）
```

### 添加文件上传功能

```
请增强管理后台的文件上传功能：
1. 在内容编辑区域添加图片上传按钮
2. 支持拖拽上传
3. 上传后自动填入图片URL
4. 添加媒体库功能（浏览已上传文件）
5. 图片自动压缩和生成缩略图
6. 支持的格式：jpg, png, gif, webp, svg
```

---

## 七、管理后台提示词

### 扩展管理后台功能

```
请为管理后台添加以下功能：
1. 操作日志记录（谁在什么时间做了什么操作）
2. 数据备份功能（导出 SQLite 文件）
3. 数据恢复功能（导入 SQLite 文件）
4. 批量操作（批量启用/禁用模块）
5. 预览功能（编辑内容后实时预览前台效果）
```

---

## 八、前端组件开发模板

### 新模块模板

```javascript
// public/js/modules/[模块名].js
// 模块名: 例如 news, portfolio, faq 等

const styles = `
  .mod-[模块名] {
    padding: 80px 0;
    background: #fff;
  }
  .mod-[模块名] .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }
  .mod-[模块名] .section-header {
    text-align: center;
    margin-bottom: 48px;
  }
  .mod-[模块名] .section-header h2 {
    font-size: 2.2rem;
    color: #1a1a2e;
    margin-bottom: 12px;
  }
  .mod-[模块名] .section-header p {
    color: #64748b;
    font-size: 1.1rem;
  }
  /* 添加更多样式... */
  
  @media (max-width: 768px) {
    .mod-[模块名] {
      padding: 50px 0;
    }
    .mod-[模块名] .section-header h2 {
      font-size: 1.6rem;
    }
  }
`;

/**
 * 渲染模块
 * @param {HTMLElement} container - 挂载容器
 * @param {Object} config - 模块配置（来自 modules.config JSON）
 * @param {Object} data - 模块数据（包含 module 和 blocks）
 */
export function render(container, config, data) {
  const { blocks = [] } = data;
  
  // 注入样式
  if (!document.getElementById('style-[模块名]')) {
    const style = document.createElement('style');
    style.id = 'style-[模块名]';
    style.textContent = styles;
    document.head.appendChild(style);
  }
  
  // 从 config 读取配置
  const columns = config.columns || 3;
  const maxItems = config.max_items || 6;
  
  // 渲染内容
  const items = blocks.slice(0, maxItems);
  
  container.innerHTML = `
    <section class="mod-[模块名]" id="mod-[模块名]">
      <div class="container">
        <div class="section-header">
          <h2>${config.title || '模块标题'}</h2>
          <p>${config.subtitle || '模块副标题'}</p>
        </div>
        <div class="items-grid" style="display:grid;grid-template-columns:repeat(${columns},1fr);gap:24px">
          ${items.map(item => `
            <div class="item-card">
              ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}" />` : ''}
              <h3>${item.title}</h3>
              <p>${item.content}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}
```

---

## 九、API 接口文档

### 前台 API（/api）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/config | 获取站点配置（公开） |
| GET | /api/menus | 获取导航菜单（公开） |
| GET | /api/modules | 获取已启用模块列表（公开） |
| GET | /api/modules/:name | 获取指定模块及内容（公开） |
| GET | /api/all | 一次性获取所有数据（公开） |
| POST | /api/contact | 提交联系表单（公开） |

### 管理后台 API（/admin/api）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /admin/api/login | 管理员登录 |
| GET | /admin/api/config | 获取所有站点配置 |
| PUT | /admin/api/config | 批量更新站点配置 |
| GET | /admin/api/modules | 获取所有模块（含禁用） |
| PUT | /admin/api/modules/:id | 更新模块信息 |
| PUT | /admin/api/modules-sort | 更新模块排序 |
| GET | /admin/api/blocks/:moduleId | 获取模块内容块 |
| POST | /admin/api/blocks | 创建内容块 |
| PUT | /admin/api/blocks/:id | 更新内容块 |
| DELETE | /admin/api/blocks/:id | 删除内容块 |
| GET | /admin/api/menus | 获取菜单列表 |
| POST | /admin/api/menus | 创建菜单项 |
| PUT | /admin/api/menus/:id | 更新菜单项 |
| DELETE | /admin/api/menus/:id | 删除菜单项 |
| POST | /admin/api/upload | 上传文件 |
| GET | /admin/api/media | 获取媒体列表 |

---

## 十、快速启动提示词

```
我已经克隆了这个企业官网项目，请帮我：
1. 安装依赖：npm install
2. 启动开发服务器：npm run dev
3. 访问前台：http://localhost:3000
4. 访问管理后台：http://localhost:3000/admin
5. 默认管理员账号：admin / admin123
6. 在管理后台中配置站点信息、管理模块、编辑内容