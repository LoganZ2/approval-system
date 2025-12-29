'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import { Card, Typography, Tag, Space, Divider } from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import 'reactflow/dist/style.css';
import { ApprovalRequest } from '@/types/approval';
import { ApprovalFlowTemplate, ApprovalFlowStep } from '@/types/approval-flow';

const { Text } = Typography;

interface ApprovalFlowViewerProps {
  approvalRequest: ApprovalRequest;
}

// 自定义节点组件
const StartNode = ({ data }: { data: { label: string; type: string } }) => (
  <div style={{ 
    padding: '12px', 
    textAlign: 'center',
    background: '#52c41a',
    color: 'white',
    borderRadius: '8px',
    border: '2px solid #389e0d',
    minWidth: '100px'
  }}>
    <PlayCircleOutlined style={{ fontSize: '16px', marginBottom: 4 }} />
    <div>
      <Text strong style={{ fontSize: '12px', color: 'white' }}>开始</Text>
    </div>
  </div>
);

const EndNode = ({ data }: { data: { label: string; type: string } }) => (
  <div style={{ 
    padding: '12px', 
    textAlign: 'center',
    background: '#ff4d4f',
    color: 'white',
    borderRadius: '8px',
    border: '2px solid #d9363e',
    minWidth: '100px'
  }}>
    <CheckCircleOutlined style={{ fontSize: '16px', marginBottom: 4 }} />
    <div>
      <Text strong style={{ fontSize: '12px', color: 'white' }}>结束</Text>
    </div>
  </div>
);

const ApproverNode = ({ data, status }: { data: { label: string; type: string; approverName?: string }; status?: string }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'approved': return '#52c41a';
      case 'rejected': return '#ff4d4f';
      case 'pending': return '#faad14';
      case 'current': return '#1890ff';
      default: return '#d9d9d9';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approved': return '已通过';
      case 'rejected': return '已拒绝';
      case 'pending': return '等待中';
      case 'current': return '当前步骤';
      default: return '未开始';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved': return <CheckCircleOutlined />;
      case 'rejected': return <CloseCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      case 'current': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  return (
    <div style={{ 
      padding: '12px', 
      textAlign: 'center',
      background: getStatusColor(),
      color: 'white',
      borderRadius: '8px',
      border: `2px solid ${getStatusColor()}`,
      minWidth: '120px'
    }}>
      <div style={{ marginBottom: 8 }}>
        <UserOutlined style={{ fontSize: '16px', marginRight: 8 }} />
        <Text strong style={{ fontSize: '12px', color: 'white' }}>审批人</Text>
      </div>
      
      <div style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: '11px', color: 'white' }}>
          {data.approverName || '待分配'}
        </Text>
      </div>

      <Tag 
        color={status === 'current' ? 'blue' : 'default'}
        style={{ 
          fontSize: '10px', 
          margin: 0,
          background: status === 'current' ? '#1890ff' : 'rgba(255,255,255,0.2)',
          color: 'white',
          border: 'none'
        }}
      >
        {getStatusIcon()} {getStatusText()}
      </Tag>
    </div>
  );
};

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  approver: ApproverNode,
};

const ApprovalFlowViewer: React.FC<ApprovalFlowViewerProps> = ({ approvalRequest }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flowTemplate, setFlowTemplate] = useState<ApprovalFlowTemplate | null>(null);

  // 获取流程模板数据
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        // 这里应该根据 approvalRequest.templateId 获取实际的模板
        // 现在根据审批请求数据动态创建模板
        const approverNodes = [];

        // 根据审批人数量创建审批节点
        if (approvalRequest.approvers && approvalRequest.approvers.length > 0) {
          approvalRequest.approvers.forEach((approverName, index) => {
            approverNodes.push({
              id: `approver-${index + 1}`,
              type: 'approver' as const,
              position: { x: 200 + (index * 200), y: 100 },
              data: {
                label: `审批人${index + 1}`,
                type: 'approver' as const,
                approverName: approverName
              },
            });
          });
        } else {
          // 如果没有审批人数据，创建默认节点
          approverNodes.push({
            id: 'approver-1',
            type: 'approver' as const,
            position: { x: 200, y: 100 },
            data: {
              label: '审批人',
              type: 'approver' as const,
              approverName: '待分配'
            },
          });
        }

        const mockTemplate: ApprovalFlowTemplate = {
          id: approvalRequest.templateId,
          name: approvalRequest.templateName,
          description: '审批流程模板',
          category: approvalRequest.category,
          nodes: [
            {
              id: 'start',
              type: 'start' as const,
              position: { x: 50, y: 100 },
              data: { label: '开始', type: 'start' as const },
            },
            ...approverNodes,
            {
              id: 'end',
              type: 'end' as const,
              position: { x: 200 + (approverNodes.length * 200), y: 100 },
              data: { label: '结束', type: 'end' as const },
            },
          ],
          edges: [
            { id: 'e-start-1', source: 'start', target: 'approver-1' },
            ...Array.from({ length: approverNodes.length - 1 }, (_, i) => ({
              id: `e-${i + 1}-${i + 2}`,
              source: `approver-${i + 1}`,
              target: `approver-${i + 2}`,
            })),
            {
              id: `e-${approverNodes.length}-end`,
              source: `approver-${approverNodes.length}`,
              target: 'end'
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          isActive: true,
        };

        setFlowTemplate(mockTemplate);
      } catch (error) {
        console.error('获取流程模板失败:', error);
      }
    };

    fetchTemplate();
  }, [approvalRequest]);

  // 根据审批状态更新节点显示
  useEffect(() => {
    if (!flowTemplate) return;

    const updatedNodes = flowTemplate.nodes.map(node => {
      const baseNode = {
        ...node,
        draggable: false,
        selectable: false,
        connectable: false,
      };

      if (node.type === 'start') {
        return {
          ...baseNode,
          type: 'start',
        };
      }

      if (node.type === 'end') {
        return {
          ...baseNode,
          type: 'end',
        };
      }

      if (node.type === 'approver') {
        // 根据当前审批状态设置节点状态
        let nodeStatus = 'pending';

        // 解析节点索引（approver-1, approver-2 等）
        const nodeIndex = parseInt(node.id.split('-')[1]);

        if (approvalRequest.status === 'approved') {
          // 所有节点都已通过
          nodeStatus = 'approved';
        } else if (approvalRequest.status === 'rejected') {
          // 如果被拒绝，当前节点显示拒绝状态
          const currentStep = approvalRequest.currentStep || 1;
          if (nodeIndex === currentStep) {
            nodeStatus = 'rejected';
          } else if (nodeIndex < currentStep) {
            nodeStatus = 'approved';
          } else {
            nodeStatus = 'pending';
          }
        } else if (approvalRequest.status === 'in-progress') {
          // 进行中状态
          const currentStep = approvalRequest.currentStep || 1;
          if (nodeIndex < currentStep) {
            nodeStatus = 'approved';
          } else if (nodeIndex === currentStep) {
            nodeStatus = 'current';
          } else {
            nodeStatus = 'pending';
          }
        } else if (approvalRequest.status === 'pending') {
          // 待审批状态
          if (nodeIndex === 1) {
            nodeStatus = 'current';
          } else {
            nodeStatus = 'pending';
          }
        }

        return {
          ...baseNode,
          type: 'approver',
          data: {
            ...node.data,
            status: nodeStatus,
          },
        };
      }

      return baseNode;
    });

    setNodes(updatedNodes);
    setEdges(flowTemplate.edges);
  }, [flowTemplate, approvalRequest]);

  if (!flowTemplate) {
    return <div>加载中...</div>;
  }

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
      >
        <Controls />
        <Background />
      </ReactFlow>
      
      <Divider />
      
      <Space orientation="vertical" style={{ width: '100%' }}>
        <Text strong>审批状态说明：</Text>
        <Space>
          <Tag color="green"><CheckCircleOutlined /> 已通过</Tag>
          <Tag color="blue"><ClockCircleOutlined /> 当前步骤</Tag>
          <Tag color="orange"><ClockCircleOutlined /> 等待中</Tag>
          <Tag color="red"><CloseCircleOutlined /> 已拒绝</Tag>
          <Tag color="default"><ClockCircleOutlined /> 未开始</Tag>
        </Space>
      </Space>
    </div>
  );
};

export default ApprovalFlowViewer;