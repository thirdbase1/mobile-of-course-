'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SuccessOverlay } from '@/components/success-overlay';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { ProcessingOverlay } from '@/components/processing-overlay';
import { ArrowLeft } from 'lucide-react';
import { payElectricity } from '@/lib/actions/electricity';
import { getWalletBalance } from '@/lib/actions/wallet';

const DISCOS = [
  'Abuja Electricity Distribution Company',
  'Benin Electricity Distribution Company',
  'Eko Electricity Distribution Company',
  'Enugu Electricity Distribution Company',
  'Ibadan Electricity Distribution Company',
  'Ikeja Electricity Distribution Company',
  'Jos Electricity Distribution Company',
  'Kaduna Electricity Distribution Company',
  'Kano Electricity Distribution Company',
  'Port Harcourt Electricity Distribution Company',
  'Yola Electricity Distribution Company',
  'Bauchi Electricity Distribution Company',
];

export default function ElectricityPage() {
  const router = useRouter();
  const [disco, setDisco] = useState('');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNumber, setMeterNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successToken, setSuccessToken] = useState<string | null>(null);
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
    const loadBalance = async () => {
      try {
        const walletBalance = await getWalletBalance();
        setBalance(walletBalance?.balance || 0);
      } catch (err) {
        setError('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    loadBalance();
  }, []);

  const canSubmit =
    disco &&
    meterNumber &&
    phone &&
    amount &&
    parseInt(amount) >= 1000 &&
    balance &&
    balance >= parseInt(amount);

  const handleContinue = () => {
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('disco', disco);
      formData.append('meterType', meterType);
      formData.append('meterNumber', meterNumber);
      formData.append('amount', amount);
      formData.append('phone', phone);
      
      const result = await payElectricity(formData);
      if (result?.token) {
        setSuccessToken(result.token);
      }
      setShowSuccess(true);
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
        title="Electricity token generated"
        subtitle={successToken ? `Token: ${successToken}` : 'Payment successful'}
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
          <h1 className="text-xl font-semibold">Buy Electricity</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* DISCO Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Distribution Company</label>
          <Select value={disco} onValueChange={setDisco}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Select DISCO" />
            </SelectTrigger>
            <SelectContent>
              {DISCOS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meter Type Tabs */}
        <div className="flex gap-2 mb-6">
          {(['prepaid', 'postpaid'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMeterType(type)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
                meterType === type
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Meter Number */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Meter Number</label>
          <Input
            value={meterNumber}
            onChange={(e) => setMeterNumber(e.target.value)}
            placeholder="Enter meter number"
            className="h-12 rounded-2xl"
          />
        </div>

        {/* Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Amount (min ₦1,000)</label>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            placeholder="Enter amount"
            className="h-12 rounded-2xl"
          />
        </div>

        {/* Phone */}
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
          className="w-full h-12 rounded-2xl"
        >
          Continue
        </Button>

        {/* Confirmation Sheet */}
        <ConfirmSheet
          show={showConfirm}
          title="Confirm Electricity Payment"
          page="electricity"
          details={[
            { label: 'DISCO', value: disco.split(' ')[0] },
            { label: 'Amount', value: `₦${parseInt(amount).toLocaleString()}` },
            { label: 'Meter Type', value: meterType },
            { label: 'Balance After', value: `₦${(balance! - parseInt(amount)).toLocaleString()}` },
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
