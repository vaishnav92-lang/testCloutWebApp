/**
 * GRANT ALLOCATION TEST DATA SEED
 *
 * This script populates the development database with test data for the grant allocation system.
 * It creates:
 * - An admin user
 * - A grant round in PHASE_ONE_VETTING
 * - Multiple test applicants
 * - Sample contributions for each applicant
 *
 * Test flow:
 * 1. Log in as different applicants and submit applications with contributions
 * 2. Admin advances grant round to PHASE_TWO_PREDICTIONS
 * 3. Applicants allocate trust to each other in phase two
 * 4. Admin advances to PHASE_THREE_REINFORCEMENT
 * 5. View results in final allocation phase
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning up existing grant data...')

  // Delete all grant-related data in reverse dependency order
  await prisma.predictionReinforcement.deleteMany({})
  await prisma.prediction.deleteMany({})
  await prisma.grantTrustAllocation.deleteMany({})
  await prisma.grantContribution.deleteMany({})
  await prisma.grantApplication.deleteMany({})
  await prisma.grantRound.deleteMany({})
  await prisma.trustedRecommender.deleteMany({})

  // Delete relationships for these users (foreign key constraint)
  const testEmails = [
    'grantadmin@clout.com',
    'alice@research.com',
    'bob@research.com',
    'carol@research.com',
    'diana@research.com',
    'evan@research.com',
  ]

  const testUsers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true },
  })

  const testUserIds = testUsers.map((u) => u.id)

  if (testUserIds.length > 0) {
    await prisma.relationship.deleteMany({
      where: {
        OR: [{ user1Id: { in: testUserIds } }, { user2Id: { in: testUserIds } }],
      },
    })

    // Also delete trust allocations they may have
    await prisma.trustAllocation.deleteMany({
      where: {
        OR: [{ giverId: { in: testUserIds } }, { receiverId: { in: testUserIds } }],
      },
    })
  }

  // Also delete the test users and recreate them fresh
  await prisma.user.deleteMany({
    where: {
      email: {
        in: testEmails,
      },
    },
  })

  console.log('✅ Cleaned up existing data')
  console.log('Seeding grant allocation test data...')

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'grantadmin@clout.com',
      firstName: 'Grant',
      lastName: 'Admin',
      isAdmin: true,
      profileVisibility: 'PUBLIC',
      isProfileComplete: true,
    },
  })
  console.log('✅ Created admin user:', admin.email)

  // Create grant applicants
  const alice = await prisma.user.create({
    data: {
      email: 'alice@research.com',
      firstName: 'Alice',
      lastName: 'Chen',
      profileVisibility: 'PUBLIC',
      isProfileComplete: true,
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@research.com',
      firstName: 'Bob',
      lastName: 'Smith',
      profileVisibility: 'PUBLIC',
      isProfileComplete: true,
    },
  })

  const carol = await prisma.user.create({
    data: {
      email: 'carol@research.com',
      firstName: 'Carol',
      lastName: 'Davis',
      profileVisibility: 'PUBLIC',
      isProfileComplete: true,
    },
  })

  const diana = await prisma.user.create({
    data: {
      email: 'diana@research.com',
      firstName: 'Diana',
      lastName: 'Martinez',
      profileVisibility: 'PUBLIC',
      isProfileComplete: true,
    },
  })

  const evan = await prisma.user.create({
    data: {
      email: 'evan@research.com',
      firstName: 'Evan',
      lastName: 'Wilson',
      profileVisibility: 'PUBLIC',
      isProfileComplete: true,
    },
  })

  console.log('✅ Created 5 applicant users')

  // Create grant round
  const grantRound = await prisma.grantRound.create({
    data: {
      name: 'Climate Research Grant Round 2025',
      description:
        'Supporting innovative climate research projects. Applicants allocate trust based on confidence in each other\'s work.',
      status: 'PHASE_ONE_VETTING',
      totalFunding: 50000,
      minimumGrantSize: 1000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  })

  console.log('✅ Created grant round:', grantRound.name)

  // Create grant applications for each user
  const appAlice = await prisma.grantApplication.create({
    data: {
      grantRoundId: grantRound.id,
      applicantId: alice.id,
      status: 'DRAFT',
    },
  })

  const appBob = await prisma.grantApplication.create({
    data: {
      grantRoundId: grantRound.id,
      applicantId: bob.id,
      status: 'DRAFT',
    },
  })

  const appCarol = await prisma.grantApplication.create({
    data: {
      grantRoundId: grantRound.id,
      applicantId: carol.id,
      status: 'DRAFT',
    },
  })

  const appDiana = await prisma.grantApplication.create({
    data: {
      grantRoundId: grantRound.id,
      applicantId: diana.id,
      status: 'DRAFT',
    },
  })

  const appEvan = await prisma.grantApplication.create({
    data: {
      grantRoundId: grantRound.id,
      applicantId: evan.id,
      status: 'DRAFT',
    },
  })

  console.log('✅ Created 5 grant applications')

  // Add sample contributions for each applicant
  await prisma.grantContribution.createMany({
    data: [
      // Alice's contributions
      {
        applicationId: appAlice.id,
        title: 'Carbon Capture Study',
        description: 'Published research on scalable carbon capture technologies',
        url: 'https://example.com/carbon-capture',
        isProposal: false,
      },
      {
        applicationId: appAlice.id,
        title: 'Climate Policy Analysis Framework',
        description:
          'Developing machine learning models to predict climate policy effectiveness',
        url: 'https://example.com/policy-framework',
        proofOfWork: 'https://github.com/alice/climate-policy',
        isProposal: true,
      },
      // Bob's contributions
      {
        applicationId: appBob.id,
        title: 'Ocean Temperature Modeling',
        description: 'Real-time ocean temperature prediction system',
        url: 'https://example.com/ocean-modeling',
        isProposal: false,
      },
      {
        applicationId: appBob.id,
        title: 'Climate Impact Dashboard',
        description:
          'Building an interactive dashboard to visualize climate impacts by region',
        proofOfWork: 'https://github.com/bob/climate-dashboard',
        isProposal: true,
      },
      // Carol's contributions
      {
        applicationId: appCarol.id,
        title: 'Renewable Energy Cost Analysis',
        description: 'Comprehensive analysis of renewable energy cost trends',
        url: 'https://example.com/renewable-analysis',
        isProposal: false,
      },
      {
        applicationId: appCarol.id,
        title: 'Solar Grid Integration Study',
        description: 'Research on integrating solar energy into existing grids',
        url: 'https://example.com/solar-grid',
        proofOfWork: 'https://github.com/carol/solar-integration',
        isProposal: true,
      },
      // Diana's contributions
      {
        applicationId: appDiana.id,
        title: 'Carbon Pricing Model',
        description: 'Economic model for optimal carbon pricing strategies',
        url: 'https://example.com/carbon-pricing',
        isProposal: false,
      },
      {
        applicationId: appDiana.id,
        title: 'Climate Justice Framework',
        description:
          'Creating framework to ensure climate solutions address equity concerns',
        proofOfWork: 'https://github.com/diana/climate-justice',
        isProposal: true,
      },
      // Evan's contributions
      {
        applicationId: appEvan.id,
        title: 'Biodiversity Loss Metrics',
        description: 'Developing metrics to track and predict biodiversity loss',
        url: 'https://example.com/biodiversity',
        isProposal: false,
      },
      {
        applicationId: appEvan.id,
        title: 'Ecosystem Recovery Program',
        description: 'Designing scalable ecosystem restoration approaches',
        proofOfWork: 'https://github.com/evan/ecosystem-recovery',
        isProposal: true,
      },
    ],
  })

  console.log('✅ Created contributions for all applicants')

  console.log('\n' + '='.repeat(60))
  console.log('GRANT ALLOCATION TEST DATA SEEDED SUCCESSFULLY')
  console.log('='.repeat(60))

  console.log('\n📋 TEST FLOW:')
  console.log('\n1️⃣  PHASE ONE - Applicants submit their work:')
  console.log('   Log in as each user and navigate to /grants to view the grant round')
  console.log('   Click "Apply" and submit your application with the pre-filled contributions')
  console.log('   Applications have been pre-created in DRAFT status with contributions')
  console.log('\n   Test Accounts:')
  console.log('   - alice@research.com (Alice Chen)')
  console.log('   - bob@research.com (Bob Smith)')
  console.log('   - carol@research.com (Carol Davis)')
  console.log('   - diana@research.com (Diana Martinez)')
  console.log('   - evan@research.com (Evan Wilson)')

  console.log('\n2️⃣  PHASE TWO - Advance grant round (Admin only):')
  console.log('   Log in as: grantadmin@clout.com')
  console.log('   Navigate to /admin/grants')
  console.log('   Select the grant round and advance to PHASE_TWO_PREDICTIONS')

  console.log('\n3️⃣  PHASE TWO - Allocate trust:')
  console.log('   Each user logs in and goes to their grant application')
  console.log('   In Step 2 (Trust Allocation), allocate trust points to other applicants')
  console.log('   based on confidence in their work')
  console.log('   Trust allocations sync to main Clout network automatically')

  console.log('\n4️⃣  PHASE THREE - View results (Admin):')
  console.log('   Admin advances grant round to PHASE_THREE_REINFORCEMENT')
  console.log('   Admin clicks "Compute Allocations" to run EigenTrust algorithm')
  console.log('   See recommended funding amounts based on trust network')

  console.log('\n' + '='.repeat(60))
  console.log('GRANT ROUND ID:', grantRound.id)
  console.log('='.repeat(60))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
