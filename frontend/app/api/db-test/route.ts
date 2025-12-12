import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not set" },
      { status: 500 }
    );
  }

  // your db test logic here...
  return NextResponse.json({ ok: true });
}
