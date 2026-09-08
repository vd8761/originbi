import { NextRequest, NextResponse } from 'next/server';
import { sql } from '../../../lib/db';
import { generateSystemPrompt, UserRole, PromptContext } from '../../../lib/ai/prompts';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || 'test-user-id';
    const body = await req.json();
    const { messages, sessionId, prompt, userRole } = body;
    const role = (userRole || req.headers.get('x-user-role') || 'STUDENT') as UserRole;
    const authToken = req.headers.get('x-auth-token') || '';
    const authHeader: Record<string, string> = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let currentSessionId = sessionId;

    // 1. Create session if it doesn't exist
    if (!currentSessionId) {
      const newSession = await sql`
        INSERT INTO chat_sessions (user_id, role, title)
        VALUES (${userId}, ${role}, ${prompt.substring(0, 50)})
        RETURNING id
      `;
      currentSessionId = newSession[0].id;
    }

    // 2. Save user message to DB
    await sql`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (${currentSessionId}, 'user', ${prompt})
    `;

    // ═══════════════════════════════════════════════════════════════════════
    // CORPORATE PATH — always returns here, never falls through.
    // AI is handled by corporate-service (port 4003), not OpenAI directly.
    // ═══════════════════════════════════════════════════════════════════════
    if (role === 'CORPORATE') {
      const corpApiBase = process.env.NEXT_PUBLIC_CORPORATE_API_URL || 'http://localhost:4003';
      try {
        const res = await fetch(`${corpApiBase}/jd-matching/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            email: userId,
            message: prompt,
            history: (messages || []).slice(-8).map((m: any) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          }),
        });

        const hrAnswer = res.ok
          ? (await res.json()).answer
          : 'The Corporate AI Brain is currently unavailable. Please ensure the corporate service is running on port 4003.';

        await sql`
          INSERT INTO chat_messages (session_id, role, content)
          VALUES (${currentSessionId}, 'assistant', ${hrAnswer})
        `;

        return NextResponse.json({ sessionId: currentSessionId, reply: hrAnswer });

      } catch (err) {
        console.error('Corporate service unreachable:', err);
        const fallback = 'Unable to connect to the Corporate AI Brain. Please ensure the corporate service is running and try again.';
        await sql`
          INSERT INTO chat_messages (session_id, role, content)
          VALUES (${currentSessionId}, 'assistant', ${fallback})
        `.catch(() => {});
        return NextResponse.json({ sessionId: currentSessionId, reply: fallback });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN / STUDENT PATH — uses OpenAI directly
    // ═══════════════════════════════════════════════════════════════════════

    // 3. Fetch role-specific context data
    let reportData: any = null;
    try {
      if (role === 'ADMIN') {
        const adminApiBase = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || 'http://localhost:4001';
        const res = await fetch(`${adminApiBase}/admin/dashboard-stats`, {
          headers: { 'Content-Type': 'application/json', ...authHeader }
        });
        reportData = res.ok ? await res.json() : { note: 'Live admin stats unavailable.' };
      } else {
        // STUDENT
        const reportApiBase = process.env.NEXT_PUBLIC_REPORT_API_BASE_URL || 'http://localhost:4004/report';
        const res = await fetch(`${reportApiBase}/summary?userId=${userId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        reportData = res.ok ? await res.json() : {
          status: 'Assessment Completed',
          topSkills: ['Communication', 'React Framework', 'Data Analysis'],
          careerRecommendations: ['Frontend Developer', 'Data Analyst'],
        };
      }
    } catch (e) {
      console.warn('Failed to fetch context data:', e);
    }

    // 4. Build system prompt
    const promptContext: PromptContext = { role, reportData, userName: userId };
    const systemPrompt = generateSystemPrompt(promptContext);

    // 5. Smart cache lookup
    const cacheString = `${role}:${prompt.trim().toLowerCase()}:${JSON.stringify(reportData || {})}`;
    const queryHash = crypto.createHash('sha256').update(cacheString).digest('hex');

    try {
      const cached = await sql`
        SELECT response FROM chat_cache
        WHERE query_hash = ${queryHash} AND role = ${role}
        LIMIT 1
      `;
      if (cached && cached.length > 0) {
        const cachedReply = cached[0].response;
        await sql`
          INSERT INTO chat_messages (session_id, role, content)
          VALUES (${currentSessionId}, 'assistant', ${cachedReply})
        `;
        return NextResponse.json({ sessionId: currentSessionId, reply: cachedReply, cached: true });
      }
    } catch (cacheErr) {
      console.warn('Cache lookup failed:', cacheErr);
    }

    // 6. Call OpenAI (ADMIN/STUDENT only)
    const openaiApiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured for ADMIN/STUDENT path.');
    }

    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt }
    ];

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 600,
        frequency_penalty: 0.2,
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      console.error('OpenAI Error:', err);
      throw new Error('Failed to generate AI response');
    }

    const data = await openaiRes.json();
    const assistantReply = data.choices[0].message.content;

    await sql`
      INSERT INTO chat_messages (session_id, role, content)
      VALUES (${currentSessionId}, 'assistant', ${assistantReply})
    `;

    try {
      await sql`
        INSERT INTO chat_cache (query_hash, role, response)
        VALUES (${queryHash}, ${role}, ${assistantReply})
        ON CONFLICT (query_hash) DO UPDATE SET response = EXCLUDED.response, updated_at = CURRENT_TIMESTAMP
      `;
    } catch (cacheSaveErr) {
      console.warn('Failed to save to cache:', cacheSaveErr);
    }

    return NextResponse.json({ sessionId: currentSessionId, reply: assistantReply });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during chat completion' }, { status: 500 });
  }
}
