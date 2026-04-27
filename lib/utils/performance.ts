/**
 * Performance Optimization Utilities
 * Optimizes loading for slow networks (2G/3G)
 */

/**
 * Prefetch resources for faster loading
 * Only preloads on fast connections (4G+)
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script') {
  if (typeof window === 'undefined') return

  // Check connection speed - only prefetch on 4G+
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (connection && connection.effectiveType && connection.effectiveType !== '4g') {
    console.log('[v0] Skipping prefetch on slow connection:', connection.effectiveType)
    return
  }

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = url
  
  if (type === 'script') {
    link.as = 'script'
  } else if (type === 'style') {
    link.as = 'style'
  } else if (type === 'image') {
    link.as = 'image'
  }
  
  document.head.appendChild(link)
}

/**
 * Detect slow network (2G/3G) and reduce resources accordingly
 */
export function isSlowNetwork(): boolean {
  if (typeof window === 'undefined') return false

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (!connection) return false

  return connection.effectiveType === '2g' || connection.effectiveType === '3g' || connection.saveData === true
}

/**
 * Lazy load images only when visible or on fast networks
 */
export function setupLazyImages() {
  if (typeof window === 'undefined') return

  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          
          if (img.dataset.src) {
            img.src = img.dataset.src
            img.removeAttribute('data-src')
          }
          
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset
            img.removeAttribute('data-srcset')
          }
          
          imageObserver.unobserve(img)
        }
      })
    }, {
      rootMargin: '50px',
    })

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img)
    })
  }
}

/**
 * Report Core Web Vitals for monitoring
 */
export function reportCoreWebVitals() {
  if (typeof window === 'undefined') return

  // LCP - Largest Contentful Paint
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('[v0] LCP:', entry.renderTime || entry.loadTime)
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // PerformanceObserver not supported
    }
  }
}

/**
 * Defer non-critical JS execution
 */
export function deferNonCriticalWork(callback: () => void, delay: number = 2000) {
  if (typeof window === 'undefined') return

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback)
  } else {
    setTimeout(callback, delay)
  }
}

/**
 * Check if animations should be reduced based on user preference or network
 */
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isSlowNet = isSlowNetwork()

  return prefersReduced || isSlowNet
}
