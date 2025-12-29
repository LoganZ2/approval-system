'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Card, Avatar, Typography } from 'antd';

const { Text } = Typography;

interface ApproverNodeData {
  label: string;
  approverId?: string;
  approverName?: string;
  description?: string;
}

export const ApproverNode: React.FC<NodeProps<ApproverNodeData>> = ({ data, selected }) => {
  return (
    <div className="approver-node">
      <Handle type="target" position={Position.Left} />

      <Card
        size="small"
        style={{
          width: 200,
          border: selected ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: 8,
        }}
        styles={{ body: { padding: '12px' } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <Avatar
            size="small"
            icon={<UserOutlined />}
            style={{ marginRight: 8, backgroundColor: '#1890ff' }}
          />
          <Text strong style={{ fontSize: '12px' }}>审批人</Text>
        </div>

        <div style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: '11px', color: '#666' }}>
            {data.approverName || '选择审批人'}
          </Text>
        </div>

        {data.description && (
          <Text style={{ fontSize: '10px', color: '#999' }}>
            {data.description}
          </Text>
        )}
      </Card>

      <Handle type="source" position={Position.Right} />
    </div>
  );
};