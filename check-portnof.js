const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPortnof() {
  console.log('Checking portnof.will@gmail.com status...')

  const admin = await prisma.user.findUnique({
    where: { email: 'vaishnav@cloutcareers.com' }
  })

  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [
        { user1Id: admin.id, user2Email: 'portnof.will@gmail.com' },
        { user2Id: admin.id, user1Email: 'portnof.will@gmail.com' }
      ]
    }
  })

  console.log('Found', relationships.length, 'relationship records')
  relationships.forEach((rel, i) => {
    console.log('Relationship', i + 1, '- Status:', rel.status, 'Created:', rel.createdAt)
  })

  if (relationships.length > 1) {
    console.log('Removing older duplicate...')
    const sorted = relationships.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const toDelete = sorted[1]
    await prisma.relationship.delete({ where: { id: toDelete.id } })
    console.log('Duplicate removed!')
  }

  await prisma.disconnect()
}

checkPortnof().catch(console.error)
