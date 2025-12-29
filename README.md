# 企业审批管理系统

基于 Next.js、TypeScript 和 Ant Design 构建的专业审批流程管理系统。该系统为企业环境提供了完整的审批请求、流程模板和审批流程管理解决方案。

## 核心功能

- **仪表盘**: 审批统计概览和最近活动
- **审批请求**: 创建、查看和管理审批请求
- **流程模板**: 可视化流程编辑器创建审批流程
- **实时状态跟踪**: 实时监控审批进度
- **多级审批**: 支持复杂的多审批人工作流程

## 技术栈

- **前端**: Next.js 15, React 18, TypeScript
- **UI框架**: Ant Design 自定义样式
- **流程可视化**: React Flow 可视化流程编辑
- **数据库**: PostgreSQL 连接池
- **样式**: Tailwind CSS + PostCSS

## 项目结构

```
my-app/
├── app/                          # Next.js 应用路由
│   ├── api/                      # API 路由
│   │   ├── approval-requests/    # 审批请求端点
│   │   ├── approvers/            # 审批人管理
│   │   ├── flow-templates/       # 流程模板端点
│   │   └── users/                # 用户管理
│   ├── layout.tsx                # 根布局
│   ├── page.tsx                  # 主应用页面
│   └── globals.css               # 全局样式
├── components/                   # React 组件
│   ├── ApprovalFlowEditor.tsx    # 可视化流程编辑器
│   ├── ApprovalFlowViewer.tsx    # 流程可视化
│   ├── TemplateManager.tsx       # 模板管理界面
│   ├── WorkflowVisualization.tsx # 流程展示
│   ├── Notification.tsx          # 通知组件
│   └── flow-nodes/               # 自定义 React Flow 节点
│       ├── StartNode.tsx
│       ├── ApproverNode.tsx
│       └── EndNode.tsx
├── lib/                          # 工具库
│   └── database.ts               # 数据库服务
├── types/                        # TypeScript 类型定义
│   ├── approval.ts               # 审批请求类型
│   └── approval-flow.ts          # 流程模板类型
├── public/                       # 静态资源
└── node_modules/                 # 依赖包
```

## API 端点

### 审批请求
- `GET /api/approval-requests` - 获取所有审批请求列表
- `POST /api/approval-requests` - 创建新的审批请求
- `GET /api/approval-requests/[id]` - 获取特定请求详情
- `PUT /api/approval-requests/[id]` - 更新审批请求

### 流程模板
- `GET /api/flow-templates` - 获取模板列表（分页）
- `POST /api/flow-templates` - 创建新模板
- `GET /api/flow-templates/[id]` - 获取特定模板
- `PUT /api/flow-templates/[id]` - 更新模板

### 用户与审批人
- `GET /api/users` - 获取所有用户列表
- `GET /api/approvers` - 获取可用审批人（经理及以上）

## 数据模型

### 审批请求
```typescript
interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  templateId: string;
  templateName: string;
  flowInstanceId: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  currentStep?: number;
  totalSteps?: number;
  approvers?: string[];
  currentApprovers?: string[];
  attachments?: string[];
}
```

### 流程模板
```typescript
interface ApprovalFlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node<ApprovalNodeData>[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}
```

## 快速开始

### 环境要求
- Node.js 18+ 
- PostgreSQL 数据库
- npm 或 yarn 包管理器

### 安装步骤

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
创建 `.env.local` 文件：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=approval_system
DB_USER=postgres
DB_PASSWORD=password
```

3. **数据库设置**
确保 PostgreSQL 数据库包含以下表：
- `users`
- `approval_requests`
- `flow_templates`
- `flow_instances`
- `approval_actions`

4. **运行开发服务器**
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 生产环境构建
```bash
npm run build
npm start
```

## 核心组件

### ApprovalFlowEditor
可视化拖拽编辑器，用于创建审批流程：
- 开始/结束节点
- 带用户选择的审批人节点
- 连接管理
- 模板保存和编辑

### ApprovalFlowViewer
审批请求进度的实时可视化展示：
- 当前流程步骤
- 各步骤审批状态
- 可视化流程表示

### TemplateManager
流程模板管理：
- 模板列表分页
- 创建/编辑模板
- 删除模板
- 激活/停用模板

## 用户界面

应用提供简洁专业的界面：
- **仪表盘**: 统计卡片和最近请求表格
- **我的请求**: 个人审批请求历史
- **模板**: 流程模板管理
- **新建请求**: 创建审批请求表单
- **可视化流程编辑器**: 拖拽式流程构建器

## 状态跟踪

审批请求状态流转：
1. **待处理**: 请求已创建，等待首次审批
2. **进行中**: 正在审批中
3. **已批准**: 所有审批已完成
4. **已拒绝**: 任何步骤被拒绝

## 未来功能

- [ ] 用户认证和基于角色的访问控制
- [ ] 审批操作邮件通知
- [ ] 文件附件支持
- [ ] 高级流程条件和分支
- [ ] 审批委托
- [ ] 移动端响应式设计
- [ ] 导出和报表功能
- [ ] 外部系统集成

## 许可证

本项目为企业使用的专有软件。