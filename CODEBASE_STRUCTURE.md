# Clout Web App - Codebase Structure Overview

## 1. DATABASE SCHEMA

### Core Models for Referrals, Jobs, Endorsements & Relationships

#### User Model (users table)
```
- id: String (Primary Key)
- email: String (Unique)
- firstName, lastName: String
- referralCode: String (Unique) - for user invitations
- referredById: String - self-referential relationship (who referred this user)
- availableInvites: Int (default: 3)
- allocatedTrust: Int - trust allocated to others
- availableTrust: Int (default: 100)
- totalTrustPoints: Int (default: 100)
- cloutScore, endorsementsScore, networkValue: Float
- successfulReferrals: Int
- tier: NodeTier enum (CONNECTOR, TALENT_SCOUT, NETWORK_HUB)
- userIntent: UserIntent enum (RECOMMEND_ONLY, HYBRID, ACTIVELY_LOOKING, etc.)

Relations:
- referralsAsCandidate: Referral[] (user is the candidate)
- referralsAsReferrer: Referral[] (user is the referrer)
- relationshipsAsUser1, relationshipsAsUser2: Relationship[] (bidirectional)
- endorsementsReceived, endorsementsGiven: Endorsement[]
- trustAllocationsGiven, trustAllocationsReceived: TrustAllocation[]
- jobForwardsSent, jobForwardsReceived: JobForward[]
```

#### Job Model (jobs table)
```
- id: String (Primary Key)
- title, description: String
- companyId: String (FK to Company)
- ownerId: String (FK to User - hiring manager)
- status: JobPostingStatus enum (DRAFT, ACTIVE, FILLED, CLOSED)
- referralBudget: Int (budget for referral bonuses)
- referralPreference: ReferralPreference enum (MANUAL_SCREEN, AUTO_EMAIL, CONFIDENCE_BASED)
- location, remote, salaryMin, salaryMax: Various location & compensation fields
- publishedAt: DateTime
- locationType: LocationType enum (REMOTE, HYBRID, IN_PERSON)

Relations:
- company: Company
- owner: User (hiring manager)
- referrals: Referral[]
- endorsements: Endorsement[]
- jobForwards: JobForward[]
```

#### Referral Model (referrals table)
```
- id: String (Primary Key)
- jobId: String (FK to Job)
- candidateId: String (FK to User - the candidate being referred)
- referrerNodeId: String (FK to User - who made the referral)
- chainPath: String[] - materialized path of all nodes in the referral chain
- chainDepth: Int - length of the chain minus 1
- status: ReferralStatus enum (PENDING, SCREENING, INTERVIEWING, HIRED, REJECTED)
- howYouKnow: String - relationship description
- confidenceLevel: String (high, medium, low)
- notes: String - additional notes
- createdAt, updatedAt: DateTime

Relations:
- job: Job
- candidate: User
- referrer: User (referrerNodeId)
```

#### Endorsement Model (endorsements table)
```
- id: String (Primary Key)
- endorserId: String (FK to User - who is endorsing)
- endorsedUserId: String (FK to User - who is being endorsed, nullable)
- endorsedUserEmail: String (required for pre-signup endorsements)
- jobId: String (nullable FK to Job - for job-specific endorsements)
- isJobReferral: Boolean (default: false)
- status: EndorsementStatus enum (PENDING_CANDIDATE_ACTION, PRIVATE, ACTIVE_MATCHING, NOT_USING)
- relationship, workTogether, strengths, rolesValueAdd, workOutput: String (endorsement details)
- hoursInteraction, complementaryPartner, recommendation: String
- candidateNotifiedAt, candidateRespondedAt: DateTime
- createdAt, updatedAt: DateTime

Relations:
- endorser: User
- endorsedUser: User (nullable)
- job: Job (nullable)
- releases: EndorsementRelease[]
```

#### Relationship Model (relationships table)
```
- id: String (Primary Key)
- user1Id, user2Id: String (FKs to User, unique together)
- status: RelationshipStatus enum (PENDING, CONFIRMED, DECLINED)
- user1TrustScore, user2TrustScore: Int (optional)
- user1TrustAllocated, user2TrustAllocated: Int (trust points allocated)
- createdAt, updatedAt: DateTime

Relations:
- user1: User
- user2: User
```

