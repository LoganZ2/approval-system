import { Node, Edge } from 'reactflow';

export type ApprovalNodeType = 'start' | 'approver' | 'decision' | 'end';

export interface ApprovalNodeData {
  label: string;
  type: ApprovalNodeType;
  approverIds?: string[];
  approverName?: string;
  condition?: string;
  description?: string;
}

export interface ApprovalFlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node<ApprovalNodeData>[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface ApprovalFlowInstance {
  id: string;
  templateId: string;
  requestId: string;
  currentNodeId: string;
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
  history: ApprovalFlowStep[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ApprovalFlowStep {
  id?: string;
  instance_id: string;
  nodeId: string;
  approverId: string;
  approverName: string;
  decision: 'approved' | 'rejected' | 'pending';
  comments?: string;
  decisionAt?: Date;
  step: number;
  created_at?: Date;
}

export interface CreateFlowTemplate {
  name: string;
  description: string;
  category: string;
  nodes: Node<ApprovalNodeData>[];
  edges: Edge[];
}

export interface FlowTemplateStats {
  templateId: string;
  templateName: string;
  usageCount: number;
  averageCompletionTime: number;
  approvalRate: number;
}