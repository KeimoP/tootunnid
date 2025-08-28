import { differenceInMinutes, format, parseISO } from 'date-fns'

export function calculateDuration(clockIn: Date, clockOut: Date): number {
  return differenceInMinutes(clockOut, clockIn)
}

export function calculateEarnings(durationInMinutes: number, hourlyWage: number): number {
  const hours = durationInMinutes / 60
  return Math.round((hours * hourlyWage) * 100) / 100 // Round to 2 decimal places
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d, yyyy')
}

export function formatTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'HH:mm')
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d, yyyy HH:mm')
}

export function formatTimeByLanguage(date: Date | string, language: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (language === 'et') {
    // 24-hour format for Estonian
    return dateObj.toLocaleTimeString('et-EE', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    })
  } else {
    // 12-hour format for English
    return dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    })
  }
}

export function formatDateByLanguage(date: Date | string, language: string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  if (language === 'et') {
    return dateObj.toLocaleDateString('et-EE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } else {
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}