#### JobForward Model (job_forwards table)
```
- id: String (Primary Key)
- jobId: String (FK to Job)
- fromNodeId: String (FK to User - who forwarded)
- toNodeId: String (FK to User - who received forward)
- message: String (optional message)
- createdAt: DateTime
- Unique constraint: (jobId, fromNodeId, toNodeId)

Relations:
- job: Job
- fromNode: User
- toNode: User
```

#### Invitation Model (invitations table)
```
- id: String (Primary Key)
- email: String
- senderId: String (FK to User)
- receiverId: String (FK to User, nullable)
- trustScore: Int
- status: InvitationStatus enum (PENDING, ACCEPTED, DECLINED, EXPIRED)
- sentAt, respondedAt: DateTime
- Unique constraint: (senderId, email)
```

#### TrustAllocation Model (trust_allocations table)
```
- id: String (Primary Key)
- giverId: String (FK to User)
- receiverId: String (FK to User)
- proportion: Float (percentage of trust allocated)
- createdAt, updatedAt: DateTime
- Unique constraint: (giverId, receiverId)
```

#### ComputedTrustScore Model (computed_trust_scores table)
```
- id: String (Primary Key)
- userId: String (FK to User, unique)
- trustScore: Float (computed value)
- displayScore: Int (for UI display)
- rank: Int (user's rank in network)
- iterationCount: Int (eigentrust algorithm iterations)
- computedAt: DateTime
```

#### EndorsementRelease Model (endorsement_releases table)
```
- id: String (Primary Key)
- endorsementId: String (FK to Endorsement)
- employerId: String (FK to User)
- jobId: String (nullable FK to Job)
- releasedBy: ReleaseType enum (CANDIDATE, EMPLOYER_REQUEST)
- releasedAt: DateTime
```

---

## 2. API ENDPOINTS

### A. REFERRAL ENDPOINTS

#### POST /api/referrals/new
**Purpose**: Create a referral for a new person not yet on platform
**Authentication**: Required (session)
**Request Body**:
```json
{
  "jobId": "string",
  "candidateEmail": "string",
  "candidateName": "string",
  "message": "string (optional)",
  "referralReason": "string",
  "existingUserId": "string (optional)",
  "addedToNetwork": "boolean (optional)"
}
```
**Response**:
- If user exists: Creates Endorsement, sends referral email
- If user doesn't exist: Creates Invitation + Endorsement, sends both emails
- Returns: endorsementId, userExisted flag

**Business Logic**:
- Checks if user already exists by email
- If exists: Creates endorsement with job context
- If doesn't exist: Creates invitation and endorsement (both linked at signup)

---

#### POST /api/jobs/{id}/refer
**Purpose**: Refer a candidate for a job using the referral chain system
**Authentication**: Required (session)
**Request Body**:
```json
{
  "candidateId": "string (optional)",
  "candidateEmail": "string (required)",
  "howYouKnow": "string",
  "confidenceLevel": "string (high/medium/low)",
  "notes": "string (optional)"
}
```
**Response**:
```json
{
  "referral": {
    "id": "string",
    "jobId": "string",
    "candidateEmail": "string",
    "chainPath": ["string[]"],
    "chainDepth": "number",
    "howYouKnow": "string",
    "confidenceLevel": "string",
    "status": "PENDING",
    "createdAt": "DateTime"
  }
}
```

**Business Logic**:
- Calls `createReferral()` which:
  1. Reconstructs the referral chain from job forwards
  2. Creates Referral record with materialized chainPath
  3. Tracks chainDepth (number of intermediaries)

---

#### POST /api/referrals/delegate
**Purpose**: Forward a job opportunity to someone in network
**Authentication**: Required (session)
**Request Body**:
```json
{
  "jobId": "string",
  "delegateEmail": "string",
  "delegateName": "string",
  "message": "string"
}
```
**Response**:
```json
{
  "message": "Referral delegation sent successfully"
}
```

**Business Logic**:
- Records job forward in JobForward table
- If delegate is not on platform: Creates invitation + placeholder user
- Creates relationship between delegator and delegate (if exists)
- Allocates 10 trust points to the delegate
- Sends delegation email

---

#### POST /api/referrals/trusted
**Purpose**: Refer someone from trusted network
**Authentication**: Required (session)
**Request Body**:
```json
{
  "jobId": "string",
  "contactId": "string (user ID)",
  "message": "string (optional)",
  "referralReason": "string"
}
```
**Response**:
```json
{
  "message": "Referral submitted successfully",
  "endorsementId": "string"
}
```

