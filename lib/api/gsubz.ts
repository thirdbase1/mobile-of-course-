"use server"

import { unstable_cache } from "next/cache"
import https from "https"
import http from "http"

const API_BASE_URL = "https://gsubz.com"
const API_PLANS_URL = "https://gsubz.com"
const API_KEY = process.env.GSUBZ_API_KEY || ""

// Connection pooling agents - reuse connections instead of creating new ones each time
const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000, // Keep alive for 30 seconds
  maxSockets: 50, // Maximum concurrent connections
  maxFreeSockets: 10, // Maximum idle connections to keep
  timeout: 2000, // 2 second timeout
})

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 2000,
})

interface ApiResponse {
  code: number
  status: string
  description: string
  content?: any
  gateway?: any
}

interface PlanResponse {
  service: string
  PlanName: string
  fixedPrice: boolean
  plans: Array<{
    displayName: string
    value: string
    price: string
  }>
}

async function makeApiRequest(endpoint: string, method: "GET" | "POST" = "POST", body?: FormData) {
  const headers: HeadersInit = {
    Authorization: `Bearer ${API_KEY}`,
  }

  const options: RequestInit = {
    method,
    headers,
    agent: API_BASE_URL.startsWith("https") ? httpsAgent : httpAgent,
  }

  if (body && method === "POST") {
    options.body = body
    // Don't set Content-Type when using FormData - let fetch handle it
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
  const data = await response.json()

  return data
}

// Uncached function to fetch data plans from API
async function _fetchDataPlansFromAPI(serviceId: string): Promise<PlanResponse> {
  try {
    const response = await fetch(`${API_PLANS_URL}/api/plans?service=${serviceId}`, {
      redirect: "follow",
      cache: "no-store",
      agent: API_PLANS_URL.startsWith("https") ? httpsAgent : httpAgent,
    })

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Error fetching plans:", error)
    throw error
  }
}

// Cached wrapper for data plans - creates separate cache per serviceId
export async function getDataPlans(serviceId: string): Promise<PlanResponse> {
  const getCached = unstable_cache(
    async () => _fetchDataPlansFromAPI(serviceId),
    [`gsubz-data-plans-${serviceId}`],
    { revalidate: 1800 }
  )
  return getCached()
}

// Uncached function to fetch cable plans from API
async function _fetchCablePlansFromAPI(service: string): Promise<PlanResponse> {
  try {
    console.log("[v0] Fetching cable plans...")

    const response = await fetch(`${API_PLANS_URL}/api/plans?service=${service}`, {
      redirect: "follow",
      cache: "no-store",
      agent: API_PLANS_URL.startsWith("https") ? httpsAgent : httpAgent,
    })

    console.log("[v0] Cable plans fetch completed")

    if (!response.ok) {
      console.error("[v0] Error fetching cable plans - HTTP error")
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()

    // Transform the response to match expected format
    if (data.list && Array.isArray(data.list)) {
      const transformed = {
        service: data.service || service,
        PlanName: "plan",
        fixedPrice: data.fixedPrice !== undefined ? data.fixedPrice : true,
        plans: data.list.map((item: any) => ({
          displayName: item.display_name || item.displayName || "",
          value: item.value || "",
          price: item.price || "0",
        })),
      }
      return transformed
    }

    return data
  } catch (error) {
    console.error("[v0] Error fetching cable plans:", error)
    throw error
  }
}

// Cached wrapper for cable plans - creates separate cache per service
export async function getCablePlans(service: string): Promise<PlanResponse> {
  const getCached = unstable_cache(
    async () => _fetchCablePlansFromAPI(service),
    [`gsubz-cable-plans-${service}`],
    { revalidate: 1800 }
  )
  return getCached()
}

export async function buyData(data: {
  serviceID: string
  plan: string
  phone: string
  requestID?: string
}): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append("serviceID", data.serviceID)
  formData.append("plan", data.plan)
  formData.append("api", API_KEY)
  formData.append("amount", "")
  formData.append("phone", data.phone)
  if (data.requestID) {
    formData.append("requestID", data.requestID)
  }

  return makeApiRequest("/api/pay/", "POST", formData)
}

export async function buyAirtime(data: {
  serviceID: string
  amount: string
  phone: string
  requestID?: string
}): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append("serviceID", data.serviceID)
  formData.append("api", API_KEY)
  formData.append("amount", data.amount)
  formData.append("phone", data.phone)
  if (data.requestID) {
    formData.append("requestID", data.requestID)
  }

  return makeApiRequest("/api/pay/", "POST", formData)
}

export async function buyCableSubscription(data: {
  serviceID: string
  plan: string
  phone: string
  customerID: string
  requestID?: string
}): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append("serviceID", data.serviceID)
  formData.append("api", API_KEY)
  formData.append("plan", data.plan)
  formData.append("phone", data.phone)
  formData.append("amount", "")
  formData.append("customerID", data.customerID)
  if (data.requestID) {
    formData.append("requestID", data.requestID)
  }

  console.log("[v0] Cable subscription request initiated")

  return makeApiRequest("/api/pay/", "POST", formData)
}

export async function buyElectricityToken(data: {
  serviceID: string
  phone: string
  customerID: string
  amount: string
  variation_code: string
  requestID?: string
}): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append("serviceID", data.serviceID)
  formData.append("api", API_KEY)
  formData.append("phone", data.phone)
  formData.append("amount", data.amount)
  formData.append("customerID", data.customerID)
  formData.append("variation_code", data.variation_code)
  if (data.requestID) {
    formData.append("requestID", data.requestID)
  }

  return makeApiRequest("/api/pay/", "POST", formData)
}

export async function getWalletBalance(): Promise<{ balance: string }> {
  const formData = new FormData()
  formData.append("api", API_KEY)

  return makeApiRequest("/api/balance/", "POST", formData)
}

export async function verifyTransaction(requestID: string): Promise<ApiResponse> {
  const formData = new FormData()
  formData.append("api", API_KEY)
  formData.append("requestID", requestID)

  console.log("[v0] Transaction verification initiated")
  return makeApiRequest("/api/verify/", "POST", formData)
}

export async function generateRechargePins(data: {
  network: string
  value: string
  number: string
}): Promise<any> {
  const formData = new FormData()
  formData.append("network", data.network)
  formData.append("value", data.value)
  formData.append("number", data.number)

  return makeApiRequest("/apiV2/generate/", "POST", formData)
}
