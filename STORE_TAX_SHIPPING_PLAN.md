# Feature 13: Store, Tax & Shipping - Implementation Plan

## Overview
Comprehensive update to replace cents-based pricing with proper currency display, integrate real-time tax calculation, and real-time shipping rates.

## Phase 1: Currency Display Update (Cents → USD)

### Files to Update
1. **Data Models** - Change field names and types
   - `src/models/Book.ts` - Order items, subtotal, tax, shipping, total
   - `src/models/Donation.ts` - Amount cents
   - `src/models/Page.ts` - Shipping flat, free threshold
   - `src/types/public.ts` - Event, Course, Book pricing
   - `src/types/index.ts` - Cart item pricing

2. **Utility Functions**
   - `src/lib/utils.ts` - Update formatCents to formatCurrency
   - Create formatPrice() for consistent display

3. **Components**
   - `src/components/providers/CartProvider.tsx` - Subtotal calculation
   - `src/components/forms/AddToCartButton.tsx` - Price display
   - All book display components
   - Cart and checkout components

### Migration Strategy
- Keep database values as cents (integers) for precision
- Display as USD with formatPrice() helper
- Convert user input (USD) to cents for storage
- Convert cents to USD for display

## Phase 2: Tax Calculation Integration

### Tax Provider: TaxJar API
**Why TaxJar:**
- Real-time sales tax calculation
- Handles nexus logic automatically
- Supports all US states + Canadian provinces
- Address validation
- Accurate tax rates by jurisdiction

### Implementation
1. **Service Layer**: `src/lib/services/tax.ts`
   - calculateTax(address, amount, items)
   - validateAddress(address)
   - Cache tax rates for performance

2. **API Routes**:
   - `src/app/api/checkout/calculate-tax/route.ts`
   - Input: shipping address, cart items
   - Output: tax amount, tax rate, jurisdiction

3. **Environment Variables**:
   ```
   TAXJAR_API_KEY=
   TAXJAR_API_MODE=sandbox # or production
   ```

4. **Checkout Flow**:
   - User enters shipping address
   - System calls TaxJar API
   - Displays calculated tax
   - Includes tax in total

## Phase 3: Shipping Rate Integration

### Shipping Provider: EasyPost (aggregates USPS, UPS, FedEx)
**Why EasyPost:**
- Single API for multiple carriers
- Real-time rates from USPS, UPS, FedEx, DHL
- Address verification
- Label printing capability
- Test mode available

### Implementation
1. **Service Layer**: `src/lib/services/shipping.ts`
   - getShippingRates(from, to, package)
   - validateAddress(address)
   - createShipment(order)

2. **API Routes**:
   - `src/app/api/checkout/shipping-rates/route.ts`
   - Input: shipping address, cart weight/dimensions
   - Output: array of shipping options with rates

3. **Environment Variables**:
   ```
   EASYPOST_API_KEY=
   EASYPOST_MODE=test # or production
   SHIPPING_FROM_ADDRESS_ID= # warehouse address
   ```

4. **Checkout Flow**:
   - User enters shipping address
   - System validates address
   - Fetches real-time rates for USPS, UPS, FedEx
   - User selects shipping method
   - Rate included in total

## Phase 4: Enhanced Checkout Flow

### New Checkout Steps
1. **Cart Review** - Items, quantities, subtotal
2. **Shipping Address** - Address form with validation
3. **Shipping Method** - Real-time rates, user selects option
4. **Tax Calculation** - Automatic based on address
5. **Payment** - Stripe with final total
6. **Confirmation** - Order details with tracking

### Order Model Updates
```typescript
{
  // ... existing fields
  shippingAddress: {
    name: string
    line1: string
    line2?: string
    city: string
    state: string
    zip: string
    country: string
  },
  shippingMethod: {
    carrier: string // "USPS", "UPS", "FedEx"
    service: string // "Priority", "Ground", etc.
    rate: number // in cents
    estimatedDays: number
  },
  taxCalculation: {
    rate: number // percentage
    amount: number // in cents
    jurisdiction: string
  },
  // Updated fields
  amount: number // replaces subtotalCents
  tax: number // replaces taxCents
  shipping: number // replaces shippingCents
  total: number // replaces totalCents
}
```

## Phase 5: Admin Configuration

### Settings Page Updates
- Remove manual tax rate (use real-time)
- Remove flat shipping (use real-time rates)
- Add warehouse/ship-from address
- Add API key management
- Test mode toggles

## Implementation Order

### Step 1: Update Display (No Breaking Changes)
- Create new formatPrice() helper
- Update all UI components to use formatPrice()
- Keep backend cents unchanged
- Test display across all pages

### Step 2: Add Tax Service
- Install TaxJar SDK: `npm install taxjar`
- Create tax service layer
- Add API route for tax calculation
- Test with sandbox API key

### Step 3: Add Shipping Service
- Install EasyPost SDK: `npm install @easypost/api`
- Create shipping service layer
- Add API route for shipping rates
- Test with test API key

### Step 4: Update Checkout Flow
- Add shipping address step
- Integrate tax calculation
- Integrate shipping rates
- Update Stripe checkout with final amounts

### Step 5: Update Order Model
- Add migration script for field names
- Update all order creation logic
- Update admin order views
- Test end-to-end

### Step 6: Testing & Validation
- Test tax calculation for various states
- Test shipping rates for various locations
- Test complete checkout flow
- Verify Stripe payment amounts match

## Dependencies to Install

```bash
npm install taxjar @easypost/api
npm install --save-dev @types/taxjar
```

## Environment Variables to Add

```env
# Tax Calculation (TaxJar)
TAXJAR_API_KEY=your_taxjar_api_key
TAXJAR_API_MODE=sandbox

# Shipping Rates (EasyPost)
EASYPOST_API_KEY=your_easypost_test_key
EASYPOST_MODE=test

# Warehouse/Ship From Address
SHIPPING_FROM_NAME=Explore More Academy
SHIPPING_FROM_LINE1=123 Main Street
SHIPPING_FROM_LINE2=
SHIPPING_FROM_CITY=Charles County
SHIPPING_FROM_STATE=MD
SHIPPING_FROM_ZIP=20602
SHIPPING_FROM_COUNTRY=US
SHIPPING_FROM_PHONE=
```

## Rollout Strategy

### Phase 1: Development (Week 1)
- Currency display updates
- Helper functions
- No backend changes

### Phase 2: Tax Integration (Week 2)
- Tax service implementation
- API routes
- Checkout integration

### Phase 3: Shipping Integration (Week 3)
- Shipping service implementation
- API routes
- Rate selection UI

### Phase 4: Full Integration (Week 4)
- Complete checkout flow
- Order model updates
- Admin updates
- Testing

### Phase 5: Production (Week 5)
- Switch to production API keys
- Monitor transactions
- Address any issues

## Testing Checklist

- [ ] Currency displays as $XX.XX USD
- [ ] Tax calculated correctly for CA, TX, NY, FL
- [ ] Tax not charged for tax-exempt states
- [ ] Shipping rates fetched for multiple carriers
- [ ] User can select shipping method
- [ ] Order total = subtotal + tax + shipping
- [ ] Stripe charge matches order total
- [ ] Order saved with correct amounts
- [ ] Admin can view tax and shipping details
- [ ] Receipt emails show proper formatting

## Cost Considerations

### TaxJar Pricing
- **Starter**: $19/month (500 transactions)
- **Professional**: $99/month (2,500 transactions)
- **Premium**: $199/month (10,000 transactions)

### EasyPost Pricing
- **Free**: 10,000 address validations/month
- **Rate Shopping**: $0.05 per API call
- **Label Printing**: Carrier rates + small markup

### Total Estimated Cost
- Development: TaxJar Starter + EasyPost Free = $19/month
- Production (low volume): $19-99/month
- Production (high volume): $99-199/month + shipping calls

## Compliance Notes

- **Sales Tax Nexus**: Businesses must collect tax in states where they have nexus (physical presence, economic activity)
- **TaxJar** handles nexus determination automatically
- **Address Validation**: Required for accurate tax calculation
- **Record Keeping**: Save tax calculation details with each order
- **Reporting**: TaxJar provides filing and remittance reports

## Success Criteria

✅ All prices display as $XX.XX USD (not cents)
✅ Tax calculated in real-time based on shipping address
✅ Multiple shipping options with real-time rates
✅ User selects shipping method before payment
✅ Order total = subtotal + calculated tax + selected shipping
✅ Stripe charge matches calculated total
✅ Admin can view full breakdown of charges
✅ System works in test mode before production
