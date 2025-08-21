import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  
  return NextResponse.json({
    hasCookie: !!token,
    token: token ? 'Token exists' : 'No token',
    cookies: Object.fromEntries(request.cookies.getAll().map(cookie => [cookie.name, cookie.value]))
  })
}
