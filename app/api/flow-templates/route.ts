import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const result = await db.getFlowTemplatesWithPagination(page, pageSize);
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取流程模板失败:', error);
    return NextResponse.json(
      { error: '获取流程模板失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 暂时使用固定用户ID，后续可以集成认证系统
    const createdBy = '1'; // 当前用户ID
    const newTemplate = await db.createFlowTemplate(body, createdBy);
    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('创建流程模板失败:', error);
    return NextResponse.json(
      { error: '创建流程模板失败' },
      { status: 500 }
    );
  }
}