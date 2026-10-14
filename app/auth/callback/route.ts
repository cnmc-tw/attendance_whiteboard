import { NextResponse } from 'next/server'

import { exchangeCodeForSession } from '@/app/actions';
import { safeInternalPath } from '@/lib/safe-redirect';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code')
  // V5: only same-origin relative paths are honoured; everything else -> "/".
  const redirect_to = safeInternalPath(searchParams.get('redirect_to'));

  if (!code)  return NextResponse.redirect(new URL("/login", origin));

  try {
    await exchangeCodeForSession(code);
  } catch {
    return NextResponse.redirect(new URL("/login", origin));
  }

  return NextResponse.redirect(new URL(redirect_to, origin));
}
