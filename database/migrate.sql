-- 数据库迁移脚本
-- 用于后续数据库结构变更

-- 连接到数据库
\c approval_system;

-- 迁移版本 1: 添加通知功能相关表 (2024-12-29)
-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) REFERENCES users(id) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'approval', 'reminder', 'system'
    related_request_id VARCHAR(36) REFERENCES approval_requests(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 迁移版本 2: 添加评论功能 (2024-12-29)
-- 创建评论表
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(36) REFERENCES approval_requests(id) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    parent_id VARCHAR(36) REFERENCES comments(id), -- 支持回复
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(request_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);

-- 为评论表添加触发器
CREATE TRIGGER IF NOT EXISTS update_comments_updated_at 
BEFORE UPDATE ON comments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 迁移版本 3: 添加审计日志表 (2024-12-29)
-- 创建审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(36) REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(36),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- 迁移版本 4: 添加模板版本控制 (2024-12-29)
-- 为模板表添加版本字段
ALTER TABLE approval_flow_templates 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_template_id VARCHAR(36) REFERENCES approval_flow_templates(id);

-- 创建模板历史表
CREATE TABLE IF NOT EXISTS template_versions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(36) REFERENCES approval_flow_templates(id) NOT NULL,
    version INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    nodes JSONB NOT NULL,
    edges JSONB NOT NULL,
    created_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON template_versions(template_id);
CREATE INDEX IF NOT EXISTS idx_template_versions_version ON template_versions(version);

-- 迁移版本 5: 优化性能 - 添加复合索引 (2024-12-29)
-- 为常用查询添加复合索引
CREATE INDEX IF NOT EXISTS idx_approval_requests_status_priority 
ON approval_requests(status, priority);

CREATE INDEX IF NOT EXISTS idx_approval_requests_requester_status 
ON approval_requests(requester_id, status);

CREATE INDEX IF NOT EXISTS idx_flow_steps_instance_decision 
ON approval_flow_steps(instance_id, decision);

-- 迁移版本 6: 添加数据清理策略 (2024-12-29)
-- 创建配置表
CREATE TABLE IF NOT EXISTS system_config (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认配置
INSERT INTO system_config (config_key, config_value, description) VALUES
('data_retention_days', '365', '数据保留天数'),
('auto_archive_completed', 'true', '自动归档已完成请求'),
('max_attachments_per_request', '10', '每个请求最大附件数'),
('notification_retention_days', '30', '通知保留天数')
ON CONFLICT (config_key) DO NOTHING;

-- 为配置表添加触发器
CREATE TRIGGER IF NOT EXISTS update_system_config_updated_at 
BEFORE UPDATE ON system_config 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建归档表
CREATE TABLE IF NOT EXISTS archived_approval_requests (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    requester_id VARCHAR(36),
    template_id VARCHAR(36),
    flow_instance_id VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    priority VARCHAR(10) NOT NULL,
    category VARCHAR(100) NOT NULL,
    current_step INTEGER,
    total_steps INTEGER,
    due_date TIMESTAMP,
    attachments TEXT[],
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建归档函数
CREATE OR REPLACE FUNCTION archive_old_requests()
RETURNS INTEGER AS $$
DECLARE
    retention_days INTEGER;
    archived_count INTEGER := 0;
BEGIN
    -- 获取保留天数配置
    SELECT config_value::INTEGER INTO retention_days 
    FROM system_config 
    WHERE config_key = 'data_retention_days';
    
    IF retention_days IS NULL THEN
        retention_days := 365; -- 默认365天
    END IF;
    
    -- 归档旧数据
    WITH archived AS (
        DELETE FROM approval_requests 
        WHERE status IN ('approved', 'rejected') 
        AND updated_at < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL
        RETURNING *
    )
    INSERT INTO archived_approval_requests 
    SELECT * FROM archived;
    
    GET DIAGNOSTICS archived_count = ROW_COUNT;
    
    RETURN archived_count;
END;
$$ LANGUAGE plpgsql;

-- 输出迁移完成信息
SELECT '数据库迁移完成！' as message;