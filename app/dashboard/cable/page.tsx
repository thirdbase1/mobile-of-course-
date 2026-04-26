'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SuccessOverlay } from '@/components/success-overlay';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { ProcessingOverlay } from '@/components/processing-overlay';
import { ArrowLeft } from 'lucide-react';
import { getWalletBalance } from '@/lib/actions/wallet';

const PROVIDERS = [
  { id: 'dstv', name: 'DStv' },
  { id: 'gotv', name: 'GOtv' },
  { id: 'startimes', name: 'Startimes' },
];

export default function CablePage() {
  const router = useRouter();
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0].id);
  const [smartcard, setSmartcard] = useState('');
  const [phone, setPhone] = useState('');
  const [packagePlan, setPackagePlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Handle modal-open class for body when confirm sheet is open
  useEffect(() => {
    if (showConfirm || showSuccess) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [showConfirm, showSuccess])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch cable plans from API route with rate limiting
        const plansRes = await fetch('/api/gsubz/cable/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: selectedProvider })
        })

        if (plansRes.status === 429) {
          setError('Too many requests. Maximum 10 per minute. Please wait before trying again.')
          setPlans([])
        } else {
          const plansData = await plansRes.json()
          setPlans(plansData?.plans || [])
        }

        // Get wallet balance
        const walletData = await getWalletBalance()
        setBalance(walletData?.balance || 0)
      } catch (err) {
        setError('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedProvider])

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    setPackagePlan(null);
    setSmartcard('');
    setLoading(true);
  };

  const selectedPlanData = plans.find((p) => p.value === packagePlan);
  const canSubmit = smartcard && phone && packagePlan && balance && balance >= (selectedPlanData?.price || 0);

  const handleContinue = () => {
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('provider', selectedProvider);
      formData.append('package', packagePlan);
      formData.append('packageDisplayName', selectedPlanData?.displayName || '');
      formData.append('smartcard', smartcard);
      formData.append('phone', phone);

      const res = await fetch('/api/gsubz/cable/subscribe', {
        method: 'POST',
        body: formData
      })

      if (res.status === 429) {
        setError('Too many subscription requests. Maximum 5 per minute. Please wait before trying again.')
        setShowConfirm(false)
        setProcessing(false)
        setSubmitting(false)
        return
      }

      const result = await res.json()
      
      if (result.success) {
        setShowSuccess(true);
      } else {
        setError(result.error || result.message || 'Transaction failed');
      }
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setProcessing(false);
      setSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <SuccessOverlay
        show={showSuccess}
        title="Cable subscription successful"
        subtitle={`₦${selectedPlanData?.price.toLocaleString()} deducted from your wallet`}
        onDone={() => {
          setShowSuccess(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto flex flex-col">
      <div className="w-full flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Buy Cable</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Provider Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => handleProviderChange(provider.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedProvider === provider.id
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              {provider.name}
            </button>
          ))}
        </div>

        {/* Smartcard Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Smartcard Number</label>
          <Input
            value={smartcard}
            onChange={(e) => setSmartcard(e.target.value)}
            placeholder="Enter smartcard number"
            className="h-12 rounded-2xl"
          />
        </div>

        {/* Plans Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Plan</label>
          {loading ? (
            <div className="h-12 bg-muted rounded-2xl animate-pulse" />
          ) : (
            <Select value={packagePlan || ""} onValueChange={setPackagePlan}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.value} value={plan.value}>
                    {plan.displayName} - ₦{plan.price.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Phone Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08012345678"
            className="h-12 rounded-2xl"
          />
        </div>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!canSubmit}
          className="w-full h-12 rounded-2xl mb-4"
        >
          Continue
        </Button>

        {/* Confirmation Sheet */}
        <ConfirmSheet
          show={showConfirm}
          title="Confirm Cable Subscription"
          page="cable"
          details={[
            { label: 'Provider', value: selectedProvider.toUpperCase() },
            { label: 'Plan', value: selectedPlanData?.displayName || '' },
            { label: 'Amount', value: `₦${selectedPlanData?.price.toLocaleString()}` },
            { label: 'Balance After', value: `₦${(balance! - (selectedPlanData?.price || 0)).toLocaleString()}` },
          ]}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
        
        {/* Processing Overlay */}
        <ProcessingOverlay isVisible={processing} />
      </div>
    </div>
  );
}
