import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook that automatically refreshes dashboard data every 1 second
 * without disrupting the user's interaction or reloading the frontend
 * 
 * It updates the profile balance silently in the background
 */
export function useDashboardAutoRefresh(userId: string | undefined, onDataUpdate?: (data: any) => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRunningRef = useRef(false)

  useEffect(() => {
    if (!userId) return

    // Start the auto-refresh interval
    intervalRef.current = setInterval(async () => {
      // Skip if already running a fetch
      if (isRunningRef.current) return

      isRunningRef.current = true

      try {
        const supabase = createClient()
        
        // Fetch only the profile data silently in the background
        const { data, error } = await supabase
          .from("profiles")
          .select("wallet_balance, updated_at")
          .eq("id", userId)
          .single()

        if (!error && data && onDataUpdate) {
          // Call the update callback with new data
          // The component should update its state without re-rendering the entire page
          onDataUpdate({
            balance: data.wallet_balance,
            updatedAt: data.updated_at,
          })
        }
      } catch (err) {
        // Silently fail - we don't want to show errors for background syncing
        console.log("[v0] Silent background refresh failed (expected sometimes):", err)
      } finally {
        isRunningRef.current = false
      }
    }, 1000) // Refresh every 1 second

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [userId, onDataUpdate])

  return {
    stop: () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    },
  }
}
