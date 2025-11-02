/**
 * SEED SCRIPT FOR DEVELOPMENT DATABASE
 *
 * This script populates the development database with sample companies,
 * users, and jobs for testing the internal job board feature.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data (optional - comment out to preserve)
  // await prisma.user.deleteMany({})
  // await prisma.company.deleteMany({})

  // Create sample companies
  const techCorp = await prisma.company.create({
    data: {
      name: 'TechCorp Inc',
      description: 'A leading technology company',
      website: 'https://techcorp.com',
      industry: 'Technology',
      size: '500-1000',
      hasInternalJobBoard: true,
      internalBoardMode: 'OPTIONAL',
    },
  })

  const designStudio = await prisma.company.create({
    data: {
      name: 'Design Studio Co',
      description: 'Creative design and branding agency',
      website: 'https://designstudio.com',
      industry: 'Design',
      size: '50-100',
      hasInternalJobBoard: true,
      internalBoardMode: 'PARTITIONED',
    },
  })

  const financeGroup = await prisma.company.create({
    data: {
      name: 'Finance Group Global',
      description: 'International financial services',
      website: 'https://financegroup.com',
      industry: 'Finance',
      size: '1000+',
      hasInternalJobBoard: true,
      internalBoardMode: 'OPEN_TO_NETWORK',
    },
  })

  console.log('✅ Created companies')

  // Create sample users - TechCorp
  const techAdmin = await prisma.user.create({
    data: {
      email: 'admin@techcorp.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      companyId: techCorp.id,
      isCompanyAdmin: true,
      profileVisibility: 'COMPANY_ONLY',
      isProfileComplete: true,
    },
  })

  const techEmp1 = await prisma.user.create({
    data: {
      email: 'engineer@techcorp.com',
      firstName: 'Bob',
      lastName: 'Smith',
      companyId: techCorp.id,
      isCompanyAdmin: false,
      profileVisibility: 'NETWORK',
      isProfileComplete: true,
    },
  })

  const techEmp2 = await prisma.user.create({
    data: {
      email: 'designer@techcorp.com',
      firstName: 'Carol',
      lastName: 'Davis',
      companyId: techCorp.id,
      isCompanyAdmin: false,
      profileVisibility: 'COMPANY_ONLY',
      isProfileComplete: true,
    },
  })

  // Create sample users - Design Studio
  const designAdmin = await prisma.user.create({
    data: {
      email: 'admin@designstudio.com',
      firstName: 'David',
      lastName: 'Wilson',
      companyId: designStudio.id,
      isCompanyAdmin: true,
      profileVisibility: 'COMPANY_ONLY',
      isProfileComplete: true,
    },
  })

  const designEmp = await prisma.user.create({
    data: {
      email: 'artist@designstudio.com',
      firstName: 'Eve',
      lastName: 'Martinez',
      companyId: designStudio.id,
      isCompanyAdmin: false,
      profileVisibility: 'NETWORK',
      isProfileComplete: true,
    },
  })

  // Create sample user - not affiliated with a company
  const networkUser = await prisma.user.create({
    data: {
      email: 'freelancer@network.com',
      firstName: 'Frank',
      lastName: 'Brown',
      profileVisibility: 'NETWORK',
      isProfileComplete: true,
    },
  })

  console.log('✅ Created users')

  // Create sample jobs - Internal only at TechCorp
  await prisma.job.create({
    data: {
      title: 'Senior Software Engineer',
      description: 'Looking for experienced backend engineer',
      companyId: techCorp.id,
      ownerId: techAdmin.id,
      jobVisibility: 'COMPANY_ONLY',
      isInternalOnly: true,
      location: 'San Francisco, CA',
      remote: false,
      salaryMin: 150000,
      salaryMax: 200000,
      currency: 'USD',
      referralBudget: 5000,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  })

  // Create sample jobs - Visible to company and network at TechCorp
  await prisma.job.create({
    data: {
      title: 'Product Manager',
      description: 'Help shape our product direction',
      companyId: techCorp.id,
      ownerId: techAdmin.id,
      jobVisibility: 'COMPANY_AND_NETWORK',
      isInternalOnly: false,
      location: 'Remote',
      remote: true,
      salaryMin: 120000,
      salaryMax: 160000,
      currency: 'USD',
      referralBudget: 4000,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  })

  // Create sample jobs - Public job at Design Studio
  await prisma.job.create({
    data: {
      title: 'UI/UX Designer',
      description: 'Create beautiful user experiences',
      companyId: designStudio.id,
      ownerId: designAdmin.id,
      jobVisibility: 'PUBLIC',
      isInternalOnly: false,
      location: 'New York, NY',
      remote: true,
      salaryMin: 90000,
      salaryMax: 130000,
      currency: 'USD',
      referralBudget: 3000,
      status: 'ACTIVE',
      publishedAt: new Date(),
    },
  })

  console.log('✅ Created jobs')

  console.log('✅ Seed completed successfully!')
  console.log('\nTest accounts:')
  console.log('- Company Admin (TechCorp): admin@techcorp.com')
  console.log('- Company Employee (TechCorp): engineer@techcorp.com')
  console.log('- Company Admin (Design): admin@designstudio.com')
  console.log('- Network User (no company): freelancer@network.com')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
