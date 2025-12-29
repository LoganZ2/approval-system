import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const requests = await db.getApprovalRequests();
    return NextResponse.json(requests);
  } catch (error) {
    console.error('获取审批请求失败:', error);
    return NextResponse.json(
      { error: '获取审批请求失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 暂时使用固定用户ID，后续可以集成认证系统
    const requesterId = '1'; // 当前用户ID
    const newRequest = await db.createApprovalRequest(body, requesterId);
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('创建审批请求失败:', error);
    return NextResponse.json(
      { error: '创建审批请求失败' },
      { status: 500 }
    );
  }
}