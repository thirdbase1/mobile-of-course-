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

const networks = ["MTN", "Glo", "Airtel", "9mobile"]

export default function AirtimePage() {
  const router = useRouter()
  const [network, setNetwork] = useState("MTN")
  const [phone, setPhone] = useState("")
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recentPhones, setRecentPhones] = useState<string[]>([])
  const [successData, setSuccessData] = useState<{
    phone: string
    amount: number
    balanceBefore: number
    balanceAfter: number
    transactionId: string
    network: string
  } | null>(null)
  const [processing, setProcessing] = useState(false)

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

  const amountNum = Number(amount) || 0
  const isValid = phone.length === 11 && amountNum >= 100 && amountNum <= 50000 && amountNum <= balance && amount !== ""
  const amountError = amountNum > 0 && amountNum < 100 ? "Minimum airtime amount is ₦100" : ""

  const handleContinue = () => {
    setError("")
    if (phone.length !== 11) {
      setError("Please enter a valid 11-digit phone number")
      return
    }
    if (amountNum < 100) {
      setError("Minimum airtime amount is ₦100")
      return
    }
    if (amountNum > 50000) {
      setError("Maximum amount is ₦50,000")
      return
    }
    if (amountNum > balance) {
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
    const currentAmount = amountNum
    const currentNetwork = network
    
    const formData = new FormData()
    formData.append("network", network.toLowerCase())
    formData.append("phone", phone)
    formData.append("amount", amount)

    try {
      const res = await fetch('/api/gsubz/airtime/purchase', {
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
          amount: currentAmount,
          balanceBefore: balanceBefore,
          balanceAfter: newBal.balance,
          transactionId: data.transaction?.id?.toString() || data.transaction?.transactionID?.toString() || '',
          network: currentNetwork
        })
        setShowSuccess(true)
        setPhone("")
        setAmount("")
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
      {/* Top Bar - Already sticky via topbar class */}
      <div className="topbar">
        <Link href="/dashboard" className="flex items-center gap-2">
          <ArrowLeft style={{ width: 18, height: 18, color: "var(--text-1)" }} />
          <span className="topbar-title">Buy Airtime</span>
        </Link>
      </div>

      <div className="flex-1 px-4 overflow-y-auto flex flex-col">
        {/* Network Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {networks.map((n) => (
            <button key={n} className={`net-tab ${network === n ? "active" : ""}`} onClick={() => setNetwork(n)}>
              <NetworkLogo network={n} size="tab" active={network === n} page="airtime" />
              <span>{n}</span>
            </button>
          ))}
        </div>

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

        {/* Amount Input */}
        <div className="form-group">
          <label className="form-label">Amount</label>
          <input
            type="number"
            className="form-input"
            placeholder="₦100 - ₦50,000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={100}
            max={50000}
            onBlur={() => {
              if (amountNum > 0 && amountNum < 100) {
                setError("Minimum airtime amount is ₦100")
              }
            }}
          />
          {amountError && <p className="text-[11px] text-[var(--error)] mt-1">{amountError}</p>}
        </div>

        {/* Error */}
        {error && <div className="p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-sm text-[#dc2626] mb-4">{error}</div>}

        {/* Summary */}
        <div className="bg-[var(--surface)] rounded-[20px] border border-[var(--border)] p-4 mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--text-3)]">Amount</span>
            <span className="font-semibold text-[var(--text-1)]">₦{amountNum.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--text-3)]">Wallet Balance</span>
            <span className={`font-semibold ${amountNum > balance ? "text-[var(--error)]" : "text-[var(--text-1)]"}`}>
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
        title="Confirm Airtime Purchase"
        network={network}
        page="airtime"
        details={[
          { label: "Phone", value: phone },
          { label: "Amount", value: `₦${amountNum.toLocaleString()}` },
          { label: "Balance After", value: `₦${(balance - amountNum).toLocaleString()}` },
        ]}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirm(false)}
        loading={loading}
      />

      {/* Success Overlay */}
      <SuccessOverlay
        show={showSuccess}
        title="Purchase Successful!"
        subtitle={`Your ${successData?.network || network} airtime has been delivered.`}
        network={successData?.network || network}
        page="airtime"
        onDone={() => {
          setShowSuccess(false)
          setSuccessData(null)
        }}
      />

      {/* Processing Overlay */}
      <ProcessingOverlay isVisible={processing} />
    </div>
  )
}
