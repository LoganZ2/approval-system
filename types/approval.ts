export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

export interface ApprovalRequest {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  templateId: string;
  templateName: string;
  flowInstanceId: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  currentStep?: number;
  totalSteps?: number;
  approvers?: string[];
  currentApprovers?: string[];
  attachments?: string[];
}

export interface CreateApprovalRequest {
  title: string;
  description: string;
  templateId: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  attachments?: string[];
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  approverId: string;
  approverName: string;
  action: 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
  step: number;
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  inProgress: number;
}