// src/app/api/gemini/generate/route.ts
import { NextResponse } from 'next/server';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1';

type GeminiPart = { text?: string };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      contents,
      generationConfig,
      safetySettings,
      model: modelFromBody,
    } = body || {};

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY on server' },
        { status: 500 }
      );
    }

    const model = modelFromBody || process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.5-flash';

    if (!Array.isArray(contents) || contents.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: contents[] is required' },
        { status: 400 }
      );
    }

    const url = `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig, safetySettings }),
      // Node fetch by default, no CORS issues server-side
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: `Gemini request failed: ${resp.status} ${resp.statusText}`, details: errText },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const text = ((data?.candidates?.[0]?.content?.parts || []) as unknown[])
      .map((p: unknown) => (typeof (p as GeminiPart)?.text === 'string' ? (p as GeminiPart).text! : ''))
      .join('');

    return NextResponse.json({ text, raw: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Server error', message },
      { status: 500 }
    );
  }
}
