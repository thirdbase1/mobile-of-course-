# Pricing Flow Architecture

## 1. GSUBZ API → CACHE → PRICING PAGE → USER DASHBOARD

### Step 1: Gsubz API Fetch (lib/api/gsubz.ts)
- **Source**: gsubz.com/api/plans?service={serviceId}
- **Caching**: Per-service cache (gsubz-data-plans-mtn_sme, gsubz-data-plans-airtel_sme, etc.)
- **Response Structure**:
  ```
  DATA: { plans: [{ displayName, value, price }, ...] }
  CABLE: { list: [{ display_name, value, price }, ...] } → transforms to { plans: [...] }
  ```
- **Services Available**:
  - DATA: mtn_sme, mtn_datashare, mtn_gifting, mtn_awoof, glo_data, glo_sme, airtel_sme, airtel_gifting, etisalat_data
  - CABLE: dstv, gotv, startimes

### Step 2: Admin Pricing Page (/app/admin/pricing/page.tsx)
1. **View All Plans**: Shows all plans from gsubz for each service variation
   - Top tabs: Data / Cable
   - Network tabs: MTN / Glo / Airtel / 9mobile (for Data)
   - Plan type tabs: SME Data / Data Share / Gifting / AWOOF (for MTN, varies per network)

2. **Add Markup Rules**: Admin can:
   - Click "Use" on any plan from gsubz
   - Set fixed (₦) or percentage (%) markup
   - Rule stored in Supabase `pricing_rules` table:
     ```
     {
       id, service_id (mtn/glo/etc), plan_name (exact match),
       base_price, markup_type (fixed/percentage), markup_value, is_active
     }
     ```

### Step 3: User Dashboard Fetch (lib/actions/data.ts & lib/actions/cable.ts)
1. **Fetch from Gsubz**: Get latest plans
2. **Fetch Markup Rules**: Query pricing_rules for matching plans
3. **Apply Markup**:
   ```
   Final Price = Base Price + Markup
   OR
   Final Price = Base Price × (1 + Markup%)
   ```
4. **Return to User**: Enhanced plans with markup applied

### Step 4: User Sees Plans (/app/dashboard/data or /app/dashboard/cable)
- Plans displayed with **MARKED-UP PRICES**
- User purchases at marked-up price
- Profit = Markup amount

## Key Points:
- ✅ Pricing page is **protected** by admin layout - no extra checks needed
- ✅ All plans from gsubz shown on pricing page (nested tabs)
- ✅ Admin sets markups only for plans they want to configure
- ✅ Plans without rules show at gsubz base price
- ✅ User ALWAYS sees marked-up price on dashboard
