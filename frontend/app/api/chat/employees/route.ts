import { NextRequest, NextResponse } from 'next/server';

// ─── Helper: convert raw DISC score to behavioral level ─────────────────────
function toLevel(score: number | null): 'High' | 'Moderate' | 'Low' {
  if (score === null || score === undefined) return 'Low';
  if (score >= 65) return 'High';
  if (score >= 35) return 'Moderate';
  return 'Low';
}

// ─── GET /api/chat/employees ─────────────────────────────────────────────────
// Returns ONLY: name, group, designation, gender, traitCode, discPattern
// Does NOT return: raw scores, blended style name, personality description
// Data source: assessment_attempts table directly (no report service)
export async function GET(req: NextRequest) {
  try {
    const authToken = req.headers.get('x-auth-token') || '';
    const userId = req.headers.get('x-user-id') || '';
    const corpApiBase = process.env.NEXT_PUBLIC_CORPORATE_API_URL || 'http://localhost:4003';

    const res = await fetch(`${corpApiBase}/jd-matching/employees`, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch employee list' }, { status: res.status });
    }

    const raw: any[] = await res.json();

    // Strip sensitive fields — only return what the frontend cache needs
    const safe = raw.map((e: any) => ({
      registrationId: e.registrationId,
      fullName: e.fullName || 'Unknown',
      groupName: e.groupName || null,
      designation: e.currentRole || e.designation || null,
      gender: e.gender || null,
      traitCode: e.personalityCode || null,   // e.g. "DC", "IS" — used for matching only
      discPattern: {
        D: toLevel(e.discScoreD),
        I: toLevel(e.discScoreI),
        S: toLevel(e.discScoreS),
        C: toLevel(e.discScoreC),
      },
    }));

    return NextResponse.json(safe);
  } catch (error: any) {
    console.error('Employees fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
