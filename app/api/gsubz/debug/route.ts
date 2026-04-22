import { NextRequest, NextResponse } from 'next/server'
import { getDataPlans, getCablePlans } from '@/lib/api/gsubz'

/**
 * Debug endpoint to see raw gsubz responses
 * Usage: GET /api/gsubz/debug?service=mtn_sme&type=DATA
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const service = searchParams.get('service')
    const type = searchParams.get('type')

    if (!service || !type) {
      return NextResponse.json(
        { error: 'Missing service or type parameter' },
        { status: 400 }
      )
    }

    console.log('[v0] Debug: Fetching plans for service:', service, 'type:', type)

    let plansData: any = null

    try {
      if (type === 'DATA') {
        plansData = await getDataPlans(service)
      } else if (type === 'CABLE') {
        plansData = await getCablePlans(service)
      }
    } catch (fetchError) {
      console.error('[v0] Debug: Error calling gsubz:', fetchError)
      return NextResponse.json({
        error: 'Failed to fetch from Gsubz',
        details: String(fetchError),
        service,
        type
      }, { status: 500 })
    }

    // Return the full response structure for debugging
    return NextResponse.json({
      service,
      type,
      rawResponse: plansData,
      plansArray: plansData?.plans,
      plansCount: (plansData?.plans || []).length,
      allKeys: Object.keys(plansData || {})
    })
  } catch (error) {
    console.error('[v0] Error in debug API route:', error)
    return NextResponse.json(
      { error: 'Failed to debug', details: String(error) },
      { status: 500 }
    )
  }
}
