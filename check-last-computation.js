const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLastComputation() {
  const lastComputation = await prisma.trustComputationLog.findFirst({
    orderBy: { computedAt: 'desc' }
  })

  if (lastComputation) {
    console.log('Last EigenTrust Computation:')
    console.log('=' .repeat(50))
    console.log(`Computed at: ${lastComputation.computedAt}`)
    console.log(`Iterations: ${lastComputation.numIterations}`)
    console.log(`Converged: ${lastComputation.converged ? 'YES' : 'NO'}`)
    console.log(`Triggered by: ${lastComputation.triggeredBy}`)
    console.log(`Users: ${lastComputation.numUsers}`)
    console.log(`Decay factor: ${lastComputation.decayFactor}`)
    console.log(`Convergence threshold: ${lastComputation.convergenceThreshold}`)
  } else {
    console.log('No computation records found')
  }

  await prisma.$disconnect()
}

checkLastComputation().catch(console.error)