import { NextRequest, NextResponse } from 'next/server'
import { getDataPlans, getCablePlans } from '@/lib/api/gsubz'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const service = searchParams.get('service')
    const type = searchParams.get('type')

    if (!service || !type) {
      console.log('[v0] API /plans: Missing params - service:', service, 'type:', type)
      return NextResponse.json(
        { error: 'Missing service or type parameter' },
        { status: 400 }
      )
    }

    console.log('[v0] API /plans: Starting fetch for service:', service, 'type:', type)

    let plansData: any = null

    try {
      if (type === 'DATA') {
        console.log('[v0] API /plans: Calling getDataPlans with:', service)
        plansData = await getDataPlans(service)
      } else if (type === 'CABLE') {
        console.log('[v0] API /plans: Calling getCablePlans with:', service)
        plansData = await getCablePlans(service)
      }
    } catch (fetchError) {
      console.error('[v0] API /plans: Error calling gsubz:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch from Gsubz', details: String(fetchError), plans: [] },
        { status: 200 }
      )
    }

    console.log('[v0] API /plans: Raw plans data structure:', {
      hasPlans: !!plansData?.plans,
      plansCount: plansData?.plans?.length,
      keys: plansData ? Object.keys(plansData) : [],
    })
    
    // Ensure we return an array of plans
    const plans = plansData?.plans || []
    console.log('[v0] API /plans: Final returning', plans.length, 'plans')
    console.log('[v0] API /plans: Plan names:', plans.map((p: any) => p.displayName))

    return NextResponse.json({
      ...plansData,
      plans: plans
    })
  } catch (error) {
    console.error('[v0] API /plans: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plans', details: String(error), plans: [] },
      { status: 200 }
    )
  }
}
