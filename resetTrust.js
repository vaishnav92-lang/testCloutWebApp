const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetTrust(email) {
  if (!email) {
    console.error('Error: Please provide an email address as an argument.');
    console.log('Usage: node resetTrust.js <email_to_reset>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      console.log(`User with email ${email} not found. No action taken.`);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        availableTrust: 100,
        allocatedTrust: 0,
        availableInvites: 10,
        totalInvitesUsed: 0,
      },
    });

    console.log(`Trust points and invite counts for user ${email} have been reset.`);
  } catch (error) {
    console.error(`Error resetting trust for user ${email}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

const emailArg = process.argv[2];
resetTrust(emailArg);