# Cost Report Fix - All Costs Now Included

## Issue Fixed
The cost report generation was not including all cost categories in the estimated totals, and material costs weren't being pulled from linked orders.

## Changes Made

### 1. **Material Cost Estimation**
Now automatically estimates material costs from linked order items:
- Pulls order items if project has `orderId`
- Calculates total material cost from order item quantities and prices
- Defaults to 0 if no order is linked

### 2. **Complete Cost Categories**
All cost categories are now properly estimated and tracked:
- ✅ **Labor** - From crew details
- ✅ **Transport** - From transport details
- ✅ **Materials** - From linked order items (NEW!)
- ✅ **Equipment** - Defaults to 0 (can be manually entered)
- ✅ **Overhead** - Defaults to 0 (can be manually entered)
- ✅ **Other** - Defaults to 0 (can be manually entered)

### 3. **Total Cost Calculation**
The estimated total now includes ALL categories:
```javascript
estimatedCost = labor + transport + materials + equipment + overhead + other
```

Previously it only included:
```javascript
estimatedCost = labor + transport // ❌ Missing categories!
```

### 4. **Accurate Variance**
Variance calculations are now accurate because:
- All estimated costs are included in the total
- All actual costs default to their estimates
- Variance = actual - estimated (for all categories)

## For Existing Cost Reports

**Existing reports (like ID 2) were generated with the old logic.**

To fix them:
1. **Option A**: Delete and regenerate the cost report
   - Go to project detail page
   - Click "Generate Cost Report" again
   
2. **Option B**: Manually edit actual costs
   - Open the cost report
   - Click "Edit Report"
   - Update actual costs for each category
   - Save changes

## Benefits

### Before Fix:
```
Estimated: KES 100,000 (only labor + transport)
Actual: KES 150,000 (all categories)
Variance: +KES 50,000 ❌ Incorrect! (50% over budget)
```

### After Fix:
```
Estimated: KES 145,000 (all categories including materials)
Actual: KES 150,000 (all categories)
Variance: +KES 5,000 ✅ Correct! (3.4% over budget)
```

## Testing

Generate a new cost report for a project with:
1. Crew details (labor costs)
2. Transport (transport costs)
3. Linked order with items (material costs)

Result:
- ✅ All costs should appear in the breakdown
- ✅ Estimated materials should match order items total
- ✅ Variance should be accurate
- ✅ Profit margin should be correct

## Technical Details

**File Modified**: `src/app/api/projects/[id]/generate-cost-report/route.ts`

**Changes**:
- Added material cost estimation from order items
- Updated estimated cost calculation to include all 6 categories
- Fixed cost breakdown JSON objects with proper estimated values
- Actual costs now default to their estimated values

**API Response Structure**:
```json
{
  "laborCosts": {
    "estimated": 50000,
    "actual": 48000,
    "variance": -2000
  },
  "materialCosts": {
    "estimated": 30000,  // Now pulled from order!
    "actual": 30000,
    "variance": 0
  }
}
```
