import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../../lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const sessionId = resolvedParams.id;
    // Note: In production, verify that this session actually belongs to the authenticated user!
    const userId = req.headers.get('x-user-id') || 'test-user-id';

    // Verify ownership
    const sessionCheck = await sql`
      SELECT id FROM chat_sessions 
      WHERE id = ${sessionId} AND user_id = ${userId}
    `;

    if (sessionCheck.length === 0) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch messages
    const messages = await sql`
      SELECT id, role, content, created_at as "createdAt"
      FROM chat_messages
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
