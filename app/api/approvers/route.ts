import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    const users = await db.getUsers();
    // Filter to get only users who can be approvers (managers and above)
    const approvers = users.filter(user =>
      user.role.includes('经理') || user.role.includes('总监') || user.role.includes('主管')
    );
    return NextResponse.json(approvers);
  } catch (error) {
    console.error('获取审批人列表失败:', error);
    return NextResponse.json(
      { error: '获取审批人列表失败' },
      { status: 500 }
    );
  }
}