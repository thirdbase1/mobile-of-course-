"use server"

import { unstable_cache } from "next/cache"

const API_BASE_URL = "https://gsubz.com"
const API_PLANS_URL = "https://gsubz.com"
const API_KEY = process.env.GSUBZ_API_KEY || ""

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
  }

  if (body && method === "POST") {
    options.body = body
  }

  console.log(`[v0] API Request: ${API_BASE_URL}${endpoint}`)
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
  const data = await response.json()

  console.log(`[v0] API Response:`, JSON.stringify(data, null, 2))

  return data
}

// Uncached function to fetch data plans from API
async function _fetchDataPlansFromAPI(serviceId: string): Promise<PlanResponse> {
  try {
    console.log("[v0] _fetchDataPlansFromAPI: Fetching plans for:", serviceId)

    const response = await fetch(`${API_PLANS_URL}/api/plans?service=${serviceId}`, {
      redirect: "follow",
      cache: "no-store",
    })

    console.log("[v0] Response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Error fetching plans:", `API returned status ${response.status}`)
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] _fetchDataPlansFromAPI: Raw response:", JSON.stringify(data, null, 2))
    console.log("[v0] _fetchDataPlansFromAPI: Plans count:", data.plans?.length)
    console.log("[v0] _fetchDataPlansFromAPI: Entire response keys:", Object.keys(data))
    
    // Make sure we're returning the correct structure
    if (!data.plans) {
      console.warn("[v0] WARNING: No plans array in response for", serviceId)
    }
    
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
    console.log("[v0] _fetchCablePlansFromAPI: Fetching cable plans for:", service)

    const response = await fetch(`${API_PLANS_URL}/api/plans?service=${service}`, {
      redirect: "follow",
      cache: "no-store",
    })

    console.log("[v0] Cable Response status:", response.status)

    if (!response.ok) {
      console.error("[v0] Error fetching cable plans:", `API returned status ${response.status}`)
      throw new Error(`API returned status ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] _fetchCablePlansFromAPI: Raw response:", JSON.stringify(data, null, 2))
    console.log("[v0] _fetchCablePlansFromAPI: Response keys:", Object.keys(data))
    console.log("[v0] _fetchCablePlansFromAPI: list count:", data.list?.length)

    // Transform the response to match expected format
    // API returns: { list: [...], plan_name: 'variation_code', ... }
    // We need: { plans: [...], PlanName: 'plan', ... }
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
      console.log("[v0] _fetchCablePlansFromAPI: Transformed to plans count:", transformed.plans.length)
      return transformed
    }

    console.log("[v0] _fetchCablePlansFromAPI: No list found, returning data as-is")
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

  console.log("[v0] Cable subscription request data:", {
    serviceID: data.serviceID,
    plan: data.plan,
    phone: data.phone,
    customerID: data.customerID,
    requestID: data.requestID,
  })

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

  console.log("[v0] Verifying transaction:", requestID)
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
