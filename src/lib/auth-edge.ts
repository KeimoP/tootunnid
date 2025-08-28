// Edge Runtime compatible JWT functions using Web Crypto API
import { jwtVerify } from 'jose'

export async function verifyTokenEdge(token: string): Promise<{ userId: string } | null> {
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
    
    // Convert string secret to Uint8Array for jose
    const secretKey = new TextEncoder().encode(JWT_SECRET)
    
    // Verify the JWT token with proper signature verification
    const { payload } = await jwtVerify(token, secretKey)
    
    console.log('JWT verification successful, payload:', payload)
    
    if (payload.userId && typeof payload.userId === 'string') {
      console.log('Token verification successful, userId:', payload.userId)
      return { userId: payload.userId }
    }
    
    console.log('Invalid payload structure')
    return null
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}
