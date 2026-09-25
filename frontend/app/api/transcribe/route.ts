import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;

    // ── PRIMARY: Gemini 1.5 Flash (better multilingual + code-switching) ──
    if (geminiKey) {
      const audioBuffer = await file.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'audio/webm',
                    data: audioBase64,
                  },
                },
                {
                  text:
                    'Transcribe this audio exactly as spoken. ' +
                    'The speaker may mix Tamil, Hindi, or other languages with English. ' +
                    'Keep English words like "developer", "manager", "analyst", "role", "team", ' +
                    '"senior", "junior", "frontend", "backend", "fullstack", "DISC", "HR", ' +
                    '"assessment", "fit", "candidate", "hire", "performance" in English even if the rest is Tamil/Hindi. ' +
                    'Return ONLY the transcription text with no explanation, no formatting, no quotes.',
                },
              ],
            }],
            generationConfig: { temperature: 0 },
          }),
        }
      );

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
        return NextResponse.json({ text, engine: 'gemini' });
      }
      console.warn('Gemini transcription failed, falling back to Whisper');
    }

    // ── FALLBACK: OpenAI Whisper with hallucination detection ──
    if (!openaiKey) {
      return NextResponse.json({ error: 'No transcription API key configured. Add GEMINI_API_KEY or OPENAI_API_KEY to .env.local' }, { status: 500 });
    }

    const openAiFormData = new FormData();
    openAiFormData.append('file', file, 'audio.webm');
    openAiFormData.append('model', 'whisper-1');
    openAiFormData.append('response_format', 'verbose_json');
    openAiFormData.append(
      'prompt',
      'HR, employees, team, performance, management, developer, software engineer, ' +
      'designer, analyst, manager, leader, role, skills, DISC profile, assessment, ' +
      'project, frontend, backend, fullstack, senior, junior, fit, candidate, hire.'
    );

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}` },
      body: openAiFormData,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      console.error('Whisper API Error:', err);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const data = await whisperRes.json();

    // Hallucination detection using Whisper's own confidence scores
    const segments: any[] = data.segments || [];
    const cleanSegments = segments.filter(seg => {
      const noSpeech    = seg.no_speech_prob   ?? 0;
      const logProb     = seg.avg_logprob       ?? 0;
      const compression = seg.compression_ratio ?? 1;
      return noSpeech < 0.6 && logProb > -1.0 && compression < 2.4;
    });

    if (segments.length > 0 && cleanSegments.length === 0) {
      console.warn('Whisper: all segments were hallucinations — returning empty.');
      return NextResponse.json({ text: '', engine: 'whisper' });
    }

    const cleanText = cleanSegments.length > 0
      ? cleanSegments.map((s: any) => s.text).join(' ').trim()
      : data.text ?? '';

    return NextResponse.json({ text: cleanText, engine: 'whisper' });

  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed' }, { status: 500 });
  }
}
