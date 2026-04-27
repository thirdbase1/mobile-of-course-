'use client'

import { useEffect } from 'react'
import { setupLazyImages, reportCoreWebVitals, isSlowNetwork, shouldReduceMotion } from '@/lib/utils/performance'

/**
 * Initialize all performance optimizations on app load
 * - Sets up lazy loading for images
 * - Reports Core Web Vitals
 * - Detects slow networks and optimizes accordingly
 */
export function PerformanceInitializer() {
  useEffect(() => {
    // Setup lazy image loading
    setupLazyImages()
    
    // Report Core Web Vitals for monitoring
    reportCoreWebVitals()
    
    // Log network type for debugging
    if (isSlowNetwork()) {
      console.log('[v0] Slow network detected - optimizing content delivery')
      document.documentElement.setAttribute('data-slow-network', 'true')
    }
    
    // Disable animations on slow networks
    if (shouldReduceMotion()) {
      document.documentElement.setAttribute('data-reduce-motion', 'true')
    }
  }, [])

  return null
}
