/**
 * Demo Data Generators
 * Generates mock data for the demo mode
 * All data is kept in-memory and cleared on logout
 */

export interface DemoUser {
  id: string
  email: string
  firstName: string
  lastName: string
  isProfileComplete: boolean
  cloutScore: number
  tier: string
  referralCode: string
}

export interface DemoJob {
  id: string
  title: string
  company: string
  description: string
  location: string
  salary?: string
  createdAt: Date
  companyId: string
}

export interface DemoEndorsement {
  id: string
  fromUserId: string
  toUserId: string
  fromUserName: string
  toUserName: string
  strengths: string[]
  relationship: string
  status: 'PENDING_CANDIDATE_ACTION' | 'ACTIVE_MATCHING' | 'PRIVATE' | 'NOT_USING'
  createdAt: Date
  message: string
}

export interface DemoTrustAllocation {
  id: string
  fromUserId: string
  toUserId: string
  allocation: number
  fromUserName: string
  toUserName: string
}

export interface DemoRelationship {
  id: string
  fromUserId: string
  toUserId: string
  fromUserName: string
  toUserName: string
  type: string
  status: 'ESTABLISHED' | 'PENDING'
  createdAt: Date
}

export interface DemoReferral {
  id: string
  hirerUserId: string
  candidateUserId: string
  jobId: string
  status: 'PENDING' | 'SCREENING' | 'INTERVIEWING' | 'HIRED'
  notes: string
  chainDepth: number
  hirerName: string
  candidateName: string
  jobTitle: string
  createdAt: Date
}

export interface DemoState {
  currentUser: DemoUser
  users: DemoUser[]
  jobs: DemoJob[]
  endorsements: DemoEndorsement[]
  trustAllocations: DemoTrustAllocation[]
  relationships: DemoRelationship[]
  referrals: DemoReferral[]
  trustScores: Record<string, number>
}

// Mock user data
const createMockUsers = (): DemoUser[] => [
  {
    id: 'user-1',
    email: 'demo@example.com',
    firstName: 'Demo',
    lastName: 'User',
    isProfileComplete: true,
    cloutScore: 850,
    tier: 'NETWORK_HUB',
    referralCode: 'DEMO123',
  },
  {
    id: 'user-2',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Johnson',
    isProfileComplete: true,
    cloutScore: 720,
    tier: 'CONNECTOR',
    referralCode: 'ALICE456',
  },
  {
    id: 'user-3',
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Smith',
    isProfileComplete: true,
    cloutScore: 680,
    tier: 'TALENT_SCOUT',
    referralCode: 'BOB789',
  },
  {
    id: 'user-4',
    email: 'carol@example.com',
    firstName: 'Carol',
    lastName: 'Williams',
    isProfileComplete: true,
    cloutScore: 590,
    tier: 'CONNECTOR',
    referralCode: 'CAROL012',
  },
  {
    id: 'user-5',
    email: 'david@example.com',
    firstName: 'David',
    lastName: 'Brown',
    isProfileComplete: true,
    cloutScore: 650,
    tier: 'TALENT_SCOUT',
    referralCode: 'DAVID345',
  },
]

// Mock job data
const createMockJobs = (): DemoJob[] => [
  {
    id: 'job-1',
    title: 'Senior Software Engineer',
    company: 'TechCorp',
    description: 'Looking for an experienced software engineer to lead our backend team',
    location: 'San Francisco, CA',
    salary: '$180k-$220k',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    companyId: 'company-1',
  },
  {
    id: 'job-2',
    title: 'Product Manager',
    company: 'StartupXYZ',
    description: 'Join our growing team to lead product strategy',
    location: 'New York, NY',
    salary: '$150k-$180k',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    companyId: 'company-2',
  },
  {
    id: 'job-3',
    title: 'Data Scientist',
    company: 'DataInc',
    description: 'Build ML models to solve complex business problems',
    location: 'Remote',
    salary: '$160k-$200k',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    companyId: 'company-3',
  },
  {
    id: 'job-4',
    title: 'Marketing Manager',
    company: 'BrandCo',
    description: 'Lead marketing initiatives for our flagship products',
    location: 'Austin, TX',
    salary: '$120k-$150k',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    companyId: 'company-4',
  },
]

// Mock endorsements
const createMockEndorsements = (): DemoEndorsement[] => [
  {
    id: 'endorsement-1',
    fromUserId: 'user-2',
    toUserId: 'user-1',
    fromUserName: 'Alice Johnson',
    toUserName: 'Demo User',
    strengths: ['Leadership', 'Problem Solving', 'Communication'],
    relationship: 'Colleague',
    status: 'ACTIVE_MATCHING',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    message: 'Great collaborator and strategic thinker',
  },
  {
    id: 'endorsement-2',
    fromUserId: 'user-3',
    toUserId: 'user-1',
    fromUserName: 'Bob Smith',
    toUserName: 'Demo User',
    strengths: ['Technical Skills', 'Mentorship', 'Innovation'],
    relationship: 'Manager',
    status: 'ACTIVE_MATCHING',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    message: 'One of the best engineers I have worked with',
  },
  {
    id: 'endorsement-3',
    fromUserId: 'user-4',
    toUserId: 'user-1',
    fromUserName: 'Carol Williams',
    toUserName: 'Demo User',
    strengths: ['Team Player', 'Reliability', 'Initiative'],
    relationship: 'Peer',
    status: 'PENDING_CANDIDATE_ACTION',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    message: 'Always goes above and beyond',
  },
]

