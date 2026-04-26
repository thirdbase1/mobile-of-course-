/**
 * Device session management
 * Handles single-device login and session tracking
 */

export interface DeviceInfo {
  fingerprint: string
  name: string
  browser: string
  os: string
  userAgent: string
  ipAddress?: string
}

/**
 * Generate device fingerprint from client info
 * Combines browser, OS, and device info for identification
 */
export function generateDeviceFingerprint(): string {
  try {
    const navigator = window.navigator
    
    // Collect device identifiers
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      screen.width,
      screen.height,
      screen.colorDepth,
      navigator.hardwareConcurrency || 'unknown',
      navigator.deviceMemory || 'unknown',
    ]

    // Create hash from components
    const combined = components.join('|')
    const hash = btoa(combined).slice(0, 32)
    
    return hash
  } catch (error) {
    console.error("[v0] Failed to generate device fingerprint:", error)
    return 'unknown-device-' + Date.now()
  }
}

/**
 * Get device information
 */
export function getDeviceInfo(): Omit<DeviceInfo, 'fingerprint'> {
  const ua = window.navigator.userAgent
  
  // Parse browser
  let browser = 'Unknown'
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') < 0) browser = 'Chrome'
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') < 0) browser = 'Safari'
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox'
  else if (ua.indexOf('Edge') > -1) browser = 'Edge'
  
  // Parse OS
  let os = 'Unknown'
  if (ua.indexOf('Win') > -1) os = 'Windows'
  else if (ua.indexOf('Mac') > -1) os = 'macOS'
  else if (ua.indexOf('Linux') > -1) os = 'Linux'
  else if (ua.indexOf('Android') > -1) os = 'Android'
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS'
  
  // Device name
  const deviceName = `${browser} on ${os}`
  
  return {
    name: deviceName,
    browser,
    os,
    userAgent: ua,
  }
}

/**
 * Track session in localStorage for offline detection
 */
export function saveSessionLocally(sessionId: string): void {
  try {
    const sessionInfo = {
      id: sessionId,
      fingerprint: generateDeviceFingerprint(),
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('current_session', JSON.stringify(sessionInfo))
    console.log("[v0] Session saved locally:", sessionInfo)
  } catch (error) {
    console.error("[v0] Failed to save session locally:", error)
  }
}

/**
 * Get locally stored session
 */
export function getLocalSession(): { id: string; fingerprint: string; createdAt: string } | null {
  try {
    const stored = localStorage.getItem('current_session')
    return stored ? JSON.parse(stored) : null
  } catch (error) {
    console.error("[v0] Failed to get local session:", error)
    return null
  }
}

/**
 * Clear local session (on logout)
 */
export function clearLocalSession(): void {
  try {
    localStorage.removeItem('current_session')
    console.log("[v0] Local session cleared")
  } catch (error) {
    console.error("[v0] Failed to clear local session:", error)
  }
}

/**
 * Check if session was hijacked (fingerprint changed)
 */
export function hasSessionBeenHijacked(): boolean {
  try {
    const localSession = getLocalSession()
    if (!localSession) return false
    
    const currentFingerprint = generateDeviceFingerprint()
    const wasHijacked = localSession.fingerprint !== currentFingerprint
    
    if (wasHijacked) {
      console.warn("[v0] SECURITY: Session fingerprint changed - possible hijack or device change")
    }
    
    return wasHijacked
  } catch (error) {
    console.error("[v0] Failed to check session hijack:", error)
    return false
  }
}
