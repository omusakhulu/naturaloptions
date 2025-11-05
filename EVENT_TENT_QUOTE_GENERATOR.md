# Event Tent Rental Quote Generator

## Overview
A comprehensive quote generation system for event tent rentals that allows users to configure various options and receive instant pricing with detailed breakdowns.

## Features

### ✅ Event Type Selection
- **Cocktail** - Standing/cocktail style events
- **Theater** - Theater-style seating arrangements
- **Banquet** - Banquet/dining setup
- **Classroom** - Classroom-style seating
- **Other** - Custom event types with text input

### ✅ Guest Capacity
- Range: 10-160 guests
- Automatic pricing calculation based on event type and guest count
- Rate cards integrated for all event types

### ✅ Tent/Structure Options

#### 1. Pagoda Tent
**Sizes Available:**
- 3m (Soft Wall only)
- 5m (Soft Wall or Hard Wall)
- 6m (Soft Wall or Hard Wall)
- 10m B line (Soft Wall only)

**Pricing:**
- 3m Soft Wall: KSh 5,000
- 5m Soft Wall: KSh 9,000 | Hard Wall: KSh 15,000
- 6m Soft Wall: KSh 12,000 | Hard Wall: KSh 18,000
- 10m B line Soft Wall: KSh 28,000

#### 2. OmniSpace Ellipse & Rondo
**Structures:**
- Rondo 15m: KSh 200,000 (177 sqm capacity)
- Rondo 20m: KSh 350,000 (314 sqm capacity)

**5m Segments:**
- Add 0-28 segments (5m-140m)
- Cost: KSh 50,000 per segment
- Extends tent length dynamically

#### 3. OmniSpace Apse End
**Structures:**
- Apse End 15m: KSh 150,000
- Apse End 20m: KSh 200,000

**5m Segments:**
- Add 0-28 segments (5m-140m)
- Cost: KSh 50,000 per segment

### ✅ Flooring Cover (Optional)
**Types:**
- Vinyl/Mkeka wa Mbao: KSh 3,000/sqm
- Carpeting: KSh 250/sqm
- With white sticker: KSh 750/sqm

**Configuration:**
- Checkbox to include flooring
- Select flooring type
- Specify area in square meters

### ✅ Internal Walls/Partitions (Optional)
**Widths Available:**
- 10m, 15m, 20m, 25m, 40m, 50m

**Wall Types:**
- Soft Wall
- Hard Wall

**Pricing:**
| Width | Hard Wall | Soft Wall |
|-------|-----------|-----------|
| 10m   | 20,000    | 15,000    |
| 15m   | 25,000    | 20,000    |
| 20m   | 30,000    | 25,000    |
| 25m   | 40,000    | 30,000    |
| 40m   | 60,000    | 45,000    |
| 50m   | 75,000    | 55,000    |

### ✅ Accessories (Optional)
Multiple selection checkboxes for:
- Hand Wash Station: KSh 9,000
- Double Hand Wash Station: KSh 12,000
- Single Trailer Toilets: KSh 15,000
- Double Trailer Toilets: KSh 25,000
- Presidential Toilets: KSh 45,000
- Portaloos (single): KSh 8,000

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── quotes/
│   │       └── event-tent/
│   │           └── calculate/
│   │               └── route.ts                    # Quote calculation API
│   └── [lang]/
│       └── (dashboard)/
│           └── (private)/
│               └── apps/
│                   └── quotes/
│                       └── event-tent/
│                           ├── page.tsx                        # Page wrapper
│                           └── EventTentQuoteForm.tsx          # Main form component
└── components/
    └── layout/
        └── vertical/
            └── VerticalMenu.jsx                   # Updated with Quotes menu
```

## API Endpoint

### POST `/api/quotes/event-tent/calculate`
Calculates quote based on user selections.

**Request Body:**
```json
{
  "eventType": "Cocktail",
  "numberOfGuests": 100,
  "tentType": "rondo",
  "rondoStructure": "Rondo 15m",
  "rondoSegments": 4,
  "flooringType": "Carpeting",
  "flooringArea": 250,
  "partitionWidth": "15m",
  "partitionWallType": "soft",
  "accessories": [
    "Hand Wash Station",
    "Single Trailer Toilets"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "quote": {
    "eventDetails": {
      "eventType": "Cocktail",
      "numberOfGuests": 100
    },
    "lineItems": [
      {
        "description": "Rondo 15m Structure",
        "quantity": 1,
        "unitPrice": 200000,
        "totalPrice": 200000
      },
      {
        "description": "5m Segments",
        "quantity": 4,
        "unitPrice": 50000,
        "totalPrice": 200000
      },
      {
        "description": "Cocktail Setup for 100 Guests",
        "quantity": 1,
        "unitPrice": 1250,
        "totalPrice": 1250
      },
      {
        "description": "Flooring: Carpeting (250 sqm)",
        "quantity": 250,
        "unitPrice": 250,
        "totalPrice": 62500
      },
      {
        "description": "Internal Partition 15m (Soft Wall)",
        "quantity": 1,
        "unitPrice": 20000,
        "totalPrice": 20000
      },
      {
        "description": "Hand Wash Station",
        "quantity": 1,
        "unitPrice": 9000,
        "totalPrice": 9000
      },
      {
        "description": "Single Trailer Toilets",
        "quantity": 1,
        "unitPrice": 15000,
        "totalPrice": 15000
      }
    ],
    "subtotal": 507750,
    "total": 507750
  }
}
```

## Pricing Logic

### Event-Based Rates (Per Guest)

#### Cocktail Style
```
10 Pax: 125    |  40 Pax: 500   |  80 Pax: 1000   |  120 Pax: 1500
15 Pax: 188    |  50 Pax: 625   |  90 Pax: 1125   |  130 Pax: 1625
20 Pax: 250    |  60 Pax: 750   |  100 Pax: 1250  |  140 Pax: 1750
25 Pax: 313    |  70 Pax: 875   |  110 Pax: 1375  |  150 Pax: 1875
30 Pax: 375    |                |                 |  160 Pax: 2000
```

#### Theater Style
```
10 Pax: 100    |  40 Pax: 400   |  80 Pax: 800    |  120 Pax: 1200
15 Pax: 150    |  50 Pax: 500   |  90 Pax: 900    |  130 Pax: 1300
20 Pax: 200    |  60 Pax: 600   |  100 Pax: 1000  |  140 Pax: 1400
25 Pax: 250    |  70 Pax: 700   |  110 Pax: 1100  |  150 Pax: 1500
30 Pax: 300    |                |                 |  160 Pax: 1600
```

#### Banquet Style
```
10 Pax: 71     |  40 Pax: 286   |  80 Pax: 571    |  120 Pax: 857
15 Pax: 107    |  50 Pax: 357   |  90 Pax: 643    |  130 Pax: 929
20 Pax: 143    |  60 Pax: 429   |  100 Pax: 714   |  140 Pax: 1000
25 Pax: 179    |  70 Pax: 500   |  110 Pax: 786   |  150 Pax: 1071
30 Pax: 214    |                |                 |  160 Pax: 1143
```

#### Classroom Style
```
10 Pax: 54     |  30 Pax: 162   |  50 Pax: 270
15 Pax: 81     |  40 Pax: 216   |  60 Pax: 324
20 Pax: 108    |
25 Pax: 135    |
```

### Nearest Rate Matching
If exact guest count isn't in the rate card:
- System finds the nearest higher guest count
- Uses that rate for pricing
- Ensures customers aren't undercharged

**Example:**
- User enters 85 guests for Cocktail
- No exact rate for 85
- System uses rate for 90 guests (1,125)

## Usage Guide

### 1. Access the Feature
Navigate to: **Quotes > Event Tent Quote**

Or visit: `/en/apps/quotes/event-tent`

### 2. Configure Event Details
- Select event type (Cocktail, Theater, Banquet, Classroom, or Other)
- For "Other", provide custom event name
- Enter number of guests (10-160)

### 3. Choose Tent/Structure
Select one of three options:

**Pagoda Tent:**
1. Choose size (3m, 5m, 6m, 10m B line)
2. Select wall type (if applicable)

**OmniSpace Rondo:**
1. Choose structure width (15m or 20m)
2. Add 5m segments if needed (0-28)

**OmniSpace Apse:**
1. Choose structure width (15m or 20m)
2. Add 5m segments if needed (0-28)

### 4. Add Optional Items

**Flooring:**
1. Check "Include Flooring"
2. Select flooring type
3. Enter area in sqm

**Partitions:**
1. Check "Include Partition"
2. Select width
3. Choose wall type (Soft/Hard)

**Accessories:**
- Check any needed accessories

### 5. Generate Quote
- Click "Generate Quote" button
- Wait for calculation (usually instant)
- Review detailed breakdown

### 6. Quote Display
The generated quote shows:
- **Event summary** (type and guest count)
- **Line items table** with:
  - Description
  - Quantity
  - Unit price
  - Total price
- **Grand total** in KSh
- **Validity notice** (30 days)

## Example Scenarios

### Scenario 1: Corporate Cocktail Event
```
Event Type: Cocktail
Guests: 120
Tent: Rondo 20m + 6 segments (30m length)
Flooring: Carpeting, 350 sqm
Partition: 20m Hard Wall
Accessories: Double Hand Wash Station, Presidential Toilets

Quote:
- Rondo 20m Structure: KSh 350,000
- 5m Segments (6): KSh 300,000
- Cocktail Setup (120 pax): KSh 1,500
- Carpeting (350 sqm): KSh 87,500
- Partition 20m Hard Wall: KSh 30,000
- Double Hand Wash Station: KSh 12,000
- Presidential Toilets: KSh 45,000
TOTAL: KSh 826,000
```

### Scenario 2: Wedding Banquet
```
Event Type: Banquet
Guests: 150
Tent: Apse End 15m + 10 segments (50m)
Flooring: With white sticker, 400 sqm
Partition: 40m Soft Wall
Accessories: Hand Wash Station, Double Trailer Toilets (2x)

Quote:
- Apse End 15m: KSh 150,000
- 5m Segments (10): KSh 500,000
- Banquet Setup (150 pax): KSh 1,071
- White Sticker Flooring (400 sqm): KSh 300,000
- Partition 40m Soft Wall: KSh 45,000
- Hand Wash Station: KSh 9,000
- Double Trailer Toilets: KSh 50,000
TOTAL: KSh 1,055,071
```

### Scenario 3: Simple Theater Event
```
Event Type: Theater
Guests: 60
Tent: Pagoda 6m Hard Wall
Accessories: Portaloos (2x)

Quote:
- Pagoda 6m Hard Wall: KSh 18,000
- Theater Setup (60 pax): KSh 600
- Portaloos (2): KSh 16,000
TOTAL: KSh 34,600
```

## Technical Details

### Dependencies
- Next.js App Router
- Material-UI (MUI) v7
- TypeScript

### State Management
- React useState hooks
- Form state managed locally
- No external state library needed

### Pricing Data
All pricing stored in API route:
- Easy to update rates
- Centralized pricing logic
- No hardcoded values in UI

### Calculation Algorithm
1. Validates input data
2. Calculates base tent/structure cost
3. Adds event-based pricing (if applicable)
4. Adds flooring costs (area × price/sqm)
5. Adds partition costs
6. Adds accessories
7. Sums all line items
8. Returns detailed breakdown

## Benefits

### For Business
✅ **Instant Quotes** - No manual calculation needed
✅ **Professional** - Detailed breakdowns build trust
✅ **Flexible** - Easy to update pricing
✅ **Scalable** - Add new products/options easily
✅ **Accurate** - Eliminates human error in quotes

### For Customers
✅ **Transparent** - See exact pricing breakdown
✅ **Fast** - Get quotes in seconds
✅ **Comprehensive** - All options in one place
✅ **Clear** - Easy to understand pricing
✅ **Flexible** - Customize as needed

## Future Enhancements

### Planned Features
- [ ] Save quotes to database
- [ ] Email quote to customer
- [ ] PDF generation/download
- [ ] Quote versioning/revisions
- [ ] Convert quote to order
- [ ] Multi-day rental pricing
- [ ] Seasonal pricing adjustments
- [ ] Discount codes
- [ ] Payment terms integration
- [ ] Customer account linking
- [ ] Quote approval workflow
- [ ] Tax calculations (VAT)
- [ ] Delivery/setup fee calculator
- [ ] Insurance options
- [ ] Booking calendar integration

## Troubleshooting

### Quote Not Calculating
1. Check all required fields are filled
2. Verify guest count is within range (10-160)
3. Check browser console for errors
4. Ensure tent type is selected

### Incorrect Pricing
1. Verify selections match expectations
2. Check pricing data in API route
3. Review line items breakdown
4. Confirm segment counts are correct

### Form Not Loading
1. Check file paths are correct
2. Verify MUI is installed
3. Check for TypeScript errors
4. Clear browser cache

## Support

For issues or questions:
1. Check browser Developer Tools console
2. Review API response in Network tab
3. Verify all form fields have valid values
4. Check pricing data in route.ts

## Credits

Built with:
- Next.js 15+ (App Router)
- Material-UI v7
- TypeScript
- Custom pricing engine

---

**Last Updated**: October 2024
**Version**: 1.0.0
**Status**: ✅ Production Ready
