'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  message,
  Popconfirm,
  Row,
  Col
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  PlayCircleOutlined 
} from '@ant-design/icons';
import { ApprovalFlowTemplate } from '@/types/approval-flow';
import ApprovalFlowEditor from './ApprovalFlowEditor';

const { Title, Text } = Typography;

interface TemplateManagerProps {
  onTemplateSelect?: (template: ApprovalFlowTemplate) => void;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState<ApprovalFlowTemplate[]>([]);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ApprovalFlowTemplate | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);

  // Fetch templates from API with pagination
  const fetchTemplates = async (page: number = 1, pageSize: number = 10) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/flow-templates?page=${page}&pageSize=${pageSize}`);
      const result = await response.json();

      if (response.ok) {
        setTemplates(result.templates);
        setPagination({
          current: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages
        });
      } else {
        console.error('获取模板失败:', result.error);
      }
    } catch (error) {
      console.error('获取模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleTableChange = (pagination: any) => {
    fetchTemplates(pagination.current, pagination.pageSize);
  };

  const handleSaveTemplate = async (template: ApprovalFlowTemplate) => {
    try {
      if (editingTemplate) {
        // Update existing template
        const response = await fetch(`/api/flow-templates/${template.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });

        if (!response.ok) {
          throw new Error('更新模板失败');
        }

        message.success('模板更新成功');
      } else {
        // Add new template
        const response = await fetch('/api/flow-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });

        if (!response.ok) {
          throw new Error('创建模板失败');
        }

        const newTemplate = await response.json();
        setTemplates(prev => [...prev, newTemplate]);
        message.success('模板创建成功');
      }

      setIsEditorVisible(false);
      setEditingTemplate(undefined);

      // 重新加载当前页的模板列表
      fetchTemplates(pagination.current, pagination.pageSize);

    } catch (error) {
      console.error('保存模板失败:', error);
      message.error('保存模板失败');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/flow-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除模板失败');
      }

      message.success('模板删除成功');

      // 重新加载当前页的模板列表
      fetchTemplates(pagination.current, pagination.pageSize);

    } catch (error) {
      console.error('删除模板失败:', error);
      message.error('删除模板失败');
    }
  };

  const handleEditTemplate = (template: ApprovalFlowTemplate) => {
    setEditingTemplate(template);
    setIsEditorVisible(true);
  };

  const handleUseTemplate = (template: ApprovalFlowTemplate) => {
    onTemplateSelect?.(template);
    message.info(`已选择模板: ${template.name}`);
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ApprovalFlowTemplate) => (
        <Space orientation="vertical" size={0}>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>
          {category}
        </Tag>
      ),
    },
    {
      title: '节点',
      key: 'nodes',
      render: (record: ApprovalFlowTemplate) => (
        <Text>{record.nodes.filter(n => n.type === 'approver').length} 个审批人</Text>
      ),
    },
    {
      title: '最后更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: ApprovalFlowTemplate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleUseTemplate(record)}
          >
            使用
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTemplate(record)}
          >
            查看/编辑
          </Button>
          <Popconfirm
            title="删除模板"
            description="确定要删除此模板吗？"
            onConfirm={() => handleDeleteTemplate(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      请假: 'blue',
      报销: 'green',
      采购: 'orange',
      人事: 'purple',
      IT: 'cyan',
      通用: 'gray',
    };
    return colors[category] || 'default';
  };

  return (
    <div>
      <Card
        title={
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>审批流程模板</Title>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingTemplate(undefined);
                  setIsEditorVisible(true);
                }}
              >
                新建模板
              </Button>
            </Col>
          </Row>
        }
      >
        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => handleTableChange({ current: page, pageSize }),
            onShowSizeChange: (current, size) => handleTableChange({ current: 1, pageSize: size })
          }}
        />
      </Card>

      {/* Template Editor Modal */}
      <Modal
        title={editingTemplate ? '编辑审批流程模板' : '创建审批流程模板'}
        open={isEditorVisible}
        onCancel={() => {
          setIsEditorVisible(false);
          setEditingTemplate(undefined);
        }}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        <ApprovalFlowEditor
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setIsEditorVisible(false);
            setEditingTemplate(undefined);
          }}
        />
      </Modal>

    </div>
  );
};

export default TemplateManager;