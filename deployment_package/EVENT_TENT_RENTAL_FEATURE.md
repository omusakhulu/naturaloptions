# Event Tent Rental Product Feature

## Overview
A comprehensive rental product system for Event Tents with dynamic size generation, custom rental metadata, and automated pricing based on dimensions.

## Features

### ✅ Dynamic Size Variations
- Users can input custom dimensions (length × width)
- Automatically generates product variations for each size
- Calculates area and capacity for each variation
- Supports unlimited size combinations

### ✅ Smart Pricing System
- **Base Price**: Starting price for any tent rental
- **Price per Square Meter**: Additional cost based on tent area
- **Formula**: `Final Price = Base Price + (Area × Price/m²)`
- Automatic price calculation for all variations

### ✅ Capacity Calculations
- **Standing Capacity**: ~1.5 people per square meter
- **Seated Capacity**: ~0.8 people per square meter
- Automatically calculated for each size variation

### ✅ Rental-Specific Metadata
Each Event Tent product includes custom rental metadata:
- `rental_duration_unit`: Day, week, or month
- `minimum_rental_duration`: Minimum rental period
- `setup_time_required`: Time needed to set up the tent
- `teardown_time_required`: Time needed to take down the tent
- `capacity_standing`: Maximum standing capacity
- `capacity_seated`: Maximum seated capacity
- `linked_products`: Related products (flooring, walls, accessories)

### ✅ Inventory Management
- Stock quantity tracking per size variation
- Individual SKU generation for each variation
- Stock status management

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── products/
│   │       └── event-tent/
│   │           └── route.ts                    # API endpoint for CRUD operations
│   └── [lang]/
│       └── (dashboard)/
│           └── (private)/
│               └── apps/
│                   └── ecommerce/
│                       └── products/
│                           └── event-tent/
│                               ├── page.tsx                    # Page wrapper
│                               └── EventTentProductForm.tsx    # Main form component
└── components/
    └── layout/
        └── vertical/
            └── VerticalMenu.jsx               # Updated with Event Tent menu item
```

## API Endpoints

### POST `/api/products/event-tent`
Creates a new Event Tent rental product with variations.

**Request Body:**
```json
{
  "name": "Event Tent",
  "description": "A versatile tent suitable for various events...",
  "shortDescription": "Customizable event tent rental",
  "basePrice": 500,
  "pricePerSquareMeter": 25,
  "sizes": [
    {
      "length": 10,
      "width": 10,
      "stockQuantity": 5
    },
    {
      "length": 15,
      "width": 10,
      "stockQuantity": 3
    }
  ],
  "rentalMetadata": {
    "rental_duration_unit": "day",
    "minimum_rental_duration": 1,
    "setup_time_required": "2 hours",
    "teardown_time_required": "2 hours"
  },
  "sku": "EVENT-TENT-12345",
  "categories": [{ "id": 15 }],
  "images": []
}
```

**Response:**
```json
{
  "success": true,
  "product": { ... },
  "variations": [ ... ],
  "message": "Event Tent product created with 2 size variations"
}
```

### GET `/api/products/event-tent`
Retrieves all Event Tent products.

**Response:**
```json
{
  "success": true,
  "products": [ ... ],
  "count": 5
}
```

## WooCommerce Integration

The system uses the `WooRentalBridge` module to interact with WooCommerce:

### Product Structure
- **Type**: Variable Product
- **Variations**: Based on size attribute
- **Attributes**: 
  - Size (e.g., "10m x 10m", "15m x 10m")

### Custom Meta Data
Each product and variation stores custom metadata:

**Product Level:**
```
_rental_product: "yes"
_rental_duration_unit: "day"
_minimum_rental_duration: 1
_setup_time_required: "2 hours"
_teardown_time_required: "2 hours"
_base_price: "500"
_price_per_square_meter: "25"
_linked_products: JSON array
```

**Variation Level:**
```
_tent_length: "10"
_tent_width: "10"
_tent_area: "100"
_capacity_standing: "150"
_capacity_seated: "80"
```

## Usage Guide

### 1. Access the Feature
Navigate to: **eCommerce > Products > Event Tent Rental**

Or visit: `/en/apps/ecommerce/products/event-tent`

### 2. Configure Basic Information
- **Product Name**: Default is "Event Tent" (customizable)
- **SKU**: Auto-generated, format: `EVENT-TENT-{timestamp}`
- **Description**: Full product description
- **Short Description**: Brief summary

### 3. Set Pricing Structure
- **Base Price**: Starting price (e.g., KES 500)
- **Price per m²**: Additional cost per square meter (e.g., KES 25)

Example:
- 10m × 10m tent (100 m²) = KES 500 + (100 × 25) = **KES 3,000**
- 15m × 10m tent (150 m²) = KES 500 + (150 × 25) = **KES 4,250**

### 4. Configure Rental Metadata
- **Duration Unit**: Day, Week, or Month
- **Minimum Duration**: Minimum rental period (e.g., 1 day)
- **Setup Time**: Time required for installation (e.g., "2 hours")
- **Teardown Time**: Time required for removal (e.g., "2 hours")

### 5. Add Size Variations
For each size:
1. Enter **Length** (meters)
2. Enter **Width** (meters)
3. Set **Stock Quantity**
4. Click **Add Size**

The system will automatically:
- Calculate area (length × width)
- Calculate price using the pricing formula
- Calculate standing capacity (~1.5 people/m²)
- Calculate seated capacity (~0.8 people/m²)
- Generate unique SKU (e.g., `EVENT-TENT-12345-10X10`)

### 6. Review and Create
- Review all configured sizes in the table
- Check calculated prices and capacities
- Click **Create Event Tent Product**

### 7. Result
The system will:
1. Create a variable product in WooCommerce
2. Generate variations for each size
3. Set up all custom metadata
4. Configure stock levels
5. Return success confirmation with product ID

## Example Scenarios

### Scenario 1: Wedding Tent
```
Base Price: KES 1,000
Price per m²: KES 30
Sizes:
- 15m × 15m (225 m²) → KES 7,750 → 337 standing / 180 seated
- 20m × 15m (300 m²) → KES 10,000 → 450 standing / 240 seated
```

### Scenario 2: Corporate Event Tent
```
Base Price: KES 500
Price per m²: KES 25
Sizes:
- 10m × 10m (100 m²) → KES 3,000 → 150 standing / 80 seated
- 12m × 10m (120 m²) → KES 3,500 → 180 standing / 96 seated
- 15m × 12m (180 m²) → KES 5,000 → 270 standing / 144 seated
```

### Scenario 3: Festival Tent
```
Base Price: KES 2,000
Price per m²: KES 40
Sizes:
- 20m × 20m (400 m²) → KES 18,000 → 600 standing / 320 seated
- 25m × 20m (500 m²) → KES 22,000 → 750 standing / 400 seated
```

## Benefits

### For Business
✅ **Automated Pricing**: No manual price calculation needed
✅ **Scalable**: Easily add new sizes without code changes
✅ **Professional**: Complete rental metadata for each product
✅ **Inventory Control**: Track stock per size variation
✅ **Customer Clarity**: Clear capacity information helps customers choose

### For Customers
✅ **Transparency**: See exact pricing and capacity
✅ **Flexibility**: Multiple sizes to choose from
✅ **Information**: Complete details about setup, teardown, and capacity
✅ **Easy Booking**: Select size and add to cart/quote

## Technical Details

### Dependencies
- WooRentalBridge module (custom)
- WooCommerce REST API v3
- Next.js App Router
- Material-UI (MUI)
- Lucide React Icons

### Environment Variables Required
```env
WOO_STORE_URL=https://your-store.com
WOO_CONSUMER_KEY=ck_xxxxx
WOO_CONSUMER_SECRET=cs_xxxxx
```

### Database Schema
Products are synced to PostgreSQL database (see `src/prisma/schema.prisma`).

### Error Handling
- Validates required fields before submission
- Shows user-friendly error messages
- Handles WooCommerce API errors gracefully
- Provides detailed console logging for debugging

## Future Enhancements

### Planned Features
- [ ] Image upload for tent visualizations
- [ ] Linked products (flooring, walls, accessories)
- [ ] Seasonal pricing adjustments
- [ ] Bulk import of sizes via CSV
- [ ] Custom pricing rules per size
- [ ] Availability calendar integration
- [ ] Advanced booking management
- [ ] Email notifications for bookings
- [ ] PDF quote generation
- [ ] Multi-currency support

## Troubleshooting

### Product Not Created
1. Check WooCommerce API credentials in `.env`
2. Verify WooCommerce REST API is enabled
3. Check console for detailed error messages
4. Ensure at least one size variation is added

### Variations Not Showing
1. Verify product type is "variable"
2. Check size attribute is set as "Used for variations"
3. Ensure variations were created successfully (check API response)

### Pricing Incorrect
1. Verify base price and price per m² are correct
2. Check calculation formula: `Base + (Area × Price/m²)`
3. Review size dimensions (length × width)

## Support

For issues or questions, check:
1. Console logs in browser Developer Tools
2. API response messages
3. WooCommerce product admin panel
4. PostgreSQL database for synced products

## Credits

Built with:
- Next.js 14+ (App Router)
- Material-UI v5
- WooCommerce REST API v3
- PostgreSQL + Prisma ORM
- Custom WooRentalBridge module

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready
