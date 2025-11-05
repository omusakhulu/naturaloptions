# Project BOQ & Cost Reports - Implementation Guide

## 🎉 What's Been Implemented

I've successfully integrated **Project → BOQ** and **Project Cost Reports** into your system. Both features are now accessible under the **Projects** menu.

---

## ✅ Completed Features

### 1. **Database Schema Updates**

#### BOQ Model Enhanced:
- ✅ Added `projectId` field (String/cuid) to link BOQs to projects
- ✅ Maintains backward compatibility with quote-based BOQs
- ✅ Added index on `projectId` for fast lookups

#### New ProjectCostReport Model:
- ✅ Tracks estimated vs actual costs
- ✅ Calculates variance and variance percentage
- ✅ Revenue and profit margin tracking
- ✅ Detailed cost breakdowns:
  - Labor costs (from crew details)
  - Material costs
  - Equipment costs
  - Transportation costs (from transport)
  - Overhead costs
  - Other costs
- ✅ Status workflow: draft → in_progress → completed

---

### 2. **API Endpoints Created**

#### Project BOQ Generation:
**Endpoint**: `POST /api/projects/[id]/generate-boq`

**Features**:
- Generates BOQ from project crew details
- Includes transportation costs from project transport
- Pulls materials from linked order (if exists)
- Auto-categorizes into sections:
  1. Labor & Crew
  2. Transportation
  3. Materials & Equipment
- Calculates internal costs and profit margins
- Generates unique BOQ number: `BOQ-YYYY-#####`

**How it works**:
```javascript
// Client-side usage
const response = await fetch(`/api/projects/${projectId}/generate-boq`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})

const { success, boq } = await response.json()
```

---

#### Project Cost Report Generation:
**Endpoint**: `POST /api/projects/[id]/generate-cost-report`

**Features**:
- Calculates estimated costs from project data
- Accepts actual costs via request body
- Computes variance (actual - estimated)
- Calculates profit margin
- Generates unique report number: `CR-YYYY-#####`

**Request Body** (all optional, uses project data as fallback):
```json
{
  "actualLaborCost": 50000,
  "actualTransportCost": 15000,
  "actualMaterialCost": 30000,
  "actualEquipmentCost": 10000,
  "actualOverheadCost": 5000,
  "actualOtherCost": 2000,
  "startDate": "2025-01-15",
  "endDate": "2025-01-20",
  "status": "completed",
  "remarks": "Project completed successfully"
}
```

---

#### Cost Reports List:
**Endpoint**: `GET /api/projects/cost-reports`

**Query Parameters**:
- `projectId`: Filter by specific project
- `status`: Filter by status (draft, in_progress, completed, all)
- `search`: Search by report number or project name

**Response**:
```json
{
  "success": true,
  "costReports": [...],
  "summary": {
    "total": 10,
    "totalRevenue": 500000,
    "totalProfit": 150000,
    "avgProfitMargin": "30.00"
  }
}
```

---

#### Individual Cost Report:
**Endpoints**: 
- `GET /api/projects/cost-reports/[id]` - Fetch single report
- `PUT /api/projects/cost-reports/[id]` - Update report

**Update Features**:
- Update status, remarks, dates
- Recalculate totals when actual costs change
- Auto-updates variance and profit margins

---

### 3. **Navigation Menu Updates**

Both features added to **Projects** menu:

**Vertical Navigation** (`verticalMenuData.jsx`):
```javascript
{
  label: 'Projects',
  icon: 'tabler-briefcase',
  children: [
    { label: 'List', href: '/apps/projects/list' },
    { label: 'Create Quote', href: '/apps/projects/create' },
    { label: 'BOQ (Bills)', href: '/apps/projects/boq/list' },      // ← NEW
    { label: 'Cost Reports', href: '/apps/projects/cost-reports/list' } // ← NEW
  ]
}
```

**Horizontal Navigation** (`horizontalMenuData.jsx`):
- ✅ Same structure as vertical menu
- ✅ Appears in top navigation bar

---

## 🚀 Next Steps (Required)

### Step 1: Run Database Migration

```bash
npx prisma db push
```

This will:
- Add `projectId` to BOQ table
- Create ProjectCostReport table
- Add all indexes

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

---

## 📋 UI Pages to Create

You'll need to create these pages (I can help with any of these):

### 1. Project BOQ List Page
**Path**: `src/app/[lang]/(dashboard)/(private)/apps/projects/boq/list/page.jsx`

**Features to include**:
- List all BOQs generated from projects
- Filter by project
- Search by BOQ number or project name
- Status filter
- Link to BOQ view page (reuse existing `/apps/boq/view/[id]`)
- "Generate BOQ" button that shows project selector

### 2. Cost Reports List Page
**Path**: `src/app/[lang]/(dashboard)/(private)/apps/projects/cost-reports/list/page.jsx`

**Features to include**:
- List all cost reports
- Display key metrics:
  - Report number
  - Project name
  - Estimated cost
  - Actual cost
  - Variance (with color: green if under, red if over)
  - Profit margin
  - Status
- Search and filter
- View/Edit buttons

### 3. Cost Report View/Edit Page
**Path**: `src/app/[lang]/(dashboard)/(private)/apps/projects/cost-reports/view/[id]/page.jsx`

**Features to include**:
- Professional report layout
- Summary section (estimated vs actual)
- Visual charts/graphs:
  - Variance by category (bar chart)
  - Profit margin indicator (gauge or progress)
- Cost breakdown table:
  - Category | Estimated | Actual | Variance | Variance %
- Edit mode for updating actual costs
- Print functionality

---

## 💼 Usage Workflow

### For Project BOQ:

1. **User creates a project** with crew details and transport
2. **User navigates** to Projects → BOQ (Bills)
3. **Clicks "Generate BOQ"** and selects project
4. **System creates BOQ** with:
   - Labor costs from crew details
   - Transport costs from transport data
   - Materials from linked order (if any)
5. **User can edit/print** BOQ like quote-based BOQs

### For Cost Reports:

1. **Project is in progress** or completed
2. **User navigates** to Projects → Cost Reports
3. **Clicks "Generate Report"** and selects project
4. **Enters actual costs**:
   - Labor, materials, equipment, etc.
   - Or system uses estimates as defaults
5. **Report shows**:
   - Estimated vs Actual comparison
   - Variance analysis
   - Profit margin calculation
6. **User can update** actual costs as project progresses
7. **Print/Export** for management review

---

## 📊 Data Structure Examples

### BOQ Generated from Project:

```javascript
{
  sections: [
    {
      sectionNo: "1",
      sectionTitle: "LABOR & CREW",
      items: [
        {
          itemNo: "1.1",
          description: "setup - 10 crew x 2 shifts",
          unit: "Shift",
          quantity: 20,
          cost: 800,     // 80% of rate
          rate: 1000,
          amount: 20000,
          costAmount: 16000,
          remarks: "Accommodation: Hotel XYZ"
        }
      ],
      subtotal: 20000,
      costSubtotal: 16000
    },
    {
      sectionNo: "2",
      sectionTitle: "TRANSPORTATION",
      items: [
        {
          itemNo: "2.1",
          description: "Truck - 3 vehicle(s) from Nairobi to Mombasa",
          unit: "Trip",
          quantity: 3,
          cost: 8500,    // 85% of rate
          rate: 10000,
          amount: 30000,
          costAmount: 25500,
          remarks: "Route: Nairobi to Mombasa"
        }
      ],
      subtotal: 30000,
      costSubtotal: 25500
    }
  ],
  profitMargin: "25.86%"
}
```

### Cost Report Structure:

```javascript
{
  reportNumber: "CR-2025-00001",
  projectName: "Corporate Event - ABC Company",
  estimatedCost: "100000",
  actualCost: "95000",
  variance: "-5000",        // Under budget (good!)
  variancePercent: "-5.00", // 5% under
  revenue: "150000",
  profit: "55000",
  profitMargin: "36.67",    // Excellent margin
  
  laborCosts: {
    estimated: 50000,
    actual: 48000,
    variance: -2000
  },
  transportCosts: {
    estimated: 30000,
    actual: 32000,
    variance: 2000
  },
  materialCosts: {
    estimated: 0,
    actual: 15000,
    variance: 15000
  }
}
```

---

## 🎨 UI Component Recommendations

### For Cost Report Variance Display:

```jsx
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Typography variant="h6">
    {formatCurrency(variance)}
  </Typography>
  <Chip 
    label={variance < 0 ? 'Under Budget' : 'Over Budget'} 
    color={variance < 0 ? 'success' : 'error'} 
    size="small" 
  />
</Box>
```

### For Profit Margin Indicator:

```jsx
<Box sx={{ position: 'relative', display: 'inline-flex' }}>
  <CircularProgress 
    variant="determinate" 
    value={Math.min(profitMargin, 100)} 
    size={100}
    thickness={5}
    color={profitMargin > 30 ? 'success' : profitMargin > 20 ? 'info' : 'warning'}
  />
  <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Typography variant="h6">{profitMargin}%</Typography>
  </Box>
</Box>
```

---

## 📱 Mobile/Responsive Considerations

- Cost reports should display well on tablets
- Consider collapsible sections for mobile
- Charts should be touch-friendly
- Use responsive grids for cost breakdowns

---

## 🔐 Security & Permissions

Consider adding:
- Role-based access (only managers can see profit/cost data)
- Audit trail for cost report updates
- Approval workflow for high-variance reports

---

## 📈 Analytics Opportunities

With this data, you can build:
- **Project Performance Dashboard**:
  - Average profit margin by project type
  - Top performing vs underperforming projects
  - Budget variance trends
  
- **Cost Forecasting**:
  - Historical cost data for better estimates
  - Seasonal cost variations
  - Resource utilization rates

- **Profitability Reports**:
  - Most profitable project types
  - Cost optimization opportunities
  - ROI analysis

---

## 🐛 Testing Checklist

- [ ] Generate BOQ from project with crew details
- [ ] Generate BOQ from project with transport
- [ ] Generate BOQ from project with linked order
- [ ] View generated BOQ (should show all sections)
- [ ] Edit BOQ inline (existing feature should work)
- [ ] Generate cost report with default values
- [ ] Generate cost report with custom actual costs
- [ ] Update cost report actual costs
- [ ] Verify variance calculations
- [ ] Check profit margin calculations
- [ ] List all cost reports
- [ ] Filter cost reports by project
- [ ] Search cost reports
- [ ] Print cost report

---

## 🎯 Quick Start Commands

```bash
# 1. Update database
npx prisma db push

# 2. Generate Prisma client
npx prisma generate

# 3. Start dev server
pnpm dev

# 4. Test API endpoints
# Generate BOQ from project
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/generate-boq

# Generate Cost Report
curl -X POST http://localhost:3000/api/projects/PROJECT_ID/generate-cost-report \
  -H "Content-Type: application/json" \
  -d '{"actualLaborCost": 50000, "actualTransportCost": 15000}'
```

---

## 📞 Need Help?

I can assist with:
- Creating the UI pages (BOQ list, Cost Report list/view)
- Adding charts and visualizations
- Implementing approval workflows
- Building analytics dashboards
- Custom cost categories
- Export to PDF/Excel features

Just let me know what you'd like to implement next! 🚀
