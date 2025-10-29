const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: 'vaishnav@cloutcareers.com',
          mode: 'insensitive'
        }
      }
    })

    console.log('User found:', user)

    if (!user) {
      console.log('No user found with email vaishnav@cloutcareers.com')
      // Check all users
      const allUsers = await prisma.user.findMany({
        select: { id: true, email: true, firstName: true, lastName: true }
      })
      console.log('All users in database:', allUsers)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()