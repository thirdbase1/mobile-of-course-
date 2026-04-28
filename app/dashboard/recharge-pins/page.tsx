'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { SuccessOverlay } from '@/components/success-overlay';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { ProcessingOverlay } from '@/components/processing-overlay';
import { generateRechargePins } from '@/lib/actions/recharge-pins';
import { getWalletBalance } from '@/lib/actions/wallet';
import { NetworkLogo } from '@/lib/utils/network-logo'

const NETWORKS = [
  { id: 'mtn', name: 'MTN', displayName: 'MTN' },
  { id: 'glo', name: 'Glo', displayName: 'Glo' },
  { id: 'airtel', name: 'Airtel', displayName: 'Airtel' },
  { id: '9mobile', name: '9mobile', displayName: '9mobile' },
];

const PIN_VALUES = [
  { value: 100, quantity: 50 },
  { value: 200, quantity: 25 },
  { value: 400, quantity: 15 },
  { value: 500, quantity: 10 },
];

export default function RechargePinsPage() {
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPins, setSuccessPins] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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
        const walletData = await getWalletBalance();
        setBalance(walletData?.balance || 0);
      } catch (err) {
        setError('Failed to load wallet');
      } finally {
        setLoading(false);
      }
    };
    loadBalance();
  }, []);

  const selectedNetworkName = NETWORKS.find(n => n.id === selectedNetwork)?.displayName || '';
  const totalCost = selectedValue ? selectedValue * parseInt(quantity || '1') : 0;
  const canSubmit = selectedValue && quantity && balance && balance >= totalCost;

  const handleContinue = () => {
    if (!canSubmit) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setProcessing(true);
    setSubmitting(true);
    try {
      const result = await generateRechargePins({
        network: selectedNetwork,
        value: String(selectedValue),
        number: quantity,
      });
      
      if (result.success) {
        setSuccessPins(result.pins || []);
        setShowSuccess(true);
      } else {
        setError(result.error || 'Failed to generate pins');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate pins');
    } finally {
      setProcessing(false);
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleCopyPin = (pin: string, index: number) => {
    navigator.clipboard.writeText(pin);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto flex flex-col">
        <div className="w-full flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 flex flex-col">
          <SuccessOverlay
            show={showSuccess}
            title="Recharge pins generated"
            subtitle={`${successPins.length} pins generated successfully`}
            onDone={() => {
              setShowSuccess(false);
              router.push('/dashboard');
            }}
          />

          {/* Pins List */}
          <div className="mt-6 space-y-2">
            {successPins.map((pin, i) => (
              <div key={i} className="p-4 bg-muted rounded-xl flex justify-between items-center">
                <code className="font-mono text-sm">{pin}</code>
                <button
                  onClick={() => handleCopyPin(pin, i)}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  {copiedIndex === i ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto flex flex-col">
      <div className="w-full flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 pb-4 pt-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold">Recharge Pins</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Network Selection with Icons */}
        <div className="mb-8">
          <label className="block text-sm font-medium mb-4">Select Network</label>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={`flex flex-col items-center gap-2 pb-3 px-2 rounded-lg transition-all ${
                  selectedNetwork === network.id
                    ? 'border-b-2 border-primary'
                    : 'border-b-2 border-transparent'
                }`}
              >
                <NetworkLogo network={network.displayName} size="tab" page="airtime" />
              </button>
            ))}
          </div>
        </div>

        {/* Pin Values Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Pin Value</label>
          <Select value={selectedValue?.toString() || ""} onValueChange={(val) => setSelectedValue(Number(val))}>
            <SelectTrigger className="h-12 rounded-2xl">
              <SelectValue placeholder="Select pin value" />
            </SelectTrigger>
            <SelectContent>
              {PIN_VALUES.map((pin) => (
                <SelectItem key={`pin-${pin.value}`} value={pin.value.toString()}>
                  ₦{pin.value.toString()} (Max {pin.quantity.toString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Quantity</label>
          <Input
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            type="number"
            min="1"
            placeholder="1"
            className="h-12 rounded-2xl"
          />
        </div>

        {/* Total Cost */}
        {selectedValue && (
          <div className="mb-6 p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
            <p className="text-2xl font-semibold">₦{totalCost.toLocaleString()}</p>
          </div>
        )}

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={!canSubmit || loading}
          className="w-full h-12 rounded-2xl"
        >
          Continue
        </Button>

        {/* Confirmation Sheet */}
        <ConfirmSheet
          show={showConfirm}
          title="Confirm Recharge Pins Purchase"
          page="recharge-pins"
          details={[
            { label: 'Network', value: selectedNetworkName },
            { label: 'Value', value: `₦${selectedValue}` },
            { label: 'Quantity', value },
            { label: 'Total', value: `₦${totalCost.toLocaleString()}` },
            { label: 'Balance After', value: `₦${(balance! - totalCost).toLocaleString()}` },
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
