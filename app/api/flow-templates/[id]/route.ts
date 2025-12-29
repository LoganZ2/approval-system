import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await db.getFlowTemplateById(id);
    if (!template) {
      return NextResponse.json(
        { error: '流程模板未找到' },
        { status: 404 }
      );
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error('获取流程模板失败:', error);
    return NextResponse.json(
      { error: '获取流程模板失败' },
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
    const updatedTemplate = await db.updateFlowTemplate(id, body);
    if (!updatedTemplate) {
      return NextResponse.json(
        { error: '流程模板未找到' },
        { status: 404 }
      );
    }
    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('更新流程模板失败:', error);
    return NextResponse.json(
      { error: '更新流程模板失败' },
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
    const success = await db.deleteFlowTemplate(id);
    if (!success) {
      return NextResponse.json(
        { error: '流程模板未找到' },
        { status: 404 }
      );
    }
    return NextResponse.json({ message: '流程模板已删除' });
  } catch (error) {
    console.error('删除流程模板失败:', error);
    return NextResponse.json(
      { error: '删除流程模板失败' },
      { status: 500 }
    );
  }
}