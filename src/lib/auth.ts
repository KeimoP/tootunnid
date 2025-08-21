import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  console.log('Generating token for userId:', userId)
  console.log('Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...')
  const token = jwt.sign({ userId }, JWT_SECRET) // Removed expiration temporarily
  console.log('Generated token:', token.substring(0, 20) + '...')
  return token
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    console.log('Verifying token:', token.substring(0, 20) + '...')
    console.log('Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...')
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string }
    console.log('Token verification successful, userId:', payload.userId)
    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}