**Business Logic**:
- Fetches referred user by ID
- Creates endorsement with job context
- Sends job referral email to referred user

---

#### PATCH /api/referrals/{id}/status
**Purpose**: Update referral status (used when candidate is hired)
**Authentication**: Required (session, must be job owner or admin)
**Request Body**:
```json
{
  "status": "PENDING | SCREENING | INTERVIEWING | HIRED | REJECTED"
}
```
**Response**: Updated referral object with new status

---

#### GET /api/referrals/{id}/payment-splits
**Purpose**: Calculate payment splits for a hired referral
**Authentication**: Required (session, must be job owner or admin)
**Query Parameters**:
- `amount` (optional): Total amount to split, defaults to job.referralBudget or 10000
**Response**:
```json
{
  "referralId": "string",
  "jobTitle": "string",
  "companyName": "string",
  "candidateEmail": "string",
  "chainDepth": "number",
  "totalAmount": "number",
  "splits": [
    {
      "nodeId": "string",
      "name": "string",
      "amount": "number"
    }
  ]
}
```

**Payment Algorithm**:
- **Direct Referral (Solo)**: Gets 100%
- **Chain Referral**: 
  - Direct referrer (last in chain): 70%
  - All intermediaries: Share 30% equally

---

#### GET /api/jobs/{id}/referrals
**Purpose**: Get all referrals for a job with chain details
**Authentication**: Required (session, must be job owner or admin)
**Response**: Array of referrals with full chain information

---

### B. ENDORSEMENT ENDPOINTS

#### POST /api/referrals/job-endorsement
**Purpose**: Create a job-specific referral using comprehensive endorsement form
**Authentication**: Required (session)
**Request Body**:
```json
{
  "jobId": "string",
  "candidateEmail": "string",
  "candidateName": "string",
  "relationship": "string",
  "workTogether": "string",
  "strengths": "string",
  "rolesValueAdd": "string",
  "workOutput": "string",
  "hoursInteraction": "string",
  "complementaryPartner": "string",
  "recommendation": "string",
  "referrerEmail": "string (optional)",
  "referrerName": "string (optional)"
}
```
**Response**:
```json
{
  "message": "Job referral with endorsement submitted successfully",
  "endorsementId": "string"
}
```

**Business Logic**:
- If candidate doesn't exist: Creates invitation
- Creates endorsement with full details and job context
- Validates one endorsement per endorser-endorsee pair

---

#### POST /api/endorsements/submit
**Purpose**: Submit a general endorsement (not job-specific)
**Authentication**: Required (session)
**Request Body**: Same structure as job-endorsement
**Response**: endorsementId

**Business Logic**:
- Validates endorser authentication matches session
- Prevents duplicate endorsements (one per pair)
- Creates endorsement without job context

---

#### POST /api/endorsements/{id}/decide
**Purpose**: Candidate decision on endorsement visibility
**Authentication**: Not required (public)
**Request Body**:
```json
{
  "choice": "PRIVATE | ACTIVE_MATCHING | NOT_USING"
}
```
**Response**: Updated endorsement with new status

**Endorsement Status Flow**:
- `PENDING_CANDIDATE_ACTION`: Awaiting candidate decision
- `PRIVATE`: Candidate makes it private (not visible)
- `ACTIVE_MATCHING`: Candidate uses for job matching
- `NOT_USING`: Candidate declines to use

---

#### GET /api/endorsements/{id}
**Purpose**: Get endorsement details for decision page
**Authentication**: Not required (public)
**Response**:
```json
{
  "id": "string",
  "endorser": {
    "name": "string",
    "email": "string"
  },
  "status": "string",
  "createdAt": "DateTime"
}
```

---

### C. USER ENDORSEMENT ENDPOINTS

#### GET /api/user/endorsements
**Purpose**: Get endorsements given by current user

#### GET /api/user/received-endorsements
**Purpose**: Get endorsements received by current user

---

## 3. REFERRAL CHAIN SYSTEM

### How It Works

The referral chain system tracks how job opportunities flow through the network and attributes payment fairly.

#### Key Components:

