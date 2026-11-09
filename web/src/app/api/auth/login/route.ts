import { NextRequest, NextResponse } from "next/server";
import { DEMO_USERS, serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
    }

    const demoAccount = DEMO_USERS[email.toLowerCase().trim()];
    if (!demoAccount || demoAccount.passwordHash !== password) {
      return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 401 });
    }

    const sessionValue = serializeSession(demoAccount.user);

    const res = NextResponse.json({
      success: true,
      user: demoAccount.user,
    });

    res.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada server saat login." }, { status: 500 });
  }
}
