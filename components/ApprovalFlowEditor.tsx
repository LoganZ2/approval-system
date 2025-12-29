'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Card,
  Button,
  Space,
  Typography,
  Divider,
  Modal,
  Form,
  Input,
  Select,
  message
} from 'antd';
import { PlusOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { StartNode } from './flow-nodes/StartNode';
import { ApproverNode } from './flow-nodes/ApproverNode';
import { EndNode } from './flow-nodes/EndNode';
import { ApprovalFlowTemplate, ApprovalNodeData } from '@/types/approval-flow';

const { Title } = Typography;
const { Option } = Select;

interface ApprovalFlowEditorProps {
  template?: ApprovalFlowTemplate;
  onSave?: (template: ApprovalFlowTemplate) => void;
  onCancel?: () => void;
}

interface Approver {
  id: string;
  name: string;
  role: string;
}

const nodeTypes = {
  start: StartNode,
  approver: ApproverNode,
  end: EndNode,
};

const FlowEditorContent: React.FC<ApprovalFlowEditorProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    template?.nodes || [
      {
        id: '1',
        type: 'start',
        position: { x: 250, y: 25 },
        data: { label: 'Start', type: 'start' },
      },
    ]
  );

  const [edges, setEdges, onEdgesChange] = useEdgesState(
    template?.edges || []
  );

  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [isApproverModalVisible, setIsApproverModalVisible] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedApproverIds, setSelectedApproverIds] = useState<string[]>([]);
  const [form] = Form.useForm();
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(false);

  // Update nodes and edges when template changes
  useEffect(() => {
    if (template) {
      setNodes(template.nodes || [
        {
          id: '1',
          type: 'start',
          position: { x: 250, y: 25 },
          data: { label: 'Start', type: 'start' },
        },
      ]);
      setEdges(template.edges || []);
      // // Reset form with template data - only if form is ready
      // if (form) {
      //   form.setFieldsValue({
      //     name: template.name || '',
      //     description: template.description || '',
      //     category: template.category || 'general',
      //   });
      // }
    } else {
      // Reset to initial state when creating new template
      setNodes([
        {
          id: '1',
          type: 'start',
          position: { x: 250, y: 25 },
          data: { label: 'Start', type: 'start' },
        },
      ]);
      setEdges([]);
      // Reset form - only if form is ready
      // if (form) {
      //   form.setFieldsValue({
      //     name: '',
      //     description: '',
      //     category: 'general',
      //   });
      // }
    }
  }, [template, setNodes, setEdges, form]);

  // Fetch approvers from API
  useEffect(() => {
    const fetchApprovers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/approvers');
        if (response.ok) {
          const data = await response.json();
          setApprovers(data);
        } else {
          message.error('获取审批人列表失败');
        }
      } catch (error) {
        message.error('获取审批人列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovers();
  }, []);

  useEffect(() => {
    // 只有当 Modal 打开时才操作表单
    if (isSaveModalVisible && form) {
      if (template) {
        // 编辑模式：回填数据
        form.setFieldsValue({
          name: template.name || '',
          description: template.description || '',
          category: template.category || 'general',
        });
      } else {
        // 新建模式：重置表单
        form.resetFields();
        form.setFieldsValue({
          category: 'general',
        });
      }
    }
  }, [isSaveModalVisible, template, form]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'approver') {
      setSelectedNodeId(node.id);
      // Pre-populate with existing approver IDs if any
      setSelectedApproverIds(node.data.approverIds || []);
      setIsApproverModalVisible(true);
    }
  }, []);

  const handleApproverSelectChange = useCallback((approverIds: string[]) => {
    setSelectedApproverIds(approverIds);
  }, []);

  const handleApproverSelectConfirm = useCallback(() => {
    if (selectedNodeId) {
      const selectedApprovers = approvers.filter(a => selectedApproverIds.includes(a.id));
      if (selectedApprovers.length > 0) {
        const approverNames = selectedApprovers.map(a => a.name).join(', ');
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    approverIds: selectedApproverIds,
                    approverName: approverNames,
                  },
                }
              : node
          )
        );
        message.success(`审批人设置为: ${approverNames}`);
      } else {
        // Clear approvers if none selected
        setNodes((nds) =>
          nds.map((node) =>
            node.id === selectedNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    approverIds: [],
                    approverName: 'Select Approvers',
                  },
                }
              : node
          )
        );
        message.info('审批人已清空');
      }
      setIsApproverModalVisible(false);
      setSelectedNodeId(null);
      setSelectedApproverIds([]);
    }
  }, [selectedNodeId, selectedApproverIds, approvers, setNodes]);

  const handleApproverSelectCancel = useCallback(() => {
    setIsApproverModalVisible(false);
    setSelectedNodeId(null);
    setSelectedApproverIds([]);
  }, []);

  const addApproverNode = useCallback(() => {
    // Calculate position based on existing nodes
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 200 : 300;
    const newY = lastNode ? lastNode.position.y + 100 : 200;

    const newNode: Node<ApprovalNodeData> = {
      id: `${Date.now()}`,
      type: 'approver',
      position: {
        x: newX,
        y: newY
      },
      data: {
        label: '审批人',
        type: 'approver',
        approverName: '选择审批人'
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const addEndNode = useCallback(() => {
    // Calculate position based on existing nodes
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 200 : 500;
    const newY = lastNode ? lastNode.position.y : 200;

    const newNode: Node<ApprovalNodeData> = {
      id: `${Date.now()}`,
      type: 'end',
      position: {
        x: newX,
        y: newY
      },
      data: { label: '结束', type: 'end' },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  const removeSelectedNode = useCallback(() => {
    const selectedNode = nodes.find(node => node.selected);
    if (selectedNode && selectedNode.type !== 'start') {
      setNodes((nds) => nds.filter(node => node.id !== selectedNode.id));
      // Also remove connected edges
      setEdges((eds) => eds.filter(edge =>
        edge.source !== selectedNode.id && edge.target !== selectedNode.id
      ));
      message.success('节点已删除');
    } else if (selectedNode?.type === 'start') {
      message.error('无法删除开始节点');
    } else {
      message.info('请选择一个节点进行删除');
    }
  }, [nodes, setNodes, setEdges]);

  const handleSave = useCallback(() => {
    setIsSaveModalVisible(true);
  }, []);

  const handleSaveConfirm = useCallback(async () => {
    try {
      const values = await form.validateFields();

      const templateData = {
        name: values.name,
        description: values.description,
        category: values.category,
        nodes,
        edges,
      };

      let response;
      if (template?.id) {
        // Update existing template
        response = await fetch(`/api/flow-templates/${template.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        });
      } else {
        // Create new template
        response = await fetch('/api/flow-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        });
      }

      if (response.ok) {
        const savedTemplate = await response.json();
        onSave?.(savedTemplate);
        setIsSaveModalVisible(false);
        message.success(template?.id ? '模板更新成功' : '模板创建成功');
      } else {
        const errorData = await response.json();
        message.error(`保存失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error) {
      message.error('保存模板时发生错误');
    }
  }, [form, nodes, edges, template, onSave]);

  const isValidFlow = useMemo(() => {
    const hasStart = nodes.some(node => node.type === 'start');
    const hasEnd = nodes.some(node => node.type === 'end');
    const hasApprovers = nodes.some(node => node.type === 'approver');
    return hasStart && hasEnd && hasApprovers;
  }, [nodes]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              {template ? '编辑审批流程' : '创建审批流程'}
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={onCancel}>
              取消
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!isValidFlow}
            >
              保存模板
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addApproverNode}
            >
              添加审批节点
            </Button>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addEndNode}
            >
              添加结束节点
            </Button>
            <Button
              type="dashed"
              danger
              icon={<DeleteOutlined />}
              onClick={removeSelectedNode}
            >
              删除选中
            </Button>
          </div>
          
          <Divider />
          
          <div style={{ height: '600px', border: '1px solid #d9d9d9', borderRadius: 8 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
            >
              <Controls />
              <Background />
              <MiniMap 
                nodeColor={(node) => {
                  if (node.type === 'start') return '#f6ffed';
                  if (node.type === 'end') return '#fff2f0';
                  return '#e6f7ff';
                }}
                position="bottom-right"
              />
            </ReactFlow>
          </div>
        </Space>
      </Card>

        <Modal
          title="保存审批流程模板"
          open={isSaveModalVisible}
          onCancel={() => setIsSaveModalVisible(false)}
          onOk={handleSaveConfirm}
          okText="保存模板"
        >
          <Form
            form={form}
            layout="vertical"
          >
            <Form.Item
              name="name"
              label="模板名称"
              rules={[{ required: true, message: '请输入模板名称' }]}
            >
              <Input placeholder="输入模板名称" />
            </Form.Item>

            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true, message: '请输入描述' }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="描述此审批流程模板"
              />
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
          </Form>
        </Modal>

      {/* Approver Selection Modal */}
      <Modal
        title="选择审批人"
        open={isApproverModalVisible}
        onCancel={handleApproverSelectCancel}
        footer={[
          <Button key="cancel" onClick={handleApproverSelectCancel}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            onClick={handleApproverSelectConfirm}
            disabled={loading}
          >
            确定
          </Button>
        ]}
      >
        <div>
          <p style={{ marginBottom: 16 }}>为此节点选择一个或多个审批人：</p>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              加载审批人列表中...
            </div>
          ) : (
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="选择审批人"
              value={selectedApproverIds}
              onChange={handleApproverSelectChange}
              options={approvers.map(approver => ({
                value: approver.id,
                label: `${approver.name} (${approver.role})`
              }))}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export const ApprovalFlowEditor: React.FC<ApprovalFlowEditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowEditorContent {...props} />
    </ReactFlowProvider>
  );
};

export default ApprovalFlowEditor;