const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixSelfAllocation() {
  console.log('Removing admin self-allocation...')

  // Find admin user
  const admin = await prisma.user.findUnique({
    where: { email: 'vaishnav@cloutcareers.com' }
  })

  if (!admin) {
    console.log('Admin user not found')
    return
  }

  // Remove self-allocation
  const deleted = await prisma.trustAllocation.deleteMany({
    where: {
      giverId: admin.id,
      receiverId: admin.id
    }
  })

  console.log(`Deleted ${deleted.count} self-allocation record(s)`)

  // Check remaining allocations
  const remaining = await prisma.trustAllocation.findMany({
    where: { giverId: admin.id }
  })

  console.log(`Admin now has ${remaining.length} allocations remaining`)
  console.log(`Total proportion: ${remaining.reduce((sum, a) => sum + a.proportion, 0)}`)

  await prisma.$disconnect()
}

fixSelfAllocation().catch(console.error)