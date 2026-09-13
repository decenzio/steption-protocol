import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try {
    sameOrigin =
      !!origin && new URL(origin).host === request.headers.get("host");
  } catch {}
  if (!sameOrigin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    return NextResponse.json(
      {
        error:
          "Newsletter signup is not configured yet. Contact hello@decenzio.com for updates.",
      },
      { status: 503 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 1024)
      return NextResponse.json(
        { error: "Request too large." },
        { status: 413 },
      );
    const { email } = JSON.parse(raw);
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^\S+@\S+\.\S+$/.test(email)
    )
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 },
      );
    const client = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await client
      .from("newsletter_subscribers")
      .upsert(
        { email: email.trim().toLowerCase() },
        { onConflict: "email", ignoreDuplicates: true },
      );
    if (error)
      return NextResponse.json(
        { error: "Signup is temporarily unavailable." },
        { status: 503 },
      );
    return NextResponse.json({
      message: "You’re subscribed to Steption updates.",
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to process signup." },
      { status: 400 },
    );
  }
}
