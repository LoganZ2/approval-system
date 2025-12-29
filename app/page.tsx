'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Typography, Card, Statistic, Table, Tag, Modal, Form, Input, Select, DatePicker, message } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  TeamOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import ApprovalFlowViewer from '@/components/ApprovalFlowViewer';
import TemplateManager from '@/components/TemplateManager';
import { ApprovalRequest, CreateApprovalRequest, User } from '@/types/approval';
import { ApprovalFlowTemplate } from '@/types/approval-flow';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

type MenuKey = 'dashboard' | 'my-requests' | 'templates' | 'new-request';

export default function Home() {
  const [selectedMenu, setSelectedMenu] = useState<MenuKey>('dashboard');
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalFlowTemplate | null>(null);
  const [form] = Form.useForm();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch approval requests
        const requestsResponse = await fetch('/api/approval-requests');
        const requestsData = await requestsResponse.json();
        setApprovalRequests(requestsData);

        // Fetch users
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } catch (error) {
        console.error('数据加载失败:', error);
      }
    };

    fetchData();
  }, []);

  const handleCreateRequest = async (values: { title: string; description: string; templateId: string; priority: 'low' | 'medium' | 'high'; category: string; dueDate?: string; attachments?: string[] }) => {
    try {
      const response = await fetch('/api/approval-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          templateId: selectedTemplate?.id || '1',
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setApprovalRequests(prev => [...prev, newRequest]);
        setIsModalVisible(false);
        if (form) {
          form.resetFields();
        }
        message.success('审批请求创建成功');
      } else {
        message.error('创建审批请求失败');
      }
    } catch (error) {
      message.error('网络错误，请重试');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      case 'in-progress': return 'blue';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审批';
      case 'approved': return '已批准';
      case 'rejected': return '已拒绝';
      case 'in-progress': return '审批中';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return priority;
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <Text style={{ fontSize: '12px' }}>{text}</Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: ApprovalRequest) => (
        <Space>
          <Button type="link" size="small" onClick={() => setSelectedRequest(record)}>
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  const pendingRequests = approvalRequests.filter(req => req.status === 'pending');
  const approvedRequests = approvalRequests.filter(req => req.status === 'approved');
  const rejectedRequests = approvalRequests.filter(req => req.status === 'rejected');
  const inProgressRequests = approvalRequests.filter(req => req.status === 'in-progress');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#1890ff' }}>审批系统</Title>
        </div>
        
        <Menu
          mode="inline"
          selectedKeys={[selectedMenu]}
          style={{ border: 'none', marginTop: '16px' }}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: '仪表板',
            },
            {
              key: 'my-requests',
              icon: <FileTextOutlined />,
              label: '我的请求',
            },
            {
              key: 'templates',
              icon: <TeamOutlined />,
              label: '流程模板',
            },
          ]}
          onClick={({ key }) => setSelectedMenu(key as MenuKey)}
        />
      </Sider>

      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            {selectedMenu === 'dashboard' && '审批仪表板'}
            {selectedMenu === 'my-requests' && '我的审批请求'}
            {selectedMenu === 'templates' && '审批流程模板'}
          </Title>
          
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setIsModalVisible(true)}
            >
              新建请求
            </Button>
          </Space>
        </Header>

        <Content style={{ margin: 0 }}>
          {selectedMenu === 'dashboard' && (
            <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
              <Space orientation="vertical" style={{ width: '100%' }} size="large">
                <Card title="审批统计">
                  <Space size="large">
                    <Statistic
                      title="待审批"
                      value={pendingRequests.length}
                      prefix={<ClockCircleOutlined />}
                      styles={{ content: { color: '#faad14' } }}
                    />
                    <Statistic
                      title="已批准"
                      value={approvedRequests.length}
                      prefix={<CheckCircleOutlined />}
                      styles={{ content: { color: '#52c41a' } }}
                    />
                    <Statistic
                      title="已拒绝"
                      value={rejectedRequests.length}
                      prefix={<CloseCircleOutlined />}
                      styles={{ content: { color: '#ff4d4f' } }}
                    />
                    <Statistic
                      title="审批中"
                      value={inProgressRequests.length}
                      prefix={<ExclamationCircleOutlined />}
                      styles={{ content: { color: '#1890ff' } }}
                    />
                    <Statistic
                      title="总请求数"
                      value={approvalRequests.length}
                      prefix={<FileTextOutlined />}
                    />
                  </Space>
                </Card>

                <Card title="最近请求">
                  <Table
                    columns={columns}
                    dataSource={approvalRequests.slice(0, 5)}
                    rowKey="id"
                    pagination={false}
                  />
                </Card>
              </Space>
            </div>
          )}

          {selectedMenu === 'my-requests' && (
            <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
              <Card title="我的审批请求">
                <Table
                  columns={columns}
                  dataSource={approvalRequests.filter(req => req.requesterId === '1')}
                  rowKey="id"
                />
              </Card>
            </div>
          )}

          {selectedMenu === 'templates' && (
            <div style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
              <TemplateManager onTemplateSelect={setSelectedTemplate} />
            </div>
          )}
        </Content>
      </Layout>

      {/* Create Request Modal */}
      <Modal
        title="新建审批请求"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          if (form) {
            form.resetFields();
          }
        }}
        onOk={() => form?.submit()}
        okText="创建"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRequest}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入请求标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} placeholder="详细描述您的请求" />
          </Form.Item>

          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              <Option value="请假">请假</Option>
              <Option value="报销">报销</Option>
              <Option value="采购">采购</Option>
              <Option value="人事">人事</Option>
              <Option value="IT">IT</Option>
              <Option value="通用">通用</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="选择优先级">
              <Option value="low">低</Option>
              <Option value="medium">中</Option>
              <Option value="high">高</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="截止日期"
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Request Detail Modal */}
      <Modal
        title="请求详情"
        open={!!selectedRequest}
        onCancel={() => setSelectedRequest(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedRequest(null)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {selectedRequest && (
          <div>
            <Space orientation="vertical" style={{ width: '100%' }} size="large">
              <Card size="small" title="基本信息">
                <Space orientation="vertical">
                  <div><strong>标题:</strong> {selectedRequest.title}</div>
                  <div><strong>描述:</strong> {selectedRequest.description}</div>
                  <div><strong>状态:</strong> <Tag color={getStatusColor(selectedRequest.status)}>{getStatusText(selectedRequest.status)}</Tag></div>
                  <div><strong>优先级:</strong> <Tag color={getPriorityColor(selectedRequest.priority)}>{getPriorityText(selectedRequest.priority)}</Tag></div>
                  <div><strong>分类:</strong> {selectedRequest.category}</div>
                  <div><strong>创建时间:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</div>
                </Space>
              </Card>

              <Card size="small" title="审批流程">
                <ApprovalFlowViewer approvalRequest={selectedRequest} />
              </Card>
            </Space>
          </div>
        )}
      </Modal>

      {/* Template Selected Modal */}
      <Modal
        title="模板已选择"
        open={!!selectedTemplate}
        onCancel={() => setSelectedTemplate(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedTemplate(null)}>
            关闭
          </Button>,
          <Button 
            key="use" 
            type="primary"
            onClick={() => {
              if (selectedTemplate) {
                setIsModalVisible(true);
                setSelectedTemplate(null);
              }
            }}
          >
            使用此模板创建请求
          </Button>
        ]}
      >
        {selectedTemplate && (
          <div>
            <p><strong>模板:</strong> {selectedTemplate.name}</p>
            <p><strong>描述:</strong> {selectedTemplate.description}</p>
            <p><strong>分类:</strong> {selectedTemplate.category}</p>
            <p><strong>审批节点:</strong> {selectedTemplate.nodes.filter(n => n.type === 'approver').length} 个</p>
          </div>
        )}
      </Modal>
    </Layout>
  );
}