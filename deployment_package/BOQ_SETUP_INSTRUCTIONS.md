# BOQ (Bill of Quantities) System Setup Instructions

## ✅ Completed Files

### 1. API Endpoints Created
- `/src/app/api/boq/generate/route.ts` - Generate BOQ from quote
- `/src/app/api/boq/list/route.ts` - List all BOQs
- `/src/app/api/boq/[id]/route.ts` - Get/Update specific BOQ

### 2. Database Schema Updated
- Added `BOQ` model to `/src/prisma/schema.prisma`

## 🔧 Required: Database Migration

**IMPORTANT:** Run this command to apply the schema changes:

```bash
npx prisma migrate dev --name add_boq_model
npx prisma generate
```

This will:
1. Create the `BOQ` table in your PostgreSQL database
2. Generate Prisma client with BOQ methods

## 📋 Next Steps (In Progress)

I'm now creating:
1. BOQ List page UI (`/en/apps/boq/list`)
2. BOQ View/Print page (`/en/apps/boq/view/[id]`)
3. BOQ Dashboard card
4. Navigation menu updates

## 🎯 BOQ Features

### Automatic Categorization
BOQ items are automatically categorized into:
1. EVENT STRUCTURES (tents, cottages, etc.)
2. FLOORING & CARPETING
3. INTERNAL PARTITIONS
4. LIGHTING & DRAPERY
5. FURNITURE & EVENT SETUP
6. SANITARY FACILITIES & ACCESSORIES

### Professional BOQ Format
- Item numbering (1.1, 1.2, 2.1, etc.)
- Units of measurement (No, sqm, linear meters)
- Quantity, Rate, and Amount columns
- Section subtotals
- VAT calculation (16%)
- Grand total

### BOQ Generation
- Generate from any tent quote
- Maintains link to source quote
- Status tracking (draft, approved, sent, completed)
- Remarks/notes support

## 🔗 Integration Points

- **From Quotes**: Generate BOQ button on quote detail page
- **Dashboard**: BOQ summary card showing stats
- **Menu**: Dedicated BOQ section in navigation
- **Export**: Print-friendly format (PDF export coming)