// Mock trust allocations - only show Demo User's allocations in UI
// The eigentrust computation uses a full network for variation
const createMockTrustAllocations = (): DemoTrustAllocation[] => [
  // Demo User completely trusts Alice
  {
    id: 'trust-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    allocation: 100,
    fromUserName: 'Demo User',
    toUserName: 'Alice Johnson',
  },
  // Demo User completely distrusts Bob
  {
    id: 'trust-2',
    fromUserId: 'user-1',
    toUserId: 'user-3',
    allocation: 0,
    fromUserName: 'Demo User',
    toUserName: 'Bob Smith',
  },
  // Demo User moderately trusts Carol
  {
    id: 'trust-3',
    fromUserId: 'user-1',
    toUserId: 'user-4',
    allocation: 30,
    fromUserName: 'Demo User',
    toUserName: 'Carol Williams',
  },
  // Demo User barely trusts David
  {
    id: 'trust-4',
    fromUserId: 'user-1',
    toUserId: 'user-5',
    allocation: 5,
    fromUserName: 'Demo User',
    toUserName: 'David Brown',
  },
]

// Internal network for eigentrust computation (not displayed in UI)
// Highly asymmetric network creates sensitivity to allocation changes
export const DEMO_NETWORK_EDGES = [
  { from: 'user-1', to: 'user-2', weight: 1.0 },    // Demo -> Alice (100%) [EDITABLE]
  { from: 'user-1', to: 'user-3', weight: 0.0 },    // Demo -> Bob (0%) [EDITABLE]
  { from: 'user-1', to: 'user-4', weight: 0.3 },    // Demo -> Carol (30%) [EDITABLE]
  { from: 'user-1', to: 'user-5', weight: 0.05 },   // Demo -> David (5%) [EDITABLE]

  // Alice trusts only Carol heavily (strong preference)
  { from: 'user-2', to: 'user-4', weight: 0.95 },
  { from: 'user-2', to: 'user-3', weight: 0.05 },

  // Carol trusts David almost exclusively (creates bottleneck)
  { from: 'user-4', to: 'user-5', weight: 0.99 },
  { from: 'user-4', to: 'user-2', weight: 0.01 },

  // David trusts only Bob
  { from: 'user-5', to: 'user-3', weight: 1.0 },

  // Bob has split allocations (creates variation)
  { from: 'user-3', to: 'user-2', weight: 0.3 },
  { from: 'user-3', to: 'user-4', weight: 0.4 },
  { from: 'user-3', to: 'user-5', weight: 0.3 },
]

// Mock relationships
const createMockRelationships = (): DemoRelationship[] => [
  {
    id: 'rel-1',
    fromUserId: 'user-1',
    toUserId: 'user-2',
    fromUserName: 'Demo User',
    toUserName: 'Alice Johnson',
    type: 'colleague',
    status: 'ESTABLISHED',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'rel-2',
    fromUserId: 'user-1',
    toUserId: 'user-3',
    fromUserName: 'Demo User',
    toUserName: 'Bob Smith',
    type: 'mentor',
    status: 'ESTABLISHED',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'rel-3',
    fromUserId: 'user-1',
    toUserId: 'user-4',
    fromUserName: 'Demo User',
    toUserName: 'Carol Williams',
    type: 'peer',
    status: 'ESTABLISHED',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'rel-4',
    fromUserId: 'user-1',
    toUserId: 'user-5',
    fromUserName: 'Demo User',
    toUserName: 'David Brown',
    type: 'peer',
    status: 'ESTABLISHED',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
  },
]

// Mock referrals
const createMockReferrals = (): DemoReferral[] => [
  {
    id: 'ref-1',
    hirerUserId: 'user-2',
    candidateUserId: 'user-1',
    jobId: 'job-1',
    status: 'INTERVIEWING',
    notes: 'Great fit for the role',
    chainDepth: 1,
    hirerName: 'Alice Johnson',
    candidateName: 'Demo User',
    jobTitle: 'Senior Software Engineer',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'ref-2',
    hirerUserId: 'user-3',
    candidateUserId: 'user-1',
    jobId: 'job-2',
    status: 'SCREENING',
    notes: 'Perfect background match',
    chainDepth: 1,
    hirerName: 'Bob Smith',
    candidateName: 'Demo User',
    jobTitle: 'Product Manager',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'ref-3',
    hirerUserId: 'user-4',
    candidateUserId: 'user-1',
    jobId: 'job-3',
    status: 'HIRED',
    notes: 'Excellent hire, very happy',
    chainDepth: 1,
    hirerName: 'Carol Williams',
    candidateName: 'Demo User',
    jobTitle: 'Data Scientist',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
]

// Create trust scores
const createMockTrustScores = (): Record<string, number> => ({
  'user-1': 850,
  'user-2': 720,
  'user-3': 680,
  'user-4': 590,
  'user-5': 650,
})

export const generateMockDemoState = (): DemoState => {
  const users = createMockUsers()
  return {
    currentUser: users[0],
    users,
    jobs: createMockJobs(),
    endorsements: createMockEndorsements(),
    trustAllocations: createMockTrustAllocations(),
    relationships: createMockRelationships(),
    referrals: createMockReferrals(),
    trustScores: createMockTrustScores(),
  }
}
