'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PricingRuleFormProps {
  network: string
  onRuleAdded: () => void
}

const serviceTypes = {
  mtn: ['Data', 'Airtime'],
  airtel: ['Data', 'Airtime'],
  glo: ['Data', 'Airtime'],
  etisalat: ['Data', 'Airtime'],
  cable: ['DSTV', 'GOtv', 'StarTimes'],
  electricity: ['EKEDC', 'IKEDC', 'KEDCO'],
}

export function PricingRuleForm({ network, onRuleAdded }: PricingRuleFormProps) {
  const [serviceType, setServiceType] = useState('')
  const [ruleType, setRuleType] = useState('PERCENT')
  const [value, setValue] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!serviceType) {
        setError('Please select a service type')
        return
      }

      if (!value || parseFloat(value) < 0) {
        setError('Please enter a valid value')
        return
      }

      const { error: insertError } = await supabase.from('pricing_rules').insert({
        network,
        service_type: serviceType,
        rule_type: ruleType,
        value: parseFloat(value),
        min_amount: minAmount ? parseFloat(minAmount) : null,
        max_amount: maxAmount ? parseFloat(maxAmount) : null,
        is_active: true,
      })

      if (insertError) {
        setError(insertError.message)
      } else {
        setServiceType('')
        setValue('')
        setMinAmount('')
        setMaxAmount('')
        onRuleAdded()
      }
    } finally {
      setLoading(false)
    }
  }

  const services = serviceTypes[network as keyof typeof serviceTypes] || []

  return (
    <form onSubmit={handleSubmit} className="pricing-form">
      <div className="form-group">
        <label htmlFor="service">Service Type</label>
        <Select value={serviceType} onValueChange={setServiceType}>
          <SelectTrigger>
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service} value={service.toLowerCase()}>
                {service}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="form-group">
        <label htmlFor="ruleType">Rule Type</label>
        <Select value={ruleType} onValueChange={setRuleType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIXED">Fixed Amount (₦)</SelectItem>
            <SelectItem value="PERCENT">Percentage (%)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="form-group">
        <label htmlFor="value">
          Value {ruleType === 'PERCENT' ? '(%)' : '(₦)'}
        </label>
        <Input
          id="value"
          type="number"
          placeholder="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          step="0.01"
        />
      </div>

      <div className="form-group">
        <label htmlFor="minAmount">Min Amount (₦) - Optional</label>
        <Input
          id="minAmount"
          type="number"
          placeholder="0"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          step="0.01"
        />
      </div>

      <div className="form-group">
        <label htmlFor="maxAmount">Max Amount (₦) - Optional</label>
        <Input
          id="maxAmount"
          type="number"
          placeholder="999999"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          step="0.01"
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Rule'}
      </Button>
    </form>
  )
}
