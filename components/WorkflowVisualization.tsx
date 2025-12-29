'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ApprovalRequest } from '@/types/approval';
import { ApprovalFlowTemplate } from '@/types/approval-flow';

interface WorkflowVisualizationProps {
  approvalRequest: ApprovalRequest;
}

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({ approvalRequest }) => {
  const { nodes, edges } = useMemo(() => {
    // For now, we'll create a simple visualization based on the request data
    // In a real implementation, you would fetch the actual flow template
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Start node
    nodes.push({
      id: 'start',
      type: 'input',
      position: { x: 100, y: 100 },
      data: { label: '开始' },
      style: {
        background: '#52c41a',
        color: 'white',
        border: '2px solid #389e0d',
        borderRadius: '8px',
        minWidth: 120,
      },
    });

    // Current step node
    if (approvalRequest.currentStep && approvalRequest.totalSteps) {
      const currentStep = approvalRequest.currentStep;
      const totalSteps = approvalRequest.totalSteps;
      
      nodes.push({
        id: 'current',
        position: { x: 300, y: 100 },
        data: { 
          label: `第 ${currentStep} 步/${totalSteps} 步` 
        },
        style: {
          background: '#1890ff',
          color: 'white',
          border: '2px solid #096dd9',
          borderRadius: '8px',
          minWidth: 120,
        },
      });

      edges.push({
        id: 'start-current',
        source: 'start',
        target: 'current',
        style: { stroke: '#1890ff' },
      });
    }

    // Status node
    const statusColors = {
      'pending': '#faad14',
      'approved': '#52c41a',
      'rejected': '#ff4d4f',
      'in-progress': '#1890ff'
    };

    const statusTexts = {
      'pending': '待审批',
      'approved': '已批准',
      'rejected': '已拒绝',
      'in-progress': '审批中'
    };

    nodes.push({
      id: 'status',
      position: { x: 500, y: 100 },
      data: { 
        label: statusTexts[approvalRequest.status as keyof typeof statusTexts] || approvalRequest.status 
      },
      style: {
        background: statusColors[approvalRequest.status as keyof typeof statusColors] || '#d9d9d9',
        color: 'white',
        border: '2px solid #bfbfbf',
        borderRadius: '8px',
        minWidth: 120,
      },
    });

    if (approvalRequest.currentStep) {
      edges.push({
        id: 'current-status',
        source: 'current',
        target: 'status',
        style: { stroke: '#1890ff' },
      });
    } else {
      edges.push({
        id: 'start-status',
        source: 'start',
        target: 'status',
        style: { stroke: '#1890ff' },
      });
    }

    // End node
    nodes.push({
      id: 'end',
      type: 'output',
      position: { x: 700, y: 100 },
      data: { label: '结束' },
      style: {
        background: '#722ed1',
        color: 'white',
        border: '2px solid #531dab',
        borderRadius: '8px',
        minWidth: 120,
      },
    });

    edges.push({
      id: 'status-end',
      source: 'status',
      target: 'end',
      style: { stroke: '#1890ff' },
    });

    return { nodes, edges };
  }, [approvalRequest]);

  return (
    <div style={{ width: '100%', height: '300px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default WorkflowVisualization;