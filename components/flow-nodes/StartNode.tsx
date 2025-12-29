'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircleOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';

const { Text } = Typography;

interface StartNodeData {
  label: string;
}

export const StartNode: React.FC<NodeProps<StartNodeData>> = ({ data, selected }) => {
  return (
    <div className="start-node">
      <Handle type="source" position={Position.Right} />

      <Card
        size="small"
        style={{
          width: 120,
          border: selected ? '2px solid #52c41a' : '1px solid #d9d9d9',
          borderRadius: 8,
          background: '#f6ffed'
        }}
        styles={{ body: { padding: '12px', textAlign: 'center' } }}
      >
        <PlayCircleOutlined style={{ color: '#52c41a', fontSize: '16px', marginBottom: 4 }} />
        <div>
          <Text strong style={{ fontSize: '12px' }}>开始</Text>
        </div>
      </Card>
    </div>
  );
};