# Project Crew & Transport Management Setup

## Overview
This document outlines the implementation of Stage 4 (Crew Details) and Stage 5 (Transport) for the project quote system.

## Database Schema

### Models Created
1. **Project** - Main project container
   - Links to crew details and transport
   - Tracks project status (draft, submitted, approved, etc.)

2. **CrewDetail** - Stage 4: Crew management
   - Work types: Loading/Offloading, Buttoning up, Standby, Build, Takedown, Roof/Floor/Walls, Carpeting/Cleaning
   - Fields: numberOfCrew, shiftsNeeded, fare, accommodation

3. **Transport** - Stage 5: Transport logistics
   - Fields: vehicleType, numberOfTrips, pricePerTrip, contingency

## Setup Instructions

### 1. Database Migration
Run the following command to sync the new models:

```bash
npx prisma db push
```

Or generate and apply a migration:

```bash
npx prisma migrate dev --name add_crew_transport_models
npx prisma generate
```

### 2. API Endpoints

**Projects:**
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project by ID
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

**Crew Details:**
- `GET /api/projects/[id]/crew-details` - Get all crew details for a project
- `POST /api/projects/[id]/crew-details` - Add crew detail

**Transport:**
- `GET /api/projects/[id]/transport` - Get all transport for a project
- `POST /api/projects/[id]/transport` - Add transport

### 3. Component Usage

```tsx
import ProjectQuoteForm from '@/components/projects/ProjectQuoteForm'

// In your page component
<ProjectQuoteForm projectId={projectId} projectName="My Project" />
```

## Key Features Implemented

### Stage 4: Crew Details
✅ Multiple work types support
✅ Add/Remove crew details dynamically
✅ Table view of all crew details
✅ Validation for required fields
✅ "Back" and "Save and Next" buttons

### Stage 5: Transport
✅ Multiple transport entries
✅ Automatic total calculation (trips × price + contingency)
✅ Table view of all transport details
✅ Validation to prevent "undefined crew number" error
✅ "Back" and "Submit" buttons

## Bug Fixes

### Issue: "undefined array key – crew number" in Stage 5
**Solution:** Added validation in Stage 5 to check if crew details exist before allowing submission:

```tsx
if (!crewDetails || crewDetails.length === 0) {
  alert('Error: Crew details not found. Please go back and complete Stage 4.')
  return
}
```

The crew details are now passed from Stage 4 to Stage 5 through the parent component state.

## Navigation Flow

```
Stage 4 (Crew Details)
  ↓
[Back] ← → [Save and Next]
  ↓
Stage 5 (Transport)
  ↓
[Back] ← → [Submit]
```

## Work Types Available

1. Loading / Offloading
2. Buttoning up / During event
3. Standby
4. Build
5. Takedown / Return
6. Roof / Floor / Walls
7. Carpeting and General cleaning

## Database Service Functions

Located in `src/lib/db/projects.ts`:

- `createProject()`, `getProjectById()`, `getAllProjects()`, `updateProject()`, `deleteProject()`
- `addCrewDetail()`, `getCrewDetailsByProjectId()`, `updateCrewDetail()`, `deleteCrewDetail()`
- `addTransport()`, `getTransportByProjectId()`, `updateTransport()`, `deleteTransport()`

## Future Enhancements

- [ ] Add edit functionality for existing crew details
- [ ] Add edit functionality for existing transport
- [ ] Add cost summary/totals view
- [ ] Add PDF export for quotes
- [ ] Add email notifications on submission
- [ ] Add approval workflow
