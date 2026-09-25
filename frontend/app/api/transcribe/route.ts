import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Pass the file to OpenAI Whisper API
    // Whisper automatically detects the language and returns the transcription
    const openAiFormData = new FormData();
    openAiFormData.append('file', file, 'audio.webm');
    openAiFormData.append('model', 'whisper-1');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: openAiFormData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Whisper API Error:', err);
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error('Transcription Error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed' }, { status: 500 });
  }
}
