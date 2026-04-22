import { ArrowLeft } from 'lucide-react'
import { getTransactions } from '@/lib/actions/wallet'
import { TransactionList } from '@/components/transaction-list'

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'AIRTIME', label: 'Airtime' },
  { id: 'DATA', label: 'Data' },
  { id: 'CABLE', label: 'Cable' },
  { id: 'ELECTRICITY', label: 'Electricity' },
  { id: 'WALLET_FUND', label: 'Wallet' },
]

export const revalidate = 0

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  // In Next.js 16, searchParams is a Promise and must be awaited
  const params = await searchParams
  const filter = params?.filter || 'all'

  const { transactions } = await getTransactions()

  // Filter transactions based on the category
  const filteredTxs =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.category === filter)

  return (
    <div className="min-h-screen bg-background overflow-y-auto flex flex-col">
      <div className="w-full flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 pb-20 md:pb-8">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 pb-4 pt-4 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4 border-b border-muted-foreground/5">
          <div className="flex items-center gap-3 mb-6">
            <a href="/dashboard" className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <h1 className="text-2xl font-bold">Transactions</h1>
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FILTER_TABS.map((tab) => (
              <a
                key={tab.id}
                href={`/dashboard/transactions${tab.id === 'all' ? '' : `?filter=${tab.id}`}`}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.id
                    ? 'bg-primary text-white'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <TransactionList transactions={filteredTxs} />
      </div>
    </div>
  )
}