**1. Job Forwards** (JobForward table)
- When user A forwards a job to user B: `JobForward(jobId, fromNodeId=A, toNodeId=B)`
- Unique constraint prevents duplicate forwards
- Records timestamp of each forward

**2. Chain Reconstruction** (`reconstructChain()`)
```
Algorithm:
1. Start at the referrer node
2. Find all JobForwards TO this node for this job
3. Use EARLIEST forward (first chronologically) - "earliest timestamp wins"
4. Add fromNode to front of chain
5. Repeat from fromNode
6. Stop when no more forwards found
7. Result: Array of nodeIds from origin to referrer
```

**Example**:
```
Timeline:
- 10:00 AM: Job Owner -> Alice (forwards job)
- 10:05 AM: Alice -> Bob (forwards job)
- 10:15 AM: Bob -> Charlie (refers candidate)

Chain for Charlie's referral: [JobOwner, Alice, Bob, Charlie]
ChainDepth: 3 (number of forwards)
```

**3. Chain Materialization**
- When a referral is created, the entire `chainPath` is stored in the Referral record
- This enables quick payment calculation without reconstructing chains

**4. Payment Splits** (`calculatePaymentSplits()`)
```
Algorithm:
If chainLength === 1 (direct referral):
  DirectReferrer gets 100%
Else (chain referral):
  DirectReferrer (last node) gets 70%
  All intermediaries share 30% equally
    = 30% / (chainLength - 1)

Example with $10,000:
- Chain: [Owner, Alice, Bob, Charlie]
- Charlie (direct): $7,000
- Bob: $1,000 (30% / 3)
- Alice: $1,000
- Owner: $1,000
```

---

## 4. ENDORSEMENT & REFERRAL RELATIONSHIP

### The Flow

**For Platform Users (Existing Endorsements)**:
1. User A endorses User B
2. Endorsement stored with `endorsedUserId` set
3. Can be converted to job referral by adding `jobId`

**For Non-Platform Users**:
1. User A endorses Person C (not yet on platform)
2. Endorsement stored with `endorsedUserEmail`, `endorsedUserId` null
3. When C joins and uses same email: Endorsement `endorsedUserId` is updated

**Job Referrals**:
- Endorsement with `isJobReferral=true` and `jobId` set
- Links endorsement to specific job opportunity
- Helps with candidate-job matching

---

## 5. KEY ENUMS

### ReferralStatus
```
PENDING, SCREENING, INTERVIEWING, HIRED, REJECTED
```

### EndorsementStatus
```
PENDING_CANDIDATE_ACTION - Waiting for candidate decision
PRIVATE - Candidate marked as private
ACTIVE_MATCHING - Candidate using for job matching
NOT_USING - Candidate declined to use
```

### ReferralPreference (Job-level)
```
MANUAL_SCREEN - Employer manually reviews all referrals
AUTO_EMAIL - System auto-sends referrals to employer
CONFIDENCE_BASED - Auto-sends based on confidence scores
```

### LocationType
```
REMOTE, HYBRID, IN_PERSON
```

### NodeTier (User)
```
CONNECTOR, TALENT_SCOUT, NETWORK_HUB
```

---

## 6. KEY BUSINESS RULES

1. **One Endorsement Per Pair**: Cannot endorse same person twice
   - Unique constraint: `(endorserId, endorsedUserEmail)`

2. **Earliest Forward Wins**: When reconstructing chains with multiple paths, use first forward chronologically

3. **Trust Points**: Users have total trust budget, allocate to network members

4. **Referral Chains**: Payment splits based on chain depth, direct referrer favored (70/30)

5. **Job Ownership**: Only job owner or admin can:
   - Update referral status
   - View referrals for job
   - Calculate payment splits

6. **Delegation Creates Relationships**: Forwarding job creates unidirectional relationship with trust allocation

---

## 7. IMPORTANT FILES

**Schema**: `/home/tristan/prog/testCloutWebApp/prisma/schema.prisma`

**Referral Chain Logic**: `/home/tristan/prog/testCloutWebApp/src/lib/referral-chain.ts`

**API Routes**:
- `/src/app/api/referrals/` - referral endpoints
- `/src/app/api/endorsements/` - endorsement endpoints
- `/src/app/api/jobs/[id]/refer` - job referral endpoint
- `/src/app/api/jobs/[id]/referrals` - get referrals for job

