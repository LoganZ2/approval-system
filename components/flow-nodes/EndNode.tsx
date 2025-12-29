'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface EndNodeData {
  label: string;
}

export const EndNode: React.FC<NodeProps<EndNodeData>> = ({ data, selected }) => {
  return (
    <div className="end-node">
      <Handle type="target" position={Position.Left} />

      <Card
        size="small"
        style={{
          width: 120,
          border: selected ? '2px solid #ff4d4f' : '1px solid #d9d9d9',
          borderRadius: 8,
          background: '#fff2f0'
        }}
        styles={{ body: { padding: '12px', textAlign: 'center' } }}
      >
        <CheckCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px', marginBottom: 4 }} />
        <div>
          <Text strong style={{ fontSize: '12px' }}>结束</Text>
        </div>
      </Card>
    </div>
  );
};