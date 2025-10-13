/**
 * INDIVIDUAL INTRODUCTION API
 *
 * Endpoints for managing a specific introduction.
 * Handles establishing connections and updating notes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/introductions/[id]
 * Update introduction status or notes
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Fetch the introduction
    const introduction = await prisma.introduction.findUnique({
      where: { id }
    })

    if (!introduction) {
      return NextResponse.json(
        { error: 'Introduction not found' },
        { status: 404 }
      )
    }

    // Check if user is part of this introduction
    if (introduction.personAId !== user.id && introduction.personBId !== user.id) {
      return NextResponse.json(
        { error: 'You are not part of this introduction' },
        { status: 403 }
      )
    }

    const { status, notes } = await request.json()

    // Build update data
    const updateData: any = {}

    // Update status if provided
    if (status) {
      if (!['ESTABLISHED', 'INACTIVE'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be ESTABLISHED or INACTIVE' },
          { status: 400 }
        )
      }

      updateData.status = status

      // If establishing connection, set establishedAt timestamp
      if (status === 'ESTABLISHED' && !introduction.establishedAt) {
        updateData.establishedAt = new Date()
      }
    }

    // Update notes if provided
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update the introduction
    const updatedIntroduction = await prisma.introduction.update({
      where: { id: id },
      data: updateData,
      include: {
        personA: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true
          }
        },
        personB: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true
          }
        },
        introducedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    // Format response from user's perspective
    const isPersonA = updatedIntroduction.personAId === user.id
    const otherPerson = isPersonA ? updatedIntroduction.personB : updatedIntroduction.personA

    const formattedIntroduction = {
      id: updatedIntroduction.id,
      otherPerson,
      introducedBy: updatedIntroduction.introducedBy,
      context: updatedIntroduction.context,
      status: updatedIntroduction.status,
      notes: updatedIntroduction.notes,
      createdAt: updatedIntroduction.createdAt,
      establishedAt: updatedIntroduction.establishedAt
    }

    return NextResponse.json({
      message: 'Introduction updated successfully',
      introduction: formattedIntroduction
    })

  } catch (error) {
    console.error('Introduction update error:', error)
    return NextResponse.json(
      { error: 'Failed to update introduction' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/introductions/[id]
 * Mark an introduction as inactive (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { id } = await params

    // Fetch the introduction
    const introduction = await prisma.introduction.findUnique({
      where: { id }
    })

    if (!introduction) {
      return NextResponse.json(
        { error: 'Introduction not found' },
        { status: 404 }
      )
    }

    // Check if user is part of this introduction
    if (introduction.personAId !== user.id && introduction.personBId !== user.id) {
      return NextResponse.json(
        { error: 'You are not part of this introduction' },
        { status: 403 }
      )
    }

    // Mark as inactive
    await prisma.introduction.update({
      where: { id: id },
      data: { status: 'INACTIVE' }
    })

    return NextResponse.json({
      message: 'Introduction marked as inactive'
    })

  } catch (error) {
    console.error('Introduction delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete introduction' },
      { status: 500 }
    )
  }
}