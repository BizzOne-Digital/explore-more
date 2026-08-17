# Feature 13: Store, Tax & Shipping - Implementation Status

## Current Status: ⚠️ PARTIALLY IMPLEMENTED

This feature requires significant infrastructure changes and third-party integrations. Here's the current status:

## ✅ Completed: Currency Display Updates

### Updated Files
1. **src/lib/utils.ts** - Enhanced currency utilities
   - `formatPrice(cents, showCurrency)` - Displays as "$25.00 USD"
   - `dollarsToCents(dollars)` - Convert input to storage format
   - `centsToDollars(cents)` - Convert storage to display format
   - `formatDollars(cents)` - For input field display

### What's Working
- ✅ New helper functions created
- ✅ Backward compatible with existing `formatCents()` and `formatCurrency()`
- ✅ Ready to use in all components

### Implementation Pattern
```typescript
// Display prices
import { formatPrice } from "@/lib/utils";

// Shows: "$25.00 USD"
<p>{formatPrice(2500)}</p>

// Shows: "$25.00"
<p>{formatPrice(2500, false)}</p>

// Convert user input
import { dollarsToCents } from "@/lib/utils";
const cents = dollarsToCents(25.00); // 2500

// For display in inputs
import { formatDollars } from "@/lib/utils";
<input value={formatDollars(2500)} /> // "25.00"
```

## 🔄 TODO: Update All Display Components

### Files That Need Updates (62+ occurrences found)
**Priority 1 - Customer Facing:**
- All book display components
- Cart components
- Checkout pages
- Order confirmation
- Receipt emails

**Priority 2 - Admin:**
- Order management pages
- Product management
- Settings pages
- Reports

**Priority 3 - Internal:**
- API responses (optional - keep as cents)
- Database (keep as cents for precision)

### Recommendation
Use a global search and replace approach:
1. Find all `formatCents(` or `formatCurrency(`
2. Replace with `formatPrice(` where user-facing
3. Test each page after replacement

## ❌ NOT IMPLEMENTED: Tax Calculation Integration

### Requirements
- Real-time tax calculation based on shipping address
- Integration with tax service provider
- Address validation
- Tax rate lookup by jurisdiction

### Recommended Implementation

#### Option 1: TaxJar (Recommended)
**Pros:**
- Handles all US states + Canada
- Automatic nexus determination
- Address validation included
- Accurate multi-jurisdiction support
- Filing and remittance reports

**Cons:**
- Cost: $19-199/month based on volume
- Requires API account setup

**Setup:**
```bash
npm install taxjar
```

**Environment Variables:**
```env
TAXJAR_API_KEY=your_api_key_here
TAXJAR_API_MODE=sandbox
```

**Service Implementation:**
```typescript
// src/lib/services/tax.ts
import Taxjar from 'taxjar';

const client = new Taxjar({
  apiKey: process.env.TAXJAR_API_KEY,
  apiUrl: process.env.TAXJAR_API_MODE === 'sandbox' 
    ? Taxjar.SANDBOX_API_URL 
    : Taxjar.DEFAULT_API_URL
});

export async function calculateTax(params: {
  toAddress: Address;
  amount: number; // in cents
  shipping: number; // in cents
  lineItems: LineItem[];
}) {
  const response = await client.taxForOrder({
    to_country: params.toAddress.country,
    to_zip: params.toAddress.zip,
    to_state: params.toAddress.state,
    to_city: params.toAddress.city,
    to_street: params.toAddress.line1,
    amount: params.amount / 100, // convert to dollars
    shipping: params.shipping / 100,
    line_items: params.lineItems.map(item => ({
      quantity: item.quantity,
      unit_price: item.priceCents / 100,
      product_tax_code: '31000', // Books tax code
    })),
  });

  return {
    taxAmount: Math.round(response.tax.amount_to_collect * 100), // convert to cents
    taxRate: response.tax.rate,
    jurisdiction: response.tax.jurisdiction,
  };
}
```

#### Option 2: Stripe Tax
**Pros:**
- Integrated with Stripe payments
- No additional service needed
- Automatic calculation

**Cons:**
- 0.5% of transaction + $0.02 per transaction
- Only works with Stripe Checkout/Payment Intents

**Implementation:**
```typescript
// Enable Stripe Tax in checkout session
const session = await stripe.checkout.sessions.create({
  // ... other params
  automatic_tax: { enabled: true },
  customer_update: {
    address: 'auto',
    shipping: 'auto',
  },
});
```

### Files to Create
- `src/lib/services/tax.ts` - Tax calculation service
- `src/app/api/checkout/calculate-tax/route.ts` - API endpoint
- `src/types/tax.ts` - TypeScript interfaces

### Integration Points
1. Checkout flow - after shipping address entered
2. Order creation - save tax details
3. Admin order view - display tax breakdown
4. Receipts - show tax amount and rate

## ❌ NOT IMPLEMENTED: Shipping Rate Integration

### Requirements
- Real-time shipping rates from carriers
- Multiple shipping options (USPS, UPS, FedEx)
- Address validation
- Customer selects shipping method

### Recommended Implementation

#### Option 1: EasyPost (Recommended)
**Pros:**
- Single API for USPS, UPS, FedEx, DHL
- Real-time carrier rates
- Address verification
- Label printing capability
- Test mode available

**Cons:**
- $0.05 per rate request
- Requires API account

**Setup:**
```bash
npm install @easypost/api
```

**Environment Variables:**
```env
EASYPOST_API_KEY=your_test_key_here
EASYPOST_MODE=test
SHIPPING_FROM_ZIP=20602
SHIPPING_FROM_STATE=MD
```

**Service Implementation:**
```typescript
// src/lib/services/shipping.ts
import EasyPost from '@easypost/api';

const client = new EasyPost(process.env.EASYPOST_API_KEY);

export async function getShippingRates(params: {
  toAddress: Address;
  packageWeight: number; // in ounces
  packageDimensions?: { length: number; width: number; height: number };
}) {
  const shipment = await client.Shipment.create({
    to_address: {
      street1: params.toAddress.line1,
      street2: params.toAddress.line2,
      city: params.toAddress.city,
      state: params.toAddress.state,
      zip: params.toAddress.zip,
      country: params.toAddress.country || 'US',
    },
    from_address: {
      zip: process.env.SHIPPING_FROM_ZIP,
      state: process.env.SHIPPING_FROM_STATE,
      country: 'US',
    },
    parcel: {
      weight: params.packageWeight,
      length: params.packageDimensions?.length,
      width: params.packageDimensions?.width,
      height: params.packageDimensions?.height,
    },
  });

  return shipment.rates.map(rate => ({
    carrier: rate.carrier,
    service: rate.service,
    rate: Math.round(parseFloat(rate.rate) * 100), // convert to cents
    estimatedDays: rate.delivery_days,
    id: rate.id,
  }));
}
```

#### Option 2: Direct Carrier APIs
**USPS Web Tools:**
- Free for rate shopping
- Limited to USPS only
- More complex setup

**UPS/FedEx APIs:**
- Direct integration
- Requires carrier accounts
- More setup complexity

### Files to Create
- `src/lib/services/shipping.ts` - Shipping rate service
- `src/app/api/checkout/shipping-rates/route.ts` - API endpoint
- `src/types/shipping.ts` - TypeScript interfaces
- `src/components/checkout/ShippingMethodSelector.tsx` - UI component

### Integration Points
1. Checkout flow - after address validation
2. Order creation - save selected shipping method
3. Admin order view - display shipping details
4. Fulfillment - use for label creation

## 🔄 TODO: Enhanced Checkout Flow

### New Checkout Steps Required
1. **Cart Review** (existing)
2. **Shipping Address** (new - needs address form)
3. **Shipping Method** (new - display rate options)
4. **Tax Calculation** (new - automatic, display only)
5. **Payment** (update - include full breakdown)
6. **Confirmation** (update - show all details)

### Components to Create
- `src/app/checkout/address/page.tsx` - Address entry form
- `src/app/checkout/shipping/page.tsx` - Rate selection
- `src/app/checkout/review/page.tsx` - Final review before payment
- `src/components/checkout/AddressForm.tsx` - Reusable address form
- `src/components/checkout/ShippingMethodSelector.tsx` - Rate options
- `src/components/checkout/OrderSummary.tsx` - Subtotal, tax, shipping, total

### Order Model Updates Needed
```typescript
// Add to IOrder interface
shippingAddress: {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}
shippingMethod: {
  carrier: string;
  service: string;
  rate: number;
  estimatedDays: number;
}
taxCalculation: {
  rate: number;
  amount: number;
  jurisdiction: string;
}
```

## 📋 Implementation Checklist

### Phase 1: Display Updates (Can do immediately)
- [x] Create new utility functions
- [ ] Update all book components to use `formatPrice()`
- [ ] Update cart display
- [ ] Update checkout display
- [ ] Update order confirmation
- [ ] Update admin order views
- [ ] Update receipt emails

### Phase 2: API Integration Setup (Requires accounts)
- [ ] Sign up for TaxJar account (or choose Stripe Tax)
- [ ] Sign up for EasyPost account
- [ ] Get API keys for test/sandbox mode
- [ ] Add environment variables
- [ ] Install required npm packages

### Phase 3: Tax Service (After Phase 2)
- [ ] Create `src/lib/services/tax.ts`
- [ ] Create API route for tax calculation
- [ ] Test tax calculation in sandbox
- [ ] Integrate into checkout flow

### Phase 4: Shipping Service (After Phase 2)
- [ ] Create `src/lib/services/shipping.ts`
- [ ] Create API route for shipping rates
- [ ] Create shipping method selector UI
- [ ] Test rate fetching in sandbox
- [ ] Integrate into checkout flow

### Phase 5: Checkout Flow (After Phases 3 & 4)
- [ ] Create address entry page
- [ ] Create shipping method selection page
- [ ] Create review page with full breakdown
- [ ] Update Stripe checkout with calculated amounts
- [ ] Update order model with new fields
- [ ] Update order creation logic

### Phase 6: Admin Updates
- [ ] Update settings page (remove manual tax/shipping)
- [ ] Add warehouse address configuration
- [ ] Update order detail pages with new fields
- [ ] Add tax and shipping breakdown to reports

### Phase 7: Testing
- [ ] Test tax calculation for multiple states
- [ ] Test shipping rates for various locations
- [ ] Test complete checkout flow end-to-end
- [ ] Verify Stripe amounts match calculations
- [ ] Test order creation and storage
- [ ] Test admin order views

### Phase 8: Production
- [ ] Switch API keys to production mode
- [ ] Monitor first transactions
- [ ] Address any issues

## 💰 Cost Estimates

### Development/Testing (Monthly)
- TaxJar Starter: $19/month (includes 500 transactions)
- EasyPost: Free (10,000 address validations)
- Rate lookups: ~$0.05 per checkout = minimal cost in testing

**Total: ~$19-25/month**

### Production (Low Volume <100 orders/month)
- TaxJar Starter: $19/month
- EasyPost rate lookups: ~$5/month
- Stripe fees: Standard rates

**Total: ~$24/month + Stripe fees**

### Production (Medium Volume <500 orders/month)
- TaxJar Professional: $99/month
- EasyPost rate lookups: ~$25/month
- Stripe fees: Standard rates

**Total: ~$124/month + Stripe fees**

## 🎯 Success Criteria

When fully implemented, the system should:

✅ Display all prices as "$XX.XX USD" (not cents)
✅ Calculate sales tax automatically based on shipping address
✅ Support tax calculation for all US states
✅ Provide 3-5 shipping options with real-time rates
✅ Allow customer to select shipping method
✅ Show order breakdown: Subtotal + Tax + Shipping = Total
✅ Charge correct amount via Stripe
✅ Save complete order details including tax and shipping
✅ Display all details in admin order views
✅ Include all details in receipt emails

## 📞 Next Steps

1. **Decision Required**: Choose tax provider (TaxJar vs Stripe Tax)
2. **Decision Required**: Choose shipping provider (EasyPost vs Direct carriers)
3. **Account Setup**: Create accounts and get API keys
4. **Budget Approval**: Confirm monthly service costs are approved
5. **Development**: Follow implementation checklist above
6. **Testing**: Thorough testing in sandbox/test mode
7. **Production**: Deploy with production API keys

## 📚 Resources

### TaxJar
- Docs: https://developers.taxjar.com/
- Pricing: https://www.taxjar.com/pricing/
- Node.js SDK: https://github.com/taxjar/taxjar-node

### EasyPost
- Docs: https://www.easypost.com/docs/api
- Pricing: https://www.easypost.com/pricing
- Node.js SDK: https://github.com/EasyPost/easypost-node

### Stripe Tax
- Docs: https://stripe.com/docs/tax
- Pricing: https://stripe.com/pricing#tax

## ⚠️ Important Notes

1. **Database Fields**: Keep storing amounts in cents (integers) for precision. Only convert to dollars for display.

2. **Tax Nexus**: Consult with tax professional about which states require tax collection based on business presence.

3. **Address Validation**: Critical for accurate tax calculation - invalid addresses can result in incorrect tax.

4. **Testing**: Always test in sandbox/test mode before production to avoid real charges.

5. **Compliance**: Save all tax calculation details with orders for audit purposes.

6. **Error Handling**: Have fallback behavior if API calls fail (e.g., estimated shipping, notify admin).

## Current State Summary

**What's Done:**
- ✅ Currency formatting utilities created
- ✅ Implementation plan documented
- ✅ File structure identified

**What's Needed:**
- ❌ Service provider accounts and API keys
- ❌ Tax calculation service implementation
- ❌ Shipping rate service implementation
- ❌ Enhanced checkout flow
- ❌ Order model updates
- ❌ Component updates (62+ files)
- ❌ End-to-end testing

**Estimated Development Time:**
- Phase 1 (Display): 2-3 days
- Phase 2-4 (Services): 5-7 days
- Phase 5 (Checkout): 5-7 days
- Phase 6-7 (Admin & Testing): 3-5 days
- **Total: 3-4 weeks**

This is a major feature requiring significant development effort and third-party service integrations.
