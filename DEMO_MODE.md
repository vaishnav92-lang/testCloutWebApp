# Clout Careers - Demo Mode

## Overview

The demo mode provides a fully interactive, session-only preview of the Clout Careers platform without requiring authentication or affecting the production database.

## Features

### ✨ What's Included
- **Demo Dashboard** - Overview of user profile, stats, and recent activity
- **Job Listings** - Browse and explore job opportunities
- **Endorsements** - Send/receive and decide on endorsements
- **Trust Allocations** - Allocate trust across your network
- **Network Relationships** - View and manage professional connections
- **Referrals** - Track job referrals and placements

### 🔐 Security & Data Isolation
- **No Database Writes** - All data is stored in browser memory only
- **Session-Only State** - Data clears on logout or browser refresh
- **No Authentication** - Enter demo without credentials
- **Isolated from Production** - Zero impact on live system

### 📊 Mock Data Included
The demo comes pre-populated with:
- **5 Demo Users** - Each with profile, clout score, and relationships
- **4 Job Postings** - Various roles across different companies
- **3 Endorsements** - Both received and given endorsements
- **4 Trust Allocations** - Pre-configured trust network
- **3 Relationships** - Established professional connections
- **3 Referrals** - Active referrals with different statuses

## How to Access

### From Landing Page
1. Visit the home page (`/`)
2. Click **"Try Demo"** button
3. Click **"Start Demo Session"** to begin
4. Explore the full platform

### Direct Link
Navigate directly to `/demo` - you'll be redirected to login if needed

## Demo Flow

```
Home Page (/demo/auth/login)
    ↓
Start Demo Session
    ↓
Demo Dashboard (/demo/dashboard)
    ├── Jobs (/demo/jobs)
    │   └── Job Details (/demo/jobs/[id])
    ├── Endorsements (/demo/endorsements/[id])
    ├── Trust Allocations (/demo/trust-allocations)
    └── Relationships (/demo/relationships)
```

## Data Management

### State Management
- Uses React Context (`DemoProvider`) for in-memory state
- `useDemoContext()` hook provides access to mock data
- All updates are kept in component state only

### Mock Data Structure
Located in `/src/lib/demo-data.ts`:
- `DemoUser` - User profile with clout score and tier
- `DemoJob` - Job postings
- `DemoEndorsement` - Endorsements with workflow status
- `DemoTrustAllocation` - Trust distribution
- `DemoRelationship` - Network connections
- `DemoReferral` - Job referral tracking

### Demo Session
- Demo authentication via `/api/demo/auth/login`
- Token stored in `localStorage` with 7-day expiry (demo only)
- Session cleared on logout button
- Refresh page clears session automatically

## Key Pages

### Dashboard (`/demo/dashboard`)
- User stats: clout score, connections, endorsements, pending actions
- Pending endorsements to review
- Recent job opportunities
- Active referrals
- Trust network sidebar
- Network connections viewer

### Jobs (`/demo/jobs` & `/demo/jobs/[id]`)
- Browse all job listings
- View detailed job information
- See salary ranges and locations
- Network connections at each company
- Apply or refer options (demo-enabled)

### Endorsements (`/demo/endorsements/[id]`)
- Review endorsement details
- See highlighted strengths
- Decide on endorsement status:
  - **Active Matching** - Share with employers
  - **Private** - Keep private but count toward Clout
  - **Don't Use** - Archive endorsement

### Trust Allocations (`/demo/trust-allocations`)
- Allocate trust points (0-100%) across network
- See current allocations and trust scores
- Edit allocations in real-time
- Visual feedback with progress bars

### Relationships (`/demo/relationships`)
- View all established relationships
- See relationship type and duration
- Current trust allocation to each person
- Network statistics

## Logout & Data Clearing

### Logout Button
Located in dashboard header - clicking **"Logout (Clear Data)"**:
1. Removes demo token from localStorage
2. Clears all in-memory state
3. Redirects to demo login page
4. All changes are permanently lost

### Automatic Clearing
Data is also cleared when:
- Browser page refreshed
- Browser tab closed
- LocalStorage is cleared
- 7-day session expiry (in real usage)

## Development Notes

### Adding More Mock Data
Edit `/src/lib/demo-data.ts`:
```typescript
const createMockUsers = (): DemoUser[] => {
  // Add more users here
}
```

### Adding New Demo Pages
1. Create page in `/src/app/demo/[page]/page.tsx`
2. Use `useDemoContext()` to access mock data
3. Update navigation as needed

### Testing Demo Mode
1. Run `npm run dev`
2. Visit `http://localhost:3000/`
3. Click "Try Demo"
4. Test all flows without authentication

## Technical Implementation

### Files Created
- `/src/lib/demo-data.ts` - Mock data generators
- `/src/components/providers/demo-provider.tsx` - React Context provider
- `/src/app/demo/layout.tsx` - Demo authentication layout
- `/src/app/demo/page.tsx` - Demo router
- `/src/app/demo/auth/login/page.tsx` - Demo login page
- `/src/app/api/demo/auth/login/route.ts` - Demo auth API
- `/src/app/demo/dashboard/page.tsx` - Main demo dashboard
- `/src/app/demo/jobs/page.tsx` - Job listings
- `/src/app/demo/jobs/[id]/page.tsx` - Job details
- `/src/app/demo/endorsements/[id]/page.tsx` - Endorsement workflow
- `/src/app/demo/trust-allocations/page.tsx` - Trust management
- `/src/app/demo/relationships/page.tsx` - Network viewer

### Integration Points
- Updated `/src/app/page.tsx` with "Try Demo" button on homepage

## Future Enhancements

Possible additions:
- Mock API responses for data fetching simulation
- Endorsement creation form in demo
- Grantmaker functionality demo
- Hiring manager job posting demo
- Admin panel overview
- Interactive trust score visualization
- Referral chain animation

## Support

For issues or questions about demo mode:
1. Check this documentation
2. Review `/src/lib/demo-data.ts` for data structure
3. Check browser console for any errors
4. Clear localStorage and restart demo

---

**Demo Mode Created:** November 2025
**Status:** Production Ready
