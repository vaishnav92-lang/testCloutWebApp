
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Find the user with email romanov360@gmail.com
    const user = await prisma.user.findUnique({
      where: { email: 'romanov360@gmail.com' }
    });

    if (!user) {
      console.log('User romanov360@gmail.com not found');
      return;
    }

    console.log('Found user:', user.id, user.email);

    // Delete all endorsements where this user is the endorser
    const result = await prisma.endorsement.deleteMany({
      where: {
        endorserId: user.id
      }
    });

    console.log(`Deleted ${result.count} endorsements by romanov360@gmail.com`);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
