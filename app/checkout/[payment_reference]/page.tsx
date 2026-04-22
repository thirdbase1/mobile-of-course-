import { notFound } from 'next/navigation'
import { getTransaction, cancelTransaction, verifyAndCreditPayment } from '@/lib/actions/transactions'
import { CheckoutClient } from './checkout-client'

interface CheckoutPageProps {
  params: Promise<{ payment_reference: string }>
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { payment_reference } = await params
  return {
    title: `Payment - ${payment_reference}`,
    description: 'Complete your payment securely with Monnify',
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { payment_reference } = await params

  // Fetch transaction from DB (server-side)
  const result = await getTransaction(payment_reference)

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Payment Not Found</h1>
          <p className="text-foreground/60 mb-6">This payment does not exist or has expired.</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    )
  }

  const transaction = result.data

  return (
    <CheckoutClient
      paymentReference={payment_reference}
      transaction={transaction}
      onCancel={cancelTransaction}
      onVerify={verifyAndCreditPayment}
    />
  )
}
