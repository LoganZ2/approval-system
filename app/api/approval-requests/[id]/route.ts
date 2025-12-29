import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestItem = await db.getApprovalRequestById(id);
    if (!requestItem) {
      return NextResponse.json(
        { error: '审批请求未找到' },
        { status: 404 }
      );
    }
    return NextResponse.json(requestItem);
  } catch (error) {
    console.error('获取审批请求失败:', error);
    return NextResponse.json(
      { error: '获取审批请求失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updatedRequest = await db.updateApprovalRequest(id, body);
    if (!updatedRequest) {
      return NextResponse.json(
        { error: '审批请求未找到' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedRequest);
  } catch (error) {
    return NextResponse.json(
      { error: '更新审批请求失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await db.deleteApprovalRequest(id);
    if (!success) {
      return NextResponse.json(
        { error: '审批请求未找到' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: '审批请求已删除' });
  } catch (error) {
    console.error('删除审批请求失败:', error);
    return NextResponse.json(
      { error: '删除审批请求失败' },
      { status: 500 }
    );
  }
}