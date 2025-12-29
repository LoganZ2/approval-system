-- 审批流程管理系统数据库初始化脚本
-- 数据库：PostgreSQL 12+

-- 创建数据库
CREATE DATABASE approval_system;

-- 连接到数据库
\c approval_system;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 用户表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 审批流程模板表
CREATE TABLE approval_flow_templates (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    nodes JSONB NOT NULL,
    edges JSONB NOT NULL,
    created_by VARCHAR(36) REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 审批请求表
CREATE TABLE approval_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    requester_id VARCHAR(36) REFERENCES users(id) NOT NULL,
    template_id VARCHAR(36) REFERENCES approval_flow_templates(id) NOT NULL,
    flow_instance_id VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'in-progress')) DEFAULT 'pending',
    priority VARCHAR(10) CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    category VARCHAR(100) NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 1,
    due_date TIMESTAMP,
    attachments TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 审批流程实例表
CREATE TABLE approval_flow_instances (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(36) REFERENCES approval_flow_templates(id) NOT NULL,
    request_id VARCHAR(36) REFERENCES approval_requests(id) NOT NULL,
    current_node_id VARCHAR(100),
    status VARCHAR(20) CHECK (status IN ('pending', 'in-progress', 'completed', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 5. 审批步骤历史表
CREATE TABLE approval_flow_steps (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id VARCHAR(36) REFERENCES approval_flow_instances(id) NOT NULL,
    node_id VARCHAR(100) NOT NULL,
    approver_id VARCHAR(36) REFERENCES users(id) NOT NULL,
    decision VARCHAR(20) CHECK (decision IN ('approved', 'rejected', 'pending')) DEFAULT 'pending',
    comments TEXT,
    step INTEGER NOT NULL,
    decision_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 审批动作表
CREATE TABLE approval_actions (
    id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(36) REFERENCES approval_requests(id) NOT NULL,
    approver_id VARCHAR(36) REFERENCES users(id) NOT NULL,
    action VARCHAR(20) CHECK (action IN ('approved', 'rejected')) NOT NULL,
    comments TEXT,
    step INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
-- 用户表索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department);

-- 审批请求表索引
CREATE INDEX idx_approval_requests_requester_id ON approval_requests(requester_id);
CREATE INDEX idx_approval_requests_status ON approval_requests(status);
CREATE INDEX idx_approval_requests_category ON approval_requests(category);
CREATE INDEX idx_approval_requests_created_at ON approval_requests(created_at);

-- 流程实例表索引
CREATE INDEX idx_flow_instances_request_id ON approval_flow_instances(request_id);
CREATE INDEX idx_flow_instances_status ON approval_flow_instances(status);

-- 审批步骤表索引
CREATE INDEX idx_flow_steps_instance_id ON approval_flow_steps(instance_id);
CREATE INDEX idx_flow_steps_approver_id ON approval_flow_steps(approver_id);
CREATE INDEX idx_flow_steps_decision ON approval_flow_steps(decision);

-- 审批动作表索引
CREATE INDEX idx_approval_actions_request_id ON approval_actions(request_id);
CREATE INDEX idx_approval_actions_approver_id ON approval_actions(approver_id);

-- 创建触发器函数 - 自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新updated_at的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON approval_flow_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_instances_updated_at BEFORE UPDATE ON approval_flow_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
-- 插入用户数据
INSERT INTO users (id, name, email, role, department) VALUES
('1', '张三', 'zhangsan@company.com', '员工', '技术部'),
('2', '李四', 'lisi@company.com', '经理', '技术部'),
('3', '王五', 'wangwu@company.com', 'HR经理', '人力资源部'),
('4', '赵六', 'zhaoliu@company.com', '财务总监', '财务部'),
('5', '钱七', 'qianqi@company.com', 'IT主管', 'IT部');

-- 插入流程模板数据
INSERT INTO approval_flow_templates (id, name, description, category, nodes, edges, created_by, is_active) VALUES
('1', '标准请假审批流程', '员工请假标准审批流程，需要经理和HR审批', '请假', 
 '[
   {"id": "1", "type": "start", "position": {"x": 250, "y": 25}, "data": {"label": "开始", "type": "start"}},
   {"id": "2", "type": "approver", "position": {"x": 100, "y": 125}, "data": {"label": "经理审批", "type": "approver", "approverIds": ["2"], "approverName": "李四"}},
   {"id": "3", "type": "approver", "position": {"x": 400, "y": 125}, "data": {"label": "HR审批", "type": "approver", "approverIds": ["3"], "approverName": "王五"}},
   {"id": "4", "type": "end", "position": {"x": 250, "y": 250}, "data": {"label": "结束", "type": "end"}}
 ]'::jsonb,
 '[
   {"id": "e1-2", "source": "1", "target": "2"},
   {"id": "e2-3", "source": "2", "target": "3"},
   {"id": "e3-4", "source": "3", "target": "4"}
 ]'::jsonb,
 '1', true
),
('2', '费用报销审批流程', '员工费用报销审批流程，需要经理审批', '报销', 
 '[
   {"id": "1", "type": "start", "position": {"x": 250, "y": 25}, "data": {"label": "开始", "type": "start"}},
   {"id": "2", "type": "approver", "position": {"x": 100, "y": 125}, "data": {"label": "经理审批", "type": "approver", "approverIds": ["2"], "approverName": "李四"}},
   {"id": "3", "type": "end", "position": {"x": 250, "y": 250}, "data": {"label": "结束", "type": "end"}}
 ]'::jsonb,
 '[
   {"id": "e1-2", "source": "1", "target": "2"},
   {"id": "e2-3", "source": "2", "target": "3"}
 ]'::jsonb,
 '1', true
),
('3', '采购申请审批流程', '采购申请审批流程，需要经理和财务审批', '采购', 
 '[
   {"id": "1", "type": "start", "position": {"x": 250, "y": 25}, "data": {"label": "开始", "type": "start"}},
   {"id": "2", "type": "approver", "position": {"x": 100, "y": 125}, "data": {"label": "经理审批", "type": "approver", "approverIds": ["2"], "approverName": "李四"}},
   {"id": "3", "type": "approver", "position": {"x": 400, "y": 125}, "data": {"label": "财务审批", "type": "approver", "approverIds": ["4"], "approverName": "赵六"}},
   {"id": "4", "type": "end", "position": {"x": 250, "y": 250}, "data": {"label": "结束", "type": "end"}}
 ]'::jsonb,
 '[
   {"id": "e1-2", "source": "1", "target": "2"},
   {"id": "e2-3", "source": "2", "target": "3"},
   {"id": "e3-4", "source": "3", "target": "4"}
 ]'::jsonb,
 '1', true
);

-- 插入审批请求示例数据
INSERT INTO approval_requests (id, title, description, requester_id, template_id, flow_instance_id, status, priority, category, current_step, total_steps, due_date) VALUES
('1', '年假申请', '申请5天年假，用于家庭旅行', '1', '1', 'flow-1', 'approved', 'medium', '请假', 2, 2, '2024-12-20'),
('2', '差旅费用报销', '11月出差北京的费用报销', '1', '2', 'flow-2', 'pending', 'high', '报销', 1, 1, '2024-12-25'),
('3', '办公设备采购', '采购新笔记本电脑和显示器', '1', '3', 'flow-3', 'in-progress', 'medium', '采购', 1, 2, '2024-12-30');

-- 插入流程实例数据
INSERT INTO approval_flow_instances (id, template_id, request_id, current_node_id, status) VALUES
('1', '1', '1', '4', 'completed'),
('2', '2', '2', '2', 'pending'),
('3', '3', '3', '2', 'in-progress');

-- 插入审批步骤历史数据
INSERT INTO approval_flow_steps (id, instance_id, node_id, approver_id, decision, comments, step, decision_at) VALUES
('1', '1', '2', '2', 'approved', '同意请假申请', 1, '2024-12-11'),
('2', '1', '3', '3', 'approved', 'HR审批通过', 2, '2024-12-12');

-- 插入审批动作数据
INSERT INTO approval_actions (id, request_id, approver_id, action, comments, step) VALUES
('1', '1', '2', 'approved', '同意请假申请', 1),
('2', '1', '3', 'approved', 'HR审批通过', 2);

-- 创建视图 - 审批请求详情视图
CREATE VIEW approval_request_details AS
SELECT 
    ar.id,
    ar.title,
    ar.description,
    ar.status,
    ar.priority,
    ar.category,
    ar.current_step,
    ar.total_steps,
    ar.due_date,
    ar.created_at,
    ar.updated_at,
    u.name as requester_name,
    u.email as requester_email,
    u.department as requester_department,
    aft.name as template_name,
    aft.description as template_description
FROM approval_requests ar
JOIN users u ON ar.requester_id = u.id
JOIN approval_flow_templates aft ON ar.template_id = aft.id;

-- 创建视图 - 审批统计视图
CREATE VIEW approval_stats AS
SELECT 
    category,
    COUNT(*) as total_requests,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests,
    COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_requests
FROM approval_requests
GROUP BY category;

-- 输出初始化完成信息
SELECT '数据库初始化完成！' as message;