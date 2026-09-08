import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    // Note: In production, extract this from the verified JWT/Amplify session.
    // For now, we look for headers or use a default for testing.
    const userId = req.headers.get('x-user-id') || 'test-user-id';
    
    // Fetch sessions from the database
    const sessions = await sql`
      SELECT id, title, created_at as "createdAt"
      FROM chat_sessions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'test-user-id';
    const role = req.headers.get('x-user-role') || 'STUDENT';
    const body = await req.json();
    const title = body.title || 'New Chat';

    const result = await sql`
      INSERT INTO chat_sessions (user_id, role, title)
      VALUES (${userId}, ${role}, ${title})
      RETURNING id, title, created_at as "createdAt"
    `;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
