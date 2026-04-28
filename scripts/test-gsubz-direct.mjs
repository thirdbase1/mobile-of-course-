import fetch from 'node-fetch'
import FormData from 'form-data'

const API_KEY = "ap_83c2ee17ca19e2c34e29a0f17cd5bd89" // From your documentation
const API_BASE_URL = "https://gsubz.com"

console.log("[TEST] Testing Gsubz API directly...")
console.log("[TEST] API Key:", API_KEY.slice(0, 10) + "...")
console.log("[TEST] Endpoint: " + API_BASE_URL + "/apiV2/generate/")

async function testGsubzAPI() {
  try {
    const formData = new FormData()
    formData.append("network", "airtel")
    formData.append("value", "500")
    formData.append("number", "1")

    console.log("\n[TEST] Making request with:")
    console.log("[TEST] - network: airtel")
    console.log("[TEST] - value: 500")
    console.log("[TEST] - number: 1")

    const response = await fetch(`${API_BASE_URL}/apiV2/generate/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: formData,
    })

    console.log("\n[TEST] Response Status:", response.status)
    console.log("[TEST] Response Headers:", Object.fromEntries(response.headers))

    const data = await response.json()
    console.log("\n[TEST] Response Body:")
    console.log(JSON.stringify(data, null, 2))

    if (data.status === "success") {
      console.log("\n✅ SUCCESS! Pins generated:")
      data.pins?.forEach((pin, i) => {
        console.log(`  ${i + 1}. ${pin.pin}`)
      })
    } else {
      console.log("\n❌ ERROR:", data.message || data.error || "Unknown error")
    }
  } catch (error) {
    console.error("[TEST] FATAL ERROR:", error.message)
  }
}

testGsubzAPI()
