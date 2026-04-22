"use client"

import Link from "next/link"
import { Smartphone, Wifi, Tv, Zap, ArrowDownLeft, ReceiptText } from "lucide-react"

interface Transaction {
  id: string
  description?: string
  phone: string
  amount: number
  status: string
  created_at: string
  category?: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

function getServiceIcon(category: string) {
  const cat = category?.toUpperCase() || ""

  if (cat === "AIRTIME") {
    return Smartphone
  }
  if (cat === "DATA") {
    return Wifi
  }
  if (cat === "CABLE") {
    return Tv
  }
  if (cat === "ELECTRICITY") {
    return Zap
  }
  if (cat === "WALLET_FUND") {
    return ArrowDownLeft
  }
  return ReceiptText
}

function getIconBackground(category: string, status: string): string {
  const upper = category?.toUpperCase() || '';
  const isSuccess = status?.toUpperCase() === 'SUCCESS';
  
  if (!isSuccess) return 'bg-red-100';
  
  if (upper === 'AIRTIME') return 'bg-orange-100';
  if (upper === 'DATA') return 'bg-blue-100';
  if (upper === 'CABLE') return 'bg-purple-100';
  if (upper === 'ELECTRICITY') return 'bg-amber-100';
  if (upper === 'WALLET_FUND') return 'bg-green-100';
  return 'bg-gray-100';
}

function getIconColor(category: string, status: string): string {
  const upper = category?.toUpperCase() || '';
  const isSuccess = status?.toUpperCase() === 'SUCCESS';
  
  if (!isSuccess) return 'text-red-600';
  
  if (upper === 'AIRTIME') return 'text-orange-600';
  if (upper === 'DATA') return 'text-blue-600';
  if (upper === 'CABLE') return 'text-purple-600';
  if (upper === 'ELECTRICITY') return 'text-amber-600';
  if (upper === 'WALLET_FUND') return 'text-green-600';
  return 'text-gray-600';
}

function getServiceName(category: string, description: string): string {
  const upper = category?.toUpperCase() || '';
  
  if (upper === 'AIRTIME') {
    const match = description?.match(/(\w+)\s+Airtime/);
    return match ? `${match[1]} Airtime` : 'Airtime';
  }
  if (upper === 'DATA') {
    const match = description?.match(/(\w+)\s+Data/);
    return match ? `${match[1]} Data` : 'Data';
  }
  if (upper === 'CABLE') {
    const match = description?.match(/(\w+)\s+Cable/);
    return match ? `${match[1]} TV` : 'Cable TV';
  }
  if (upper === 'ELECTRICITY') {
    return 'Electricity';
  }
  if (upper === 'WALLET_FUND') {
    return 'Wallet Funded';
  }
  return description || 'Transaction';
}

function getSubtitle(category: string, phone: string): string {
  const upper = category?.toUpperCase() || '';
  
  if (upper === 'WALLET_FUND') {
    return 'Bank Transfer';
  }
  return phone || 'No recipient';
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-muted rounded-xl border border-border">
        <div className="text-center py-8 px-4">
          <ReceiptText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-medium">No transactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => {
        const Icon = getServiceIcon(tx.category)
        const isSuccess = tx.status?.toUpperCase() === 'SUCCESS';
        const bgColor = getIconBackground(tx.category, tx.status);
        const iconColor = getIconColor(tx.category, tx.status);
        const serviceName = getServiceName(tx.category, tx.description);
        const subtitle = getSubtitle(tx.category, tx.phone);
        const isCreditTx = tx.category?.toUpperCase() === 'WALLET_FUND';
        const amountPrefix = isCreditTx ? '+' : '-';
        const amountColor = isCreditTx 
          ? 'text-green-600' 
          : isSuccess ? 'text-foreground' : 'text-foreground/50 line-through';
        const statusBadgeBg = isSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';

        return (
          <Link
            key={tx.id}
            href={`/dashboard/transactions/${tx.id}`}
            className="w-full p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors text-left border border-muted-foreground/5 hover:border-muted-foreground/10 flex items-center gap-3"
          >
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
            >
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>

            {/* Middle: Service Name & Subtitle */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {serviceName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {subtitle}
              </p>
            </div>

            {/* Right: Amount & Status */}
            <div className="text-right flex-shrink-0">
              <p className={`font-bold text-sm ${amountColor}`}>
                {amountPrefix}₦{Number(tx.amount || 0).toLocaleString()}
              </p>
              <div
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${statusBadgeBg}`}
              >
                {tx.status?.toUpperCase()}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  )
}
