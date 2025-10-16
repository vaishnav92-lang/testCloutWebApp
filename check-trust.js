const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTrust() {
  console.log('\n=== CHECKING TRUST ALLOCATIONS AND SCORES ===\n')

  // Get all trust allocations
  const allocations = await prisma.trustAllocation.findMany({
    include: {
      giver: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          isAdmin: true
        }
      },
      receiver: {
        select: {
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: {
      proportion: 'desc'
    }
  })

  console.log('Current Trust Allocations:')
  console.log('=' .repeat(80))

  // Group by giver to see who allocated what
  const byGiver = {}
  allocations.forEach(a => {
    const giverName = a.giver.email
    if (!byGiver[giverName]) {
      byGiver[giverName] = []
    }
    byGiver[giverName].push({
      receiver: a.receiver.email,
      proportion: (a.proportion * 100).toFixed(2) + '%'
    })
  })

  for (const [giver, allocs] of Object.entries(byGiver)) {
    console.log(`\n${giver} (Admin: ${allocations.find(a => a.giver.email === giver)?.giver.isAdmin}) allocated to:`)
    allocs.forEach(a => {
      console.log(`  - ${a.receiver}: ${a.proportion}`)
    })
    const total = allocs.reduce((sum, a) => sum + parseFloat(a.proportion), 0)
    console.log(`  TOTAL: ${total.toFixed(2)}%`)
  }

  // Get computed trust scores
  console.log('\n' + '='.repeat(80))
  console.log('\nComputed Trust Scores (Network Influence):')
  console.log('=' .repeat(80))

  const scores = await prisma.computedTrustScore.findMany({
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          isAdmin: true
        }
      }
    },
    orderBy: {
      trustScore: 'desc'
    },
    take: 10
  })

  console.log('\nTop 10 by Trust Score:')
  scores.forEach(s => {
    const name = s.user.email
    const isAdmin = s.user.isAdmin ? ' (ADMIN)' : ''
    console.log(`#${s.rank}: ${name}${isAdmin} - Score: ${(s.trustScore * 100).toFixed(4)}% (Display: ${s.displayScore})`)
  })

  // Check if admin (vaishnav@cloutcareers.com) is allocating trust
  const adminAllocs = allocations.filter(a => a.giver.email === 'vaishnav@cloutcareers.com')
  console.log('\n' + '='.repeat(80))
  console.log('\nAdmin Trust Allocation Status:')
  console.log('=' .repeat(80))

  if (adminAllocs.length === 0) {
    console.log('⚠️  Admin (vaishnav@cloutcareers.com) has NOT allocated any trust!')
    console.log('   This means only the default initialization (equal distribution) is in effect.')
  } else {
    console.log(`✅ Admin has allocated trust to ${adminAllocs.length} users:`)
    adminAllocs.forEach(a => {
      console.log(`   - ${a.receiver.email}: ${(a.proportion * 100).toFixed(2)}%`)
    })
  }

  // Check last computation
  const lastComputation = await prisma.trustComputationLog.findFirst({
    orderBy: { computedAt: 'desc' }
  })

  if (lastComputation) {
    console.log('\n' + '='.repeat(80))
    console.log('\nLast EigenTrust Computation:')
    console.log('=' .repeat(80))
    console.log(`  Computed at: ${lastComputation.computedAt}`)
    console.log(`  Iterations: ${lastComputation.numIterations}`)
    console.log(`  Converged: ${lastComputation.converged}`)
    console.log(`  Triggered by: ${lastComputation.triggeredBy}`)
  }

  await prisma.$disconnect()
}

checkTrust().catch(console.error)