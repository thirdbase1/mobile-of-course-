"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle2, XCircle, Download } from "lucide-react"
import Link from "next/link"

interface TransactionResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  success: boolean
  title: string
  message: string
  details?: Record<string, string>
}

export function TransactionResultDialog({
  open,
  onOpenChange,
  success,
  title,
  message,
  details,
}: TransactionResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {success ? (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
            )}
            <DialogTitle className="text-2xl text-center">{title}</DialogTitle>
            <DialogDescription className="text-center">{message}</DialogDescription>
          </div>
        </DialogHeader>

        {success && details && (
          <div className="space-y-3 py-4 border-t">
            {Object.entries(details).map(([label, value]) => (
              <div key={label} className="flex justify-between py-2">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
          {success && (
            <Link href="/dashboard/transactions" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                View Receipt
              </Button>
            </Link>
          )}
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            {success ? "Done" : "Try Again"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
