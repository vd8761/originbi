import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../../../lib/db';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get('x-user-id') || 'test-user-id';
    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const trimmed = title.trim().substring(0, 60);

    const result = await sql`
      UPDATE chat_sessions
      SET title = ${trimmed}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, title, updated_at as "updatedAt"
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating session title:', error);
    return NextResponse.json({ error: 'Failed to update session title' }, { status: 500 });
  }
}
