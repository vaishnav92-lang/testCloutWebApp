const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUserAndInvitations(email) {
  if (!email) {
    console.error('Error: Please provide an email address as an argument.');
    console.log('Usage: node deleteUser.js <email_to_delete>');
    process.exit(1);
  }

  try {
    let userDeleted = false;
    let invitationDeleted = false;

    // 1. Attempt to delete invitations first
    console.log(`Checking for invitations for ${email}...`);
    const invitationCount = await prisma.invitation.deleteMany({
      where: { email: email },
    });

    if (invitationCount.count > 0) {
      console.log(`Deleted ${invitationCount.count} invitation(s) for ${email}.`);
      invitationDeleted = true;
    } else {
      console.log(`No invitations found for ${email}.`);
    }

    // 2. Check if a full user record exists
    const userToDelete = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, email: true, referredById: true }
    });

    if (userToDelete) {
      console.log(`Found user: ${userToDelete.email} (ID: ${userToDelete.id}). Initiating comprehensive user data deletion...`);

      await prisma.$transaction(async (tx) => {
        // 1. Delete Accounts (NextAuth related)
        await tx.account.deleteMany({
          where: { userId: userToDelete.id }
        });

        // 2. Delete Sessions (NextAuth related)
        await tx.session.deleteMany({
          where: { userId: userToDelete.id }
        });

        // 3. Delete VerificationTokens associated with user's email
        await tx.verificationToken.deleteMany({
          where: { identifier: userToDelete.email }
        });

        // 4. Delete Introductions where user is involved
        await tx.introduction.deleteMany({
          where: {
            OR: [
              { personAId: userToDelete.id },
              { personBId: userToDelete.id },
              { introducedById: userToDelete.id }
            ]
          }
        });

        // 5. Delete Endorsements (both given and received)
        await tx.endorsement.deleteMany({
          where: {
            OR: [
              { endorserId: userToDelete.id },
              { endorsedUserId: userToDelete.id }
            ]
          }
        });

        // 6. Delete Relationships where user is involved
        await tx.relationship.deleteMany({
          where: {
            OR: [
              { user1Id: userToDelete.id },
              { user2Id: userToDelete.id }
            ]
          }
        });

        // 7. Delete Jobs owned by user (if they're a hiring manager)
        await tx.job.deleteMany({
          where: { ownerId: userToDelete.id }
        });

        // 8. Delete Invitations (both sent and received) - already handled above for pending invites, but this covers invites where user is sender/receiver
        await tx.invitation.deleteMany({
          where: {
            OR: [
              { senderId: userToDelete.id },
              { receiverId: userToDelete.id }
            ]
          }
        });

        // 9. Delete Earnings Transactions
        await tx.earningsTransaction.deleteMany({
          where: { userId: userToDelete.id }
        });

        // 10. Delete Clout Activities
        await tx.cloutActivity.deleteMany({
          where: { userId: userToDelete.id }
        });

        // 11. Delete Endorsement Releases where user is employer
        await tx.endorsementRelease.deleteMany({
          where: { employerId: userToDelete.id }
        });

        // 12. If this user referred others, set their referredById to null
        await tx.user.updateMany({
          where: { referredById: userToDelete.id },
          data: { referredById: null }
        });

        // 13. Delete Job Applications
        await tx.jobApplication.deleteMany({
          where: { userId: userToDelete.id }
        });

        // 14. Delete Trust Allocations (given by and received by)
        await tx.trustAllocation.deleteMany({
          where: {
            OR: [
              { giverId: userToDelete.id },
              { receiverId: userToDelete.id }
            ]
          }
        });

        // 15. Delete Computed Trust Scores
        await tx.computedTrustScore.deleteMany({
          where: { userId: userToDelete.id }
        });

        // 16. Finally, delete the user
        await tx.user.delete({
          where: { id: userToDelete.id }
        });
      });

      console.log(`User ${email} and all related data deleted successfully.`);
      userDeleted = true;
    } else {
      console.log(`No full user record found for ${email}.`);
    }

    if (!userDeleted && !invitationDeleted) {
      console.log(`No user or pending invitation found for ${email}. No action taken.`);
    } else if (invitationDeleted && !userDeleted) {
      console.log(`Only invitations were found and deleted for ${email}.`);
    }

  } catch (error) {
    console.error(`Error during deletion process for ${email}:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const emailArg = process.argv[2];
deleteUserAndInvitations(emailArg);