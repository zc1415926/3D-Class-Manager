# Inertia 2 迁移评估报告

## 项目概述

**当前架构：**
- 前端：React 18 + React Router + Axios + JWT 认证
- 后端：Laravel 12 + Sanctum + PostgreSQL
- 部署：前后端分离，前端 3000 端口，后端 8000 端口

**目标架构：**
- 前端：React 18 + Inertia 2 + Laravel Session 认证
- 后端：Laravel 12 + Inertia 2 + PostgreSQL
- 部署：单体应用，统一端口

---

## 一、架构变化分析

### 1.1 当前架构特点

**优点：**
- 前后端完全分离，独立开发
- JWT 无状态认证，易于扩展
- API 可供其他客户端使用（移动端、第三方）

**缺点：**
- 需要管理两个服务器进程
- API 代理配置复杂
- 首屏加载需要多次 API 调用
- 部署和运维成本高

### 1.2 Inertia 2 架构特点

**优点：**
- 单一应用，简化部署
- 首屏数据通过 props 传递，减少 HTTP 请求
- 无需 API 代理配置
- 更好的 SEO 支持（SSR）
- Session 认证更简单

**缺点：**
- 失去前后端完全分离的优势
- API 可复用性降低
- 需要修改大量现有代码

---

## 二、迁移工作评估

### 2.1 后端改造工作

#### 2.1.1 安装 Inertia 2 依赖

```bash
composer require inertiajs/inertia-laravel
composer require tightenco/ziggy
npm install @inertiajs/react
npm install @inertiajs/progress
npm install axios
```

#### 2.1.2 配置 Laravel

**需要创建/修改的文件：**

1. **`resources/js/app.js`** - 前端入口文件
2. **`resources/js/Pages/`** - 页面组件目录
3. **`app/Http/Middleware/HandleInertiaRequests.php`** - Inertia 中间件
4. **`config/inertia.php`** - Inertia 配置文件
5. **`routes/web.php`** - Web 路由（替代 API 路由）

**工作内容：**
- [ ] 安装并配置 Inertia 服务提供者
- [ ] 创建 HandleInertiaRequests 中间件
- [ ] 配置共享数据（用户信息、闪存消息等）
- [ ] 设置根模板（`resources/views/app.blade.php`）
- [ ] 配置 Ziggy 用于前端路由

#### 2.1.3 路由重构

**当前 API 路由需要改为 Web 路由：**

| 当前路由 | 目标路由 | 改造内容 |
|---------|---------|---------|
| `GET /api/v1/students` | `GET /students` | 返回 Inertia 响应 |
| `GET /api/v1/assignments` | `GET /assignments` | 返回 Inertia 响应 |
| `POST /api/v1/auth/login` | `POST /login` | 使用 Laravel Auth |
| 其他 API 路由 | 对应 Web 路由 | 改造为 Inertia 响应 |

**工作量：** 约 20-30 个路由需要重构

#### 2.1.4 认证系统改造

**当前：** JWT Token 认证
```javascript
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

**目标：** Laravel Session 认证
```php
Route::middleware(['auth'])->group(function () {
    // 受保护的路由
});
```

**工作内容：**
- [ ] 移除 Sanctum API 认证
- [ ] 使用 Laravel Session 认证
- [ ] 配置 CORS（如果需要）
- [ ] 修改登录/登出逻辑

#### 2.1.5 控制器改造

**当前控制器返回 JSON：**
```php
return response()->json([
    'success' => true,
    'data' => $students
]);
```

**目标控制器返回 Inertia 响应：**
```php
return Inertia::render('Students/Index', [
    'students' => Student::all()
]);
```

**工作量：** 约 8 个控制器需要重构

---

### 2.2 前端改造工作

#### 2.2.1 项目结构调整

**当前结构：**
```
client/
├── src/
│   ├── pages/          # 20+ 页面组件
│   ├── components/     # 5+ 通用组件
│   ├── contexts/       # AuthContext
│   └── utils/          # 工具函数
└── package.json
```

**目标结构：**
```
backend_laravel/
├── resources/
│   └── js/
│       ├── Pages/          # Inertia 页面组件
│       │   ├── Home/
│       │   ├── Students/
│       │   ├── Assignments/
│       │   └── ...
│       ├── Components/     # 通用组件
│       ├── Layouts/        # 布局组件
│       └── app.js          # 入口文件
└── package.json
```

#### 2.2.2 路由系统改造

**当前：** React Router
```javascript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/assignments" element={<AssignmentManagementPage />} />
</Routes>
```

**目标：** Ziggy + Inertia
```javascript
import { router } from '@inertiajs/react';

// 页面跳转
router.get(route('students.index'));
router.post(route('assignments.store'), data);
```

**工作量：** 所有页面导航需要改造（约 50+ 处）

#### 2.2.3 认证系统改造

**当前：** JWT + AuthContext
```javascript
const { login, logout, isAuthenticated } = useAuth();
```

**目标：** Page Props + Ziggy
```javascript
export default function Dashboard({ auth }) {
  const { user } = auth;
  // ...
}
```

**工作内容：**
- [ ] 移除 AuthContext
- [ ] 使用 Inertia 共享 props 获取用户信息
- [ ] 修改登录页面使用表单提交
- [ ] 修改登出逻辑使用 POST 请求

#### 2.2.4 数据获取方式改造

**当前：** Axios API 调用
```javascript
const response = await axios.get('/api/v1/students');
setStudents(response.data.data);
```

**目标：** Props 从后端传递
```javascript
export default function StudentsIndex({ students }) {
  // students 直接从后端传递
}
```

**例外情况：**
- 动态加载数据仍使用 `useInertia` 或 `router.reload()`
- 表单提交使用 `useForm`

#### 2.2.5 表单处理改造

**当前：** 手动处理
```javascript
const handleSubmit = async () => {
  await axios.post('/api/v1/students', formData);
  router.push('/students');
};
```

**目标：** Inertia useForm
```javascript
const { data, setData, post, processing, errors } = useForm({
  name: '',
  year: 2026,
  grade: '一',
  class_number: 1
});

