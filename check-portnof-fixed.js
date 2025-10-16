const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPortnof() {
  console.log('Checking portnof.will@gmail.com status...')

  // Check if portnof user exists
  const portnofUser = await prisma.user.findUnique({
    where: { email: 'portnof.will@gmail.com' }
  })
  console.log('Portnof user exists:', portnofUser ? 'YES' : 'NO')

  const admin = await prisma.user.findUnique({
    where: { email: 'vaishnav@cloutcareers.com' }
  })

  // Find all relationships involving admin and portnof
  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [
        { user1Id: admin.id, user2Id: portnofUser?.id },
        { user2Id: admin.id, user1Id: portnofUser?.id }
      ].filter(Boolean)
    },
    include: {
      user1: { select: { email: true } },
      user2: { select: { email: true } }
    }
  })

  console.log('Found', relationships.length, 'relationship records')
  relationships.forEach((rel, i) => {
    console.log('Relationship', i + 1, '- Status:', rel.status, 'Created:', rel.createdAt.toISOString())
  })

  // Check invitations
  const invitations = await prisma.invitation.findMany({
    where: { invitedEmail: 'portnof.will@gmail.com' }
  })
  console.log('Found', invitations.length, 'invitation records')

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
