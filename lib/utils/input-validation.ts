/**
 * SECURITY: Input Validation and Sanitization
 * Prevents SQL injection, parameter injection, XSS, and other exploits
 */

/**
 * Validate and sanitize UUID format
 * Prevents UUID injection/enumeration attacks
 */
export function isValidUUID(value: any): boolean {
  if (typeof value !== "string") return false

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Validate email format
 * Prevents email injection and SMTP attacks
 */
export function isValidEmail(email: any): boolean {
  if (typeof email !== "string") return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

/**
 * Validate phone number (Nigeria format)
 */
export function isValidPhone(phone: any): boolean {
  if (typeof phone !== "string") return false

  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, "")

  // Valid Nigeria numbers: 10-15 digits, start with + or digit
  const phoneRegex = /^(\+234|0)?[0-9]{10,14}$/
  return phoneRegex.test(cleaned)
}

/**
 * Validate and normalize amount (monetary value)
 * Prevents amount injection attacks
 */
export function isValidAmount(amount: any): boolean {
  if (typeof amount !== "number" && typeof amount !== "string") return false

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount

  // Amount must be positive and not NaN
  if (isNaN(numAmount) || numAmount <= 0) return false

  // Maximum reasonable amount (prevent overflow)
  if (numAmount > 999999999) return false

  return true
}

/**
 * Safe amount conversion (prevents balance injection)
 * Always returns number or throws error
 */
export function safeAmountConversion(amount: any): number {
  if (!isValidAmount(amount)) {
    throw new Error("Invalid amount")
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount

  // Round to 2 decimal places (Nigerian Naira)
  return Math.round(numAmount * 100) / 100
}

/**
 * Validate balance calculations
 * Prevents balance injection/manipulation
 */
export function validateBalanceCalculation(
  currentBalance: number,
  transactionAmount: number,
  operation: "ADD" | "SUBTRACT"
): number {
  if (!isValidAmount(currentBalance)) {
    throw new Error("Invalid current balance")
  }

  if (!isValidAmount(transactionAmount)) {
    throw new Error("Invalid transaction amount")
  }

  let newBalance: number

  if (operation === "ADD") {
    newBalance = currentBalance + transactionAmount
  } else {
    newBalance = currentBalance - transactionAmount

    // Prevent negative balance
    if (newBalance < 0) {
      throw new Error("Insufficient balance")
    }
  }

  // Ensure new balance is valid
  if (!isValidAmount(newBalance)) {
    throw new Error("Invalid resulting balance")
  }

  return Math.round(newBalance * 100) / 100
}

/**
 * Sanitize user input string
 * Removes potentially dangerous characters but keeps readable text
 */
export function sanitizeString(input: any, maxLength: number = 255): string {
  if (typeof input !== "string") {
    throw new Error("Input must be a string")
  }

  let sanitized = input
    .trim()
    // Remove null bytes
    .replace(/\0/g, "")
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, "")
    // Limit length
    .substring(0, maxLength)

  return sanitized
}

/**
 * Validate transaction reference format
 * Prevents reference injection attacks
 */
export function isValidTransactionReference(ref: any): boolean {
  if (typeof ref !== "string") return false

  // Allow alphanumeric, hyphens, underscores only
  const refRegex = /^[a-zA-Z0-9\-_]{3,50}$/
  return refRegex.test(ref)
}

/**
 * Validate network/service ID format
 * Prevents injection in network parameters
 */
export function isValidServiceId(serviceId: any): boolean {
  if (typeof serviceId !== "string") return false

  // Allow alphanumeric and underscores only
  const serviceRegex = /^[a-zA-Z0-9_]{2,50}$/
  return serviceRegex.test(serviceId)
}

/**
 * Comprehensive input validation for transaction parameters
 */
export function validateTransactionInput(input: {
  userId?: string
  amount?: any
  phone?: string
  serviceId?: string
  reference?: string
}): void {
  if (input.userId && !isValidUUID(input.userId)) {
    throw new Error("Invalid user ID format")
  }

  if (input.amount !== undefined && !isValidAmount(input.amount)) {
    throw new Error("Invalid amount")
  }

  if (input.phone && !isValidPhone(input.phone)) {
    throw new Error("Invalid phone number")
  }

  if (input.serviceId && !isValidServiceId(input.serviceId)) {
    throw new Error("Invalid service ID")
  }

  if (input.reference && !isValidTransactionReference(input.reference)) {
    throw new Error("Invalid transaction reference")
  }
}