const handleSubmit = (e) => {
  e.preventDefault();
  post(route('students.store'));
};
```

**工作量：** 约 30+ 表单需要改造

#### 2.2.6 文件上传改造

**当前：** Axios + FormData
```javascript
const formData = new FormData();
formData.append('file', file);
await axios.post('/api/v1/upload', formData);
```

**目标：** Inertia 表单上传
```javascript
const { post } = useForm({ file: null });
post(route('upload'), {
  forceFormData: true
});
```

#### 2.2.7 状态管理改造

**当前：** React Context + localStorage
```javascript
const [students, setStudents] = useState([]);
```

**目标：** Props + usePage
```javascript
const { students } = usePage().props;
```

---

### 2.3 组件迁移工作

#### 2.3.1 页面组件（20+ 个）

需要迁移的页面：
1. HomePage
2. LoginPage
3. StudentPage
4. SubmissionPage
5. TeacherPage
6. TeacherDashboard
7. StudentManagementPage
8. StudentViewPage
9. AssignmentManagementPage
10. AssignmentNewPage
11. AssignmentEditPage
12. AssignmentViewPage
13. AssignmentSubmissionsPage
14. UploadTypesPage
15. GradingPage
16. ViewerPage
17. AccessDeniedPage

**每个页面的改造内容：**
- [ ] 移除 useEffect 数据获取
- [ ] 使用 props 接收数据
- [ ] 改造导航使用 Ziggy
- [ ] 改造表单使用 useForm
- [ ] 移除 axios 调用

#### 2.3.2 通用组件（5+ 个）

可以保持不变的组件：
- TablerLayout - 需要适配 Inertia 布局
- STLThumbnailGenerator - 纯渲染组件
- AssignmentDeleteModal - 需要改造
- UploadRequirementModal - 需要改造
- GradeSubmissionModal - 需要改造

---

### 2.4 第三方库适配

#### 2.4.1 需要保留的库
- `@babylonjs/*` - 3D 渲染
- `@ckeditor/*` - 富文本编辑器
- `@tabler/*` - UI 框架
- `bootstrap` - 样式框架

#### 2.4.2 需要移除的库
- `react-router-dom` - 替换为 Ziggy
- `axios` - 大部分场景移除（仅用于特殊情况）

---

## 三、详细迁移步骤

### 阶段 1：准备工作（1-2 天）

#### 步骤 1.1：备份现有项目
```bash
git branch backup-before-inertia
git commit -am "备份：Inertia 迁移前"
```

#### 步骤 1.2：安装依赖
```bash
cd backend_laravel
composer require inertiajs/inertia-laravel
composer require tightenco/ziggy
php artisan inertia:middleware
npm install @inertiajs/react @inertiajs/progress
```

#### 步骤 1.3：配置基础设置
- [ ] 创建 `resources/views/app.blade.php`
- [ ] 配置 `app/Http/Middleware/HandleInertiaRequests.php`
- [ ] 配置 `resources/js/app.js`
- [ ] 更新 `vite.config.js`

---

### 阶段 2：后端迁移（3-5 天）

#### 步骤 2.1：创建 Web 路由
```php
// routes/web.php
Route::get('/', fn () => Inertia::render('Home'));
Route::middleware(['auth'])->group(function () {
    Route::get('/students', [StudentController::class, 'index']);
    Route::post('/students', [StudentController::class, 'store']);
    // ... 其他路由
});
```

#### 步骤 2.2：重构控制器
- [ ] 创建 `App\Http\Controllers\Web\` 目录
- [ ] 将 API 控制器改为返回 Inertia 响应
- [ ] 添加视图数据准备逻辑

#### 步骤 2.3：认证系统改造
- [ ] 配置 Laravel Session 认证
- [ ] 修改登录控制器
- [ ] 修改中间件

#### 步骤 2.4：共享数据配置
```php
// HandleInertiaRequests.php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        'auth' => [
            'user' => $request->user(),
        ],
        'flash' => [
            'success' => fn () => $request->session()->get('success'),
            'error' => fn () => $request->session()->get('error'),
        ],
    ]);
}
```

---

### 阶段 3：前端迁移（7-10 天）

#### 步骤 3.1：项目结构迁移
```bash
mv client/src/* backend_laravel/resources/js/
mv client/public/* backend_laravel/public/
rm -rf client
```

#### 步骤 3.2：重构入口文件
```javascript
// resources/js/app.js
import { createInertiaApp } from '@inertiajs/react'
import { createRoot } from 'react-dom/client'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import './bootstrap'

createInertiaApp({
  resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />)
  },
})
```

#### 步骤 3.3：页面组件迁移
按优先级迁移：
1. **P0 - 核心页面**（3 天）
   - LoginPage
   - HomePage
   - StudentManagementPage
   - AssignmentManagementPage

2. **P1 - 重要页面**（3 天）
   - TeacherDashboard
   - AssignmentEditPage
   - AssignmentSubmissionsPage
   - GradingPage

3. **P2 - 次要页面**（2 天）
   - StudentViewPage
   - UploadTypesPage
   - ViewerPage
   - 其他页面

#### 步骤 3.4：组件适配
- [ ] TablerLayout 改造为 Inertia 布局
- [ ] Modal 组件适配
- [ ] Form 组件适配

#### 步骤 3.5：路由和导航改造
- [ ] 全局替换 `react-router-dom` 导航
- [ ] 使用 `route()` 辅助函数
- [ ] 适配 Ziggy 路由

---

### 阶段 4：测试和优化（3-5 天）

#### 步骤 4.1：功能测试
- [ ] 登录/登出流程
- [ ] CRUD 操作
- [ ] 文件上传
- [ ] 3D 模型查看
- [ ] 权限控制

#### 步骤 4.2：性能优化
- [ ] 启用 Inertia 懒加载
- [ ] 优化组件渲染
- [ ] 配置 Vite 生产构建

#### 步骤 4.3：兼容性测试
- [ ] 浏览器兼容性
- [ ] 移动端适配
- [ ] SEO 优化（可选）

---

### 阶段 5：部署上线（1-2 天）

#### 步骤 5.1：生产配置
```bash
npm run build
php artisan optimize
php artisan config:cache
php artisan route:cache
```

#### 步骤 5.2：环境清理
- [ ] 移除旧的 API 路由
- [ ] 清理前端项目
- [ ] 更新部署脚本

#### 步骤 5.3：监控和验证
- [ ] 监控应用性能
- [ ] 检查错误日志
- [ ] 验证所有功能

---

## 四、风险评估

### 4.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| 第三方库兼容性问题 | 高 | 中 | 提前测试关键库 |
| 3D 渲染性能下降 | 中 | 低 | 保持 Babylon.js 配置 |
| 文件上传功能异常 | 高 | 中 | 充分测试文件上传 |
| 权限控制失效 | 高 | 低 | 使用 Laravel Policy |

### 4.2 业务风险

| 风险 | 影响 | 概率 | 缓解措施 |
|-----|------|------|---------|
| 数据丢失 | 高 | 低 | 完整备份 |
| 功能缺失 | 中 | 中 | 详细测试 |
| 用户体验下降 | 中 | 低 | 保持页面一致性 |

### 4.3 时间风险

| 阶段 | 预计时间 | 缓冲时间 |
|-----|---------|---------|
| 准备工作 | 1-2 天 | +1 天 |
| 后端迁移 | 3-5 天 | +2 天 |
| 前端迁移 | 7-10 天 | +3 天 |
| 测试优化 | 3-5 天 | +2 天 |
| 部署上线 | 1-2 天 | +1 天 |
| **总计** | **15-24 天** | **+9 天** |

---

## 五、成本收益分析

### 5.1 投入成本

| 项目 | 工作量 |
|-----|--------|
| 开发时间 | 15-24 天 |
| 测试时间 | 3-5 天 |
| 学习成本 | 2-3 天 |
| **总计** | **20-32 天** |

### 5.2 预期收益

| 收益项 | 说明 |
|-------|------|
| 部署简化 | 从 2 个服务器减少到 1 个 |
| 运维成本 | 减少 50% |
| 首屏性能 | 减少 30-50% 的 HTTP 请求 |
| 开发效率 | 减少前后端联调时间 |
| 代码维护 | 减少代码重复 |

---

## 六、建议和决策

### 6.1 推荐方案

**✅ 推荐迁移到 Inertia 2**

**理由：**
1. 项目适合单体应用架构
2. 团队已经熟悉 Laravel 和 React
3. 可以显著简化部署和运维
4. 提升开发和维护效率

### 6.2 迁移时机

**建议时机：**
- 项目功能相对稳定
- 没有紧急的版本发布
- 团队有足够的开发时间
- 可以预留 2-4 周的开发窗口

### 6.3 备选方案

如果团队资源有限，可以考虑以下备选方案：

**方案 A：渐进式迁移**
- 保留前后端分离架构
- 仅将新功能使用 Inertia 开发
- 旧功能保持不变

**方案 B：保持现状**
- 继续使用当前的架构
- 优化现有代码
- 改进部署脚本

---

## 七、迁移检查清单

### 7.1 迁移前检查
- [ ] 完整备份代码和数据
- [ ] 文档化所有 API 接口
- [ ] 测试所有现有功能
- [ ] 准备回滚方案

### 7.2 迁移过程检查
- [ ] 每个阶段完成后测试
- [ ] 保持代码提交记录
- [ ] 定期备份开发进度
- [ ] 记录遇到的问题和解决方案

### 7.3 迁移后检查
- [ ] 所有功能正常工作
- [ ] 性能指标达标
- [ ] 用户体验无下降
- [ ] 错误日志正常

---

## 八、总结

### 8.1 关键数据

- **预计开发时间：** 15-24 天
- **预计测试时间：** 3-5 天
- **总计时间：** 18-29 天
- **代码变更量：** 约 80-90%
- **风险等级：** 中等

### 8.2 成功关键

1. **充分准备：** 详细的计划和备份
2. **分阶段实施：** 逐步迁移降低风险
3. **充分测试：** 每个阶段都进行测试
4. **团队协作：** 前后端开发密切配合

### 8.3 长期效益

- 简化架构，降低复杂度
- 提升开发和维护效率
- 减少部署和运维成本
- 为未来扩展奠定基础

---

**报告生成时间：** 2026-02-02
**项目版本：** Laravel 12.49.0 + React 18
**评估人员：** 全栈开发工程师