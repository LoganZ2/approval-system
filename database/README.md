# 审批流程管理系统 - 数据库部署指南

## 概述

本文档描述了审批流程管理系统的数据库部署和配置过程。

## 数据库要求

- **数据库**: PostgreSQL 12+
- **扩展**: uuid-ossp (用于生成UUID)
- **字符编码**: UTF-8
- **时区**: UTC (推荐)

## 部署步骤

### 1. 安装PostgreSQL

确保已安装PostgreSQL 12或更高版本。

### 2. 创建数据库

```bash
# 连接到PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE approval_system;
```

### 3. 运行初始化脚本

```bash
# 运行初始化脚本
psql -U postgres -d approval_system -f database/init.sql
```

### 4. 配置环境变量

复制 `.env.example` 为 `.env` 并配置数据库连接信息：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=approval_system
DB_USER=postgres
DB_PASSWORD=your_password
```

### 5. 运行迁移脚本（可选）

如果需要额外的功能，运行迁移脚本：

```bash
psql -U postgres -d approval_system -f database/migrate.sql
```

## 数据库结构

### 主要表

1. **users** - 用户信息
2. **approval_flow_templates** - 审批流程模板
3. **approval_requests** - 审批请求
4. **approval_flow_instances** - 流程实例
5. **approval_flow_steps** - 审批步骤历史
6. **approval_actions** - 审批动作记录

### 视图

1. **approval_request_details** - 审批请求详情视图
2. **approval_stats** - 审批统计视图

### 索引

为常用查询字段创建了索引，确保查询性能。

## 数据模型关系

```
users (1) ←→ (N) approval_requests
approval_flow_templates (1) ←→ (N) approval_requests
approval_requests (1) ←→ (1) approval_flow_instances
approval_flow_instances (1) ←→ (N) approval_flow_steps
approval_requests (1) ←→ (N) approval_actions
```

## 示例数据

初始化脚本包含以下示例数据：

### 用户
- 张三 (员工，技术部)
- 李四 (经理，技术部)
- 王五 (HR经理，人力资源部)
- 赵六 (财务总监，财务部)
- 钱七 (IT主管，IT部)

### 流程模板
1. 标准请假审批流程
2. 费用报销审批流程
3. 采购申请审批流程

### 审批请求
1. 年假申请 (已批准)
2. 差旅费用报销 (待审批)
3. 办公设备采购 (审批中)

## 性能优化

### 索引策略
- 为所有外键字段创建索引
- 为常用查询字段创建索引
- 为状态字段创建索引
- 为时间字段创建索引

### 查询优化
- 使用视图简化复杂查询
- 合理使用JSONB字段
- 定期清理归档数据

## 备份策略

### 自动备份
建议设置定期备份：

```bash
# 每日备份
pg_dump -U postgres -d approval_system -f backup_$(date +%Y%m%d).sql

# 压缩备份
gzip backup_$(date +%Y%m%d).sql
```

### 恢复数据
```bash
# 恢复数据库
psql -U postgres -d approval_system -f backup_file.sql
```

## 监控和维护

### 监控指标
- 数据库连接数
- 查询性能
- 磁盘使用情况
- 索引使用情况

### 维护任务
- 定期清理归档数据
- 重新构建索引
- 更新统计信息
- 检查数据库完整性

## 故障排除

### 常见问题

1. **连接失败**
   - 检查数据库服务是否运行
   - 验证连接参数
   - 检查防火墙设置

2. **权限问题**
   - 验证用户权限
   - 检查数据库访问权限

3. **性能问题**
   - 检查索引使用情况
   - 分析慢查询
   - 优化数据库配置

### 日志查看
```bash
# 查看PostgreSQL日志
tail -f /var/log/postgresql/postgresql-*.log
```

## 安全建议

1. 使用强密码
2. 限制数据库访问IP
3. 定期更新PostgreSQL
4. 启用SSL连接
5. 定期备份数据

## 扩展功能

### 未来扩展
- 支持多租户
- 集成消息队列
- 添加审计日志
- 支持文件存储
- 添加API限流

## 技术支持

如有问题，请联系系统管理员或查看PostgreSQL官方文档。