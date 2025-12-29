import { Pool } from 'pg';
import { 
  User, 
  ApprovalRequest, 
  CreateApprovalRequest, 
  ApprovalAction,
  ApprovalStats 
} from '@/types/approval';
import { 
  ApprovalFlowTemplate, 
  ApprovalFlowInstance, 
  ApprovalFlowStep,
  CreateFlowTemplate 
} from '@/types/approval-flow';

// 数据库配置
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'approval_system',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

class DatabaseService {
  // 用户相关操作
  async getUsers(): Promise<User[]> {
    const result = await pool.query('SELECT * FROM users WHERE is_deleted = false ORDER BY created_at DESC');
    return result.rows;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1 AND is_deleted = false', [id]);
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_deleted = false', [email]);
    return result.rows[0] || null;
  }

  async createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (name, email, role, department) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [user.name, user.email, user.role, user.department]
    );
    return result.rows[0];
  }

  // 审批请求相关操作
  async getApprovalRequests(): Promise<ApprovalRequest[]> {
    const result = await pool.query(`
      SELECT ar.*, u.name as requester_name, aft.name as template_name
      FROM approval_requests ar
      LEFT JOIN users u ON ar.requester_id = u.id
      LEFT JOIN approval_flow_templates aft ON ar.template_id = aft.id
      WHERE ar.is_deleted = false
      ORDER BY ar.created_at DESC
    `);
    return result.rows;
  }

  async getApprovalRequestById(id: string): Promise<ApprovalRequest | null> {
    const result = await pool.query(`
      SELECT ar.*, u.name as requester_name, aft.name as template_name
      FROM approval_requests ar
      LEFT JOIN users u ON ar.requester_id = u.id
      LEFT JOIN approval_flow_templates aft ON ar.template_id = aft.id
      WHERE ar.id = $1 AND ar.is_deleted = false
    `, [id]);
    return result.rows[0] || null;
  }

  async getApprovalRequestsByRequester(requesterId: string): Promise<ApprovalRequest[]> {
    const result = await pool.query(`
      SELECT ar.*, u.name as requester_name, aft.name as template_name
      FROM approval_requests ar
      LEFT JOIN users u ON ar.requester_id = u.id
      LEFT JOIN approval_flow_templates aft ON ar.template_id = aft.id
      WHERE ar.requester_id = $1 AND ar.is_deleted = false
      ORDER BY ar.created_at DESC
    `, [requesterId]);
    return result.rows;
  }

  async getApprovalRequestsByApprover(approverId: string): Promise<ApprovalRequest[]> {
    const result = await pool.query(`
      SELECT DISTINCT ar.*, u.name as requester_name, aft.name as template_name
      FROM approval_requests ar
      LEFT JOIN users u ON ar.requester_id = u.id
      LEFT JOIN approval_flow_templates aft ON ar.template_id = aft.id
      JOIN approval_flow_instances afi ON ar.id = afi.request_id
      JOIN approval_flow_steps afs ON afi.id = afs.instance_id
      WHERE afs.approver_id = $1 AND afs.decision = 'pending' AND ar.is_deleted = false
      ORDER BY ar.created_at DESC
    `, [approverId]);
    return result.rows;
  }

  async createApprovalRequest(requestData: CreateApprovalRequest, requesterId: string): Promise<ApprovalRequest> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 获取模板信息
      const templateResult = await client.query(
        'SELECT * FROM approval_flow_templates WHERE id = $1',
        [requestData.templateId]
      );
      const template = templateResult.rows[0];

      // 计算总步骤数
      const nodes = template.nodes;
      const totalSteps = nodes.filter((node: { type: string }) => node.type === 'approver').length;

      // 创建审批请求
      const requestResult = await client.query(`
        INSERT INTO approval_requests (
          title, description, requester_id, template_id, 
          flow_instance_id, priority, category, due_date, 
          total_steps, attachments
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        requestData.title,
        requestData.description,
        requesterId,
        requestData.templateId,
        `flow-${Date.now()}`,
        requestData.priority,
        requestData.category,
        requestData.dueDate,
        totalSteps,
        requestData.attachments || []
      ]);

      const newRequest = requestResult.rows[0];

      // 创建流程实例
      const instanceResult = await client.query(`
        INSERT INTO approval_flow_instances (template_id, request_id, current_node_id)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [requestData.templateId, newRequest.id, '1']);

      // 创建初始审批步骤
      const startNode = nodes.find((node: { type: string; id: string }) => node.type === 'start');
      if (startNode) {
        await client.query(`
          INSERT INTO approval_flow_steps (instance_id, node_id, approver_id, step)
          VALUES ($1, $2, $3, $4)
        `, [instanceResult.rows[0].id, startNode.id, requesterId, 0]);
      }

      await client.query('COMMIT');
      
      // 获取完整的请求信息
      const fullRequest = await this.getApprovalRequestById(newRequest.id);
      return fullRequest!;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateApprovalRequest(id: string, updates: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const allowedFields = ['status', 'current_step', 'priority', 'due_date', 'attachments'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key as keyof ApprovalRequest];
        return obj;
      }, {} as Record<string, unknown>);

    if (Object.keys(validUpdates).length === 0) {
      return null;
    }

    const setClause = Object.keys(validUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(validUpdates);
    values.unshift(id);

    const result = await pool.query(
      `UPDATE approval_requests SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  async deleteApprovalRequest(id: string): Promise<boolean> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 逻辑删除相关的审批动作
      await client.query('UPDATE approval_actions SET is_deleted = true, deleted_at = NOW() WHERE request_id = $1', [id]);

      // 逻辑删除相关的流程步骤
      await client.query(`
        UPDATE approval_flow_steps
        SET is_deleted = true, deleted_at = NOW()
        WHERE instance_id IN (SELECT id FROM approval_flow_instances WHERE request_id = $1)
      `, [id]);

      // 逻辑删除流程实例
      await client.query('UPDATE approval_flow_instances SET is_deleted = true, deleted_at = NOW() WHERE request_id = $1', [id]);

      // 逻辑删除审批请求
      const result = await client.query('UPDATE approval_requests SET is_deleted = true, deleted_at = NOW() WHERE id = $1', [id]);

      await client.query('COMMIT');

      return (result.rowCount || 0) > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // 流程模板相关操作
  async getFlowTemplates(): Promise<ApprovalFlowTemplate[]> {
    const result = await pool.query(`
      SELECT aft.*, u.name as created_by_name
      FROM approval_flow_templates aft
      LEFT JOIN users u ON aft.created_by = u.id AND u.is_deleted = false
      WHERE aft.is_active = true AND aft.is_deleted = false
      ORDER BY aft.created_at DESC
    `);
    return result.rows;
  }

  async getFlowTemplateById(id: string): Promise<ApprovalFlowTemplate | null> {
    const result = await pool.query(`
      SELECT aft.*, u.name as created_by_name
      FROM approval_flow_templates aft
      LEFT JOIN users u ON aft.created_by = u.id AND u.is_deleted = false
      WHERE aft.id = $1 AND aft.is_active = true AND aft.is_deleted = false
    `, [id]);
    return result.rows[0] || null;
  }

  async createFlowTemplate(templateData: CreateFlowTemplate, createdBy: string): Promise<ApprovalFlowTemplate> {
    const result = await pool.query(`
      INSERT INTO approval_flow_templates (name, description, category, nodes, edges, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      templateData.name,
      templateData.description,
      templateData.category,
      JSON.stringify(templateData.nodes),
      JSON.stringify(templateData.edges),
      createdBy
    ]);
    return result.rows[0];
  }

  async updateFlowTemplate(id: string, updates: Partial<ApprovalFlowTemplate>): Promise<ApprovalFlowTemplate | null> {
    const allowedFields = ['name', 'description', 'category', 'nodes', 'edges', 'is_active'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        const value = updates[key as keyof ApprovalFlowTemplate];
        // 确保JSON字段被正确序列化
        if ((key === 'nodes' || key === 'edges') && value && typeof value === 'object') {
          obj[key] = JSON.stringify(value);
        } else {
          obj[key] = value;
        }
        return obj;
      }, {} as Record<string, unknown>);

    if (Object.keys(validUpdates).length === 0) {
      return null;
    }

    const setClause = Object.keys(validUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(validUpdates);
    values.unshift(id);

    const result = await pool.query(`
      UPDATE approval_flow_templates
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 AND is_deleted = false
      RETURNING *
    `, values);

    return result.rows[0] || null;
  }

  async deleteFlowTemplate(id: string): Promise<boolean> {
    const result = await pool.query(`
      UPDATE approval_flow_templates
      SET is_deleted = true, deleted_at = NOW()
      WHERE id = $1 AND is_deleted = false
    `, [id]);

    return (result.rowCount || 0) > 0;
  }

  async getFlowTemplatesWithPagination(page: number = 1, pageSize: number = 10): Promise<{
    templates: ApprovalFlowTemplate[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * pageSize;

    // Get templates for current page
    const templatesResult = await pool.query(`
      SELECT * FROM approval_flow_templates
      WHERE is_deleted = false
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*) FROM approval_flow_templates
      WHERE is_deleted = false
    `);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / pageSize);

    return {
      templates: templatesResult.rows,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  // 流程实例相关操作
  async getFlowInstanceByRequestId(requestId: string): Promise<ApprovalFlowInstance | null> {
    const result = await pool.query(
      'SELECT * FROM approval_flow_instances WHERE request_id = $1',
      [requestId]
    );
    return result.rows[0] || null;
  }

  async updateFlowInstance(id: string, updates: Partial<ApprovalFlowInstance>): Promise<ApprovalFlowInstance | null> {
    const allowedFields = ['current_node_id', 'status', 'completed_at'];
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key as keyof ApprovalFlowInstance];
        return obj;
      }, {} as Record<string, unknown>);

    if (Object.keys(validUpdates).length === 0) {
      return null;
    }

    const setClause = Object.keys(validUpdates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const values = Object.values(validUpdates);
    values.unshift(id);

    const result = await pool.query(
      `UPDATE approval_flow_instances SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  // 审批步骤相关操作
  async getFlowStepsByInstanceId(instanceId: string): Promise<ApprovalFlowStep[]> {
    const result = await pool.query(`
      SELECT afs.*, u.name as approver_name
      FROM approval_flow_steps afs
      JOIN users u ON afs.approver_id = u.id
      WHERE afs.instance_id = $1
      ORDER BY afs.step ASC
    `, [instanceId]);
    return result.rows;
  }

  async createFlowStep(stepData: Omit<ApprovalFlowStep, 'id' | 'created_at'>): Promise<ApprovalFlowStep> {
    const result = await pool.query(`
      INSERT INTO approval_flow_steps (instance_id, node_id, approver_id, decision, comments, step, decision_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      stepData.instance_id,
      stepData.nodeId,
      stepData.approverId,
      stepData.decision,
      stepData.comments,
      stepData.step,
      stepData.decisionAt
    ]);
    return result.rows[0];
  }

  // 审批动作相关操作
  async createApprovalAction(actionData: Omit<ApprovalAction, 'id' | 'timestamp'>): Promise<ApprovalAction> {
    const result = await pool.query(`
      INSERT INTO approval_actions (request_id, approver_id, action, comments, step)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      actionData.requestId,
      actionData.approverId,
      actionData.action,
      actionData.comments,
      actionData.step
    ]);
    return result.rows[0];
  }

  async getApprovalActionsByRequestId(requestId: string): Promise<ApprovalAction[]> {
    const result = await pool.query(`
      SELECT aa.*, u.name as approver_name
      FROM approval_actions aa
      JOIN users u ON aa.approver_id = u.id
      WHERE aa.request_id = $1
      ORDER BY aa.timestamp ASC
    `, [requestId]);
    return result.rows;
  }

  // 统计相关操作
  async getApprovalStats(): Promise<ApprovalStats> {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress
      FROM approval_requests
    `);
    return result.rows[0];
  }

  async getCategoryStats(): Promise<Array<{ category: string; total: number; pending: number; approved: number; rejected: number; completed: number }>> {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress
      FROM approval_requests
      GROUP BY category
      ORDER BY total DESC
    `);
    return result.rows;
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    await pool.end();
  }
}

export const db = new DatabaseService();