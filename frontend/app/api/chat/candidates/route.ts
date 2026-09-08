import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const email = req.headers.get('x-user-email');
    if (!email) {
      return NextResponse.json({ candidates: [] });
    }

    const rows = await sql`
      SELECT au.name
      FROM assessment_users au
      JOIN origin_groups og ON au.origin_group_id = og.id
      JOIN corporate_users cu ON og.corporate_id = cu.id
      WHERE cu.email = ${email}
      LIMIT 20
    `;

    const candidates = rows.map((r: any) => r.name).filter(Boolean);
    return NextResponse.json({ candidates });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ candidates: [] });
  }
}
