"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { getWalletBalance } from "@/lib/actions/wallet"
import { getRecentPhones, saveRecentPhone } from "@/lib/actions/recent-phones"
import { ConfirmSheet } from "@/components/confirm-sheet"
import { SuccessOverlay } from "@/components/success-overlay"
import { ProcessingOverlay } from "@/components/processing-overlay"
import { NetworkLogo } from "@/lib/utils/network-logo"

const networks = [
  { name: "MTN", types: [{ value: "mtn_sme", label: "SME Data" }, { value: "mtn_datashare", label: "Data Share" }, { value: "mtn_gifting", label: "Gifting" }, { value: "mtn_awoof", label: "AWOOF" }] },
  { name: "Glo", types: [{ value: "glo_data", label: "Glo Data" }, { value: "glo_sme", label: "SME Data" }] },
  { name: "Airtel", types: [{ value: "airtel_sme", label: "SME Data" }, { value: "airtel_gifting", label: "Gifting" }] },
  { name: "9mobile", types: [{ value: "etisalat_data", label: "9mobile Data" }] },
]

export default function DataPage() {
  const router = useRouter()
  const [network, setNetwork] = useState("MTN")
  const [planType, setPlanType] = useState("")
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [phone, setPhone] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [error, setError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recentPhones, setRecentPhones] = useState<string[]>([])
  const [successData, setSuccessData] = useState<{
    phone: string
    plan: string
    amount: number
    balanceBefore: number
    balanceAfter: number
    transactionId: string
    network: string
  } | null>(null)
  const [processing, setProcessing] = useState(false)

  const currentNetwork = networks.find((n) => n.name === network)

  useEffect(() => {
    const loadData = async () => {
      const res = await getWalletBalance()
      setBalance(res.balance)
      
      // Load recent phones from Supabase
      const recentRes = await getRecentPhones()
      setRecentPhones(recentRes.phones || [])
    }
    
    loadData()
  }, [])

  const handleContactsPicker = async () => {
    try {
      if (!navigator.contacts) {
        setError("Contact access not supported on this browser")
        return
      }
      
      const contacts = await navigator.contacts.select(['tel'], { multiple: false })
      if (contacts && contacts.length > 0) {
        let tel = contacts[0].tel?.[0] || ""
        // Remove all non-numeric characters
        tel = tel.replace(/\D/g, "")
        
        // Handle Nigerian numbers: +234 or 234 prefix -> convert to 0
        if (tel.startsWith("234")) {
          tel = "0" + tel.slice(3)
        }
        
        // Ensure we have exactly 11 digits starting with 0
        if (tel.length > 11) {
          tel = tel.slice(-11)
        }
        
        if (tel.length === 11 && tel.startsWith("0")) {
          setPhone(tel)
        }
      }
    } catch {
      // User cancelled or error occurred, do nothing
    }
  }

  useEffect(() => {
    setPlanType("")
    setPlans([])
    setSelectedPlan(null)
  }, [network])

  useEffect(() => {
    if (planType) {
      setLoadingPlans(true)
      setPlans([])
      setSelectedPlan(null)
      
      // Call API route with rate limiting
      fetch('/api/gsubz/data/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceID: planType })
      })
        .then(res => {
          if (res.status === 429) {
            throw new Error('Too many requests. Maximum 10 requests per minute. Please wait before trying again.')
          }
          return res.json()
        })
        .then((res) => {
          if (res.success && res.plans && res.plans.length > 0) {
            setPlans(res.plans)
          } else if (res.success === false) {
            setError(res.error || res.message || "Failed to load plans for this option. It may no longer be available.")
            setPlans([])
          }
        })
        .catch((err) => {
          setError(err.message || "Failed to load plans. Please try another option.")
          setPlans([])
          console.error("[v0] Error fetching plans:", err)
        })
        .finally(() => setLoadingPlans(false))
    }
  }, [planType])

  useEffect(() => {
    // Auto-select plan type if only one is available
    if (currentNetwork && currentNetwork.types.length === 1 && !planType) {
      setPlanType(currentNetwork.types[0].value)
    }
  }, [currentNetwork])

  const planPrice = selectedPlan ? Number(selectedPlan.price) : 0
  const isValid = phone.length === 11 && planType && selectedPlan && planPrice <= balance

  const handleContinue = () => {
    setError("")
    if (phone.length !== 11) {
      setError("Please enter a valid 11-digit phone number")
      return
    }
    if (!selectedPlan) {
      setError("Please select a data plan")
      return
    }
    if (planPrice > balance) {
      setError("Insufficient wallet balance")
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setProcessing(true)
    setLoading(true)
    const balanceBefore = balance
    const currentPhone = phone
    const currentPlan = selectedPlan?.displayName || ''
    const currentAmount = planPrice
    const currentNetwork = network
    
    const formData = new FormData()
    formData.append("serviceID", planType)
    formData.append("plan", selectedPlan.value)
    formData.append("phone", phone)
    formData.append("amount", currentAmount.toString())
    formData.append("planDisplayName", selectedPlan.displayName || '')

    try {
      const res = await fetch('/api/gsubz/data/purchase', {
        method: 'POST',
        body: formData
      })

      if (res.status === 429) {
        setError('Too many purchase requests. Maximum 5 per minute. Please wait before trying again.')
        setShowConfirm(false)
        setProcessing(false)
        setLoading(false)
        return
      }

      const data = await res.json()
      setResult(data)
      setShowConfirm(false)

      if (data.success) {
        const newBal = await getWalletBalance()
        // Save phone to Supabase
        await saveRecentPhone(currentPhone)
        // Reload recent phones
        const recentRes = await getRecentPhones()
        setRecentPhones(recentRes.phones || [])
        
        setSuccessData({
          phone: currentPhone,
          plan: currentPlan,
          amount: currentAmount,
          balanceBefore: balanceBefore,
          balanceAfter: newBal.balance,
          transactionId: data.transaction?.id?.toString() || data.transaction?.transactionID?.toString() || '',
          network: currentNetwork
        })
        setShowSuccess(true)
        setPhone("")
        setSelectedPlan(null)
        setBalance(newBal.balance)
      } else {
        setError(data.error || data.message || "Transaction failed. Please try again.")
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setProcessing(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] overflow-y-auto flex flex-col">
      {/* Top Bar */}
      <div className="topbar">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--text-1)" }} />
          <span className="topbar-title">Buy Data</span>
        </Link>
      </div>

      <div className="flex-1 px-4 overflow-y-auto flex flex-col">
        {/* Network Tabs */}
        <div className="network-tabs">
          {networks.map((n) => (
            <button key={n.name} className={`net-tab ${network === n.name ? "active" : ""}`} onClick={() => setNetwork(n.name)}>
              <NetworkLogo network={n.name} size="tab" active={network === n.name} page="data" />
              <span>{n.name}</span>
            </button>
          ))}
        </div>

        {/* Plan Type */}
        {currentNetwork && currentNetwork.types.length > 1 && (
          <div className="form-group">
            <label className="form-label">Plan Type</label>
            <select
              className="form-input"
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              style={{ appearance: "auto" }}
            >
              <option value="">Select plan type</option>
              {currentNetwork.types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Phone Input */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-2">
            <label className="form-label">Phone Number</label>
            <button
              onClick={handleContactsPicker}
              className="text-[12px] font-bold text-[#1a56db] bg-none border-none cursor-pointer"
            >
              Contacts
            </button>
          </div>
          <input
            type="tel"
            className="form-input"
            placeholder="08012345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
            maxLength={11}
          />
          
          {/* Recent Numbers */}
          {recentPhones.length > 0 && (
            <div className="mt-3">
              <label className="text-[12px] text-[var(--text-3)] font-medium mb-2 block">Recent</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recentPhones.map((num) => (
                  <button
                    key={num}
                    onClick={() => setPhone(num)}
                    className="px-[14px] py-[8px] rounded-full text-[13px] font-semibold text-[#475569] cursor-pointer whitespace-nowrap flex-shrink-0"
                    style={{
                      backgroundColor: "#f4f6fb",
                      border: "1.5px solid #e2e8f0"
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Plans Dropdown */}
        <div className="form-group">
          <label className="form-label">Select Plan</label>
          {loadingPlans ? (
            <div className="form-input flex items-center bg-muted text-text-3">
              Loading plans...
            </div>
          ) : plans.length > 0 ? (
            <select
              className="form-input"
              value={selectedPlan?.value || ""}
              onChange={(e) => {
                const plan = plans.find(p => p.value === e.target.value)
                setSelectedPlan(plan || null)
              }}
              style={{ appearance: "auto" }}
            >
              <option value="">Select a plan</option>
              {plans.map((plan) => (
                <option key={plan.value} value={plan.value}>
                  {plan.displayName} - ₦{Number(plan.price).toLocaleString()}
                </option>
              ))}
            </select>
          ) : planType ? (
            <div className="form-input flex items-center text-[var(--text-3)]">
              No plans available
            </div>
          ) : (
            <div className="form-input flex items-center text-[var(--text-3)]">
              Select a plan type first
            </div>
          )}
        </div>

        {/* Error */}
        {error && <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-sm text-[#dc2626] mb-4">{error}</div>}

        {/* Summary */}
        <div className="bg-[var(--surface)] rounded-[20px] border border-[var(--border)] p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-3)]">Amount</span>
            <span className="font-semibold text-[var(--text-1)]">₦{planPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-3)]">Wallet Balance</span>
            <span className={`font-semibold ${planPrice > balance ? "text-[var(--error)]" : "text-[var(--text-1)]"}`}>
              ₦{balance.toLocaleString()}
            </span>
          </div>
        </div>

        <button onClick={handleContinue} disabled={!isValid} className="btn-primary">
          Continue
        </button>
      </div>

      {/* Confirmation Sheet */}
      <ConfirmSheet
        show={showConfirm}
        title="Confirm Data Purchase"
        network={network}
        page="data"
        details={[
          { label: "Plan", value: selectedPlan?.displayName || "" },
          { label: "Phone", value: phone },
          { label: "Amount", value: `₦${planPrice.toLocaleString()}` },
          { label: "Balance After", value: `₦${(balance - planPrice).toLocaleString()}` },
        ]}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={loading}
      />

      {/* Success Overlay */}
      <SuccessOverlay
        show={showSuccess}
        title="Purchase Successful!"
        subtitle={`Your ${successData?.network || network} data has been delivered.`}
        network={successData?.network || network}
        page="data"
        onDone={() => {
          setShowSuccess(false)
          setSuccessData(null)
          router.push("/dashboard")
        }}
      />

      {/* Processing Overlay */}
      <ProcessingOverlay isVisible={processing} />
    </div>
  )
}
