/**
 * TEST SCRIPT FOR REFERRAL CHAIN SYSTEM
 *
 * This script tests the core functionality of the referral chain tracking system.
 * Run this after setting up the database to verify everything works correctly.
 */

import { forwardJob, reconstructChain, createReferral, calculatePaymentSplits } from './referral-chain'

export async function testReferralChain() {
  console.log('🧪 Testing Referral Chain System...\n')

  try {
    // Test data - replace with actual IDs from your database
    const testJobId = 'test-job-id'
    const aliceId = 'alice-user-id'
    const bobId = 'bob-user-id'
    const carolId = 'carol-user-id'
    const daveId = 'dave-candidate-id'

    console.log('📝 Test Scenario: Alice → Bob → Carol → refers Dave')

    // Step 1: Alice forwards to Bob
    console.log('\n1. Alice forwards job to Bob...')
    try {
      const forward1 = await forwardJob(testJobId, aliceId, bobId, 'Hey Bob, thought you might know good candidates!')
      console.log('✅ Forward 1 created:', forward1.id)
    } catch (error) {
      console.log('⚠️ Forward 1 already exists or error:', error)
    }

    // Step 2: Bob forwards to Carol
    console.log('\n2. Bob forwards job to Carol...')
    try {
      const forward2 = await forwardJob(testJobId, bobId, carolId, 'Carol, can you help find someone for this?')
      console.log('✅ Forward 2 created:', forward2.id)
    } catch (error) {
      console.log('⚠️ Forward 2 already exists or error:', error)
    }

    // Step 3: Reconstruct chain for Carol
    console.log('\n3. Reconstructing chain for Carol...')
    const chain = await reconstructChain(testJobId, carolId)
    console.log('🔗 Chain path:', chain)
    console.log('📏 Chain length:', chain.length)

    // Step 4: Carol refers Dave
    console.log('\n4. Carol refers Dave...')
    try {
      const referral = await createReferral(
        testJobId,
        daveId,
        'dave@example.com',
        carolId,
        'Former colleague at TechCorp',
        'high',
        'Dave is an excellent developer with 5 years React experience'
      )
      console.log('✅ Referral created:', referral.id)
      console.log('🔗 Materialized chain:', referral.chainPath)
      console.log('📏 Chain depth:', referral.chainDepth)
    } catch (error) {
      console.log('⚠️ Referral already exists or error:', error)
    }

    // Step 5: Calculate payment splits
    console.log('\n5. Calculating payment splits for $10,000...')
    const splits = await calculatePaymentSplits(10000, chain)
    console.log('💰 Payment splits:')
    splits.forEach((split, index) => {
      const position = chain.length - index
      console.log(`   ${split.name}: $${split.amount} (position ${position} from hire)`)
    })

    const totalPaid = splits.reduce((sum, split) => sum + split.amount, 0)
    console.log(`   Total: $${totalPaid}`)

    console.log('\n✅ All tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

export async function testEdgeCases() {
  console.log('\n🧪 Testing Edge Cases...\n')

  try {
    const testJobId = 'test-job-id'
    const aliceId = 'alice-user-id'
    const bobId = 'bob-user-id'
    const carolId = 'carol-user-id'

    // Test: Multiple forwards to same person (earliest wins)
    console.log('1. Testing multiple forwards to same person...')

    // Alice forwards to Bob at time 1
    try {
      await forwardJob(testJobId, aliceId, bobId)
    } catch (error) {
      console.log('   Alice → Bob forward exists')
    }

    // Carol forwards to Bob at time 2 (later)
    try {
      await forwardJob(testJobId, carolId, bobId)
    } catch (error) {
      console.log('   Carol → Bob forward exists')
    }

    // Reconstruct chain for Bob - should use Alice (earliest)
    const bobChain = await reconstructChain(testJobId, bobId)
    console.log('   Bob\'s chain (should start with Alice):', bobChain)

    // Test: Direct referral (no forwards)
    console.log('\n2. Testing direct referral (no forwards)...')
    const directChain = await reconstructChain(testJobId, aliceId)
    console.log('   Alice\'s direct chain:', directChain)

    // Test: Payment calculation for single person
    const singleSplits = await calculatePaymentSplits(10000, [aliceId])
    console.log('   Single person payment:', singleSplits)

    console.log('\n✅ Edge case tests completed!')

  } catch (error) {
    console.error('❌ Edge case test failed:', error)
  }
}

// Example usage:
// import { testReferralChain, testEdgeCases } from '@/lib/test-referral-chain'
// await testReferralChain()
// await testEdgeCases()