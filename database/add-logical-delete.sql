-- 为所有表添加逻辑删除字段
-- 执行此脚本前请备份数据库

-- 连接到数据库
\c approval_system;

-- 为用户表添加逻辑删除字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为审批流程模板表添加逻辑删除字段
ALTER TABLE approval_flow_templates ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_flow_templates ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为审批请求表添加逻辑删除字段
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为流程实例表添加逻辑删除字段
ALTER TABLE approval_flow_instances ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_flow_instances ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为流程步骤表添加逻辑删除字段
ALTER TABLE approval_flow_steps ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_flow_steps ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为审批动作表添加逻辑删除字段
ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_actions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为审批请求详情表添加逻辑删除字段
ALTER TABLE approval_request_details ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_request_details ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 为审批统计表添加逻辑删除字段
ALTER TABLE approval_stats ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE approval_stats ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 更新现有记录的索引，确保查询性能
CREATE INDEX IF NOT EXISTS idx_users_is_deleted ON users(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_flow_templates_is_deleted ON approval_flow_templates(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_requests_is_deleted ON approval_requests(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_flow_instances_is_deleted ON approval_flow_instances(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_flow_steps_is_deleted ON approval_flow_steps(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_actions_is_deleted ON approval_actions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_request_details_is_deleted ON approval_request_details(is_deleted);
CREATE INDEX IF NOT EXISTS idx_approval_stats_is_deleted ON approval_stats(is_deleted);

-- 创建删除时间的索引
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_flow_templates_deleted_at ON approval_flow_templates(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_requests_deleted_at ON approval_requests(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_flow_instances_deleted_at ON approval_flow_instances(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_flow_steps_deleted_at ON approval_flow_steps(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_actions_deleted_at ON approval_actions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_request_details_deleted_at ON approval_request_details(deleted_at);
CREATE INDEX IF NOT EXISTS idx_approval_stats_deleted_at ON approval_stats(deleted_at);

-- 更新视图或函数以支持逻辑删除（如果需要）
-- 例如：创建只显示未删除记录的视图

COMMENT ON COLUMN users.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_flow_templates.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_requests.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_flow_instances.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_flow_steps.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_actions.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_request_details.is_deleted IS '逻辑删除标记';
COMMENT ON COLUMN approval_stats.is_deleted IS '逻辑删除标记';

-- 完成迁移
SELECT '逻辑删除字段添加完成' as migration_status;