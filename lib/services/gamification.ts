// Gamification Service
// Handles EXP, level-ups, and admin grants
// 
// ECONOMY MODEL:
// - Rubies: Premium currency (purchased or admin-granted only)
// - Energy: Soft currency (regenerates, granted on level-up)

import { prisma } from '@/lib/prisma';

/**
 * Calculate EXP required for next level
 */
export function calculateExpToNextLevel(level: number): number {
    return Math.floor(100 * Math.pow(level, 1.5));
}

/**
 * Add EXP to a user and handle level-ups
 */
export async function addExp(userId: string, amount: number) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, level: true, exp: true },
        });

        if (!user) {
            return {
                success: false,
                error: 'User not found',
            };
        }

        let newExp = user.exp + amount;
        let newLevel = user.level;
        let totalLevelsGained = 0;

        // Check for level-ups
        let threshold = calculateExpToNextLevel(newLevel);

        while (newExp >= threshold) {
            newLevel++;
            newExp -= threshold;
            totalLevelsGained++;
            threshold = calculateExpToNextLevel(newLevel);
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                level: newLevel,
                exp: newExp,
            },
        });

        // If leveled up, send notification and grant rewards
        if (totalLevelsGained > 0) {
            const energyReward = 50; // Fixed +50 Energy per level

            await prisma.$transaction([
                // Grant Energy (capped at 100 max)
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        energy: { increment: energyReward },
                    },
                }),
                // Create notification
                prisma.notification.create({
                    data: {
                        userId,
                        type: 'LEVEL_UP',
                        title: '🎉 Level Up!',
                        message: `Congratulations! You reached level ${newLevel} and earned ${energyReward} Energy!`,
                        data: {
                            newLevel,
                            energyEarned: energyReward,
                        },
                    },
                }),
            ]);

            return {
                success: true,
                data: {
                    ...updatedUser,
                    leveledUp: true,
                    levelsGained: totalLevelsGained,
                    energyReward,
                },
            };
        }

        return {
            success: true,
            data: {
                ...updatedUser,
                leveledUp: false,
            },
        };
    } catch (error) {
        console.error('Error adding EXP:', error);
        return {
            success: false,
            error: 'Failed to add EXP',
        };
    }
}

/**
 * Grant rubies to a user
 * ADMIN ONLY - For support, compensation, or payment processing
 * Rubies are PREMIUM CURRENCY and should NOT be granted freely
 */
export async function grantRubies(userId: string, amount: number, reason: string) {
    try {
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    rubies: { increment: amount },
                },
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    type: 'DAILY_REWARD',
                    amount,
                    description: reason,
                },
            }),
            prisma.notification.create({
                data: {
                    userId,
                    type: 'GIFT',
                    title: '💎 Rubies Received',
                    message: `You received ${amount} rubies! ${reason}`,
                },
            }),
        ]);

        return {
            success: true,
            data: {
                granted: amount,
                reason,
            },
        };
    } catch (error) {
        console.error('Error granting rubies:', error);
        return {
            success: false,
            error: 'Failed to grant rubies',
        };
    }
}

/**
 * Grant EXP to a user (ADMIN function for testing/support)
 */
export async function grantExp(userId: string, amount: number, reason: string) {
    try {
        const result = await addExp(userId, amount);

        if (!result.success) {
            return result;
        }

        // Send notification about manual EXP grant
        await prisma.notification.create({
            data: {
                userId,
                type: 'SYSTEM',
                title: '⭐ EXP Granted',
                message: `You received ${amount} EXP! ${reason}`,
            },
        });

        return {
            success: true,
            data: {
                ...result.data,
                granted: amount,
                reason,
            },
        };
    } catch (error) {
        console.error('Error granting EXP:', error);
        return {
            success: false,
            error: 'Failed to grant EXP',
        };
    }
}

/**
 * Track chapter completion and auto-grant EXP
 */
export async function completeChapter(userId: string, chapterId: string) {
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId },
            include: {
                manga: {
                    select: { title: true },
                },
            },
        });

        if (!chapter) {
            return {
                success: false,
                error: 'Chapter not found',
            };
        }

        // Update reading history to 100%
        await prisma.readingHistory.upsert({
            where: {
                userId_chapterId: {
                    userId,
                    chapterId,
                },
            },
            create: {
                userId,
                mangaId: chapter.mangaId,
                chapterId,
                progress: 100,
            },
            update: {
                progress: 100,
                lastReadAt: new Date(),
            },
        });

        // Grant 10 EXP for completing chapter
        const expResult = await addExp(userId, 10);

        return {
            success: true,
            data: {
                chapter: {
                    title: chapter.title,
                    number: chapter.number,
                    manga: chapter.manga.title,
                },
                expGained: 10,
                leveledUp: expResult.data?.leveledUp || false,
            },
        };
    } catch (error) {
        console.error('Error completing chapter:', error);
        return {
            success: false,
            error: 'Failed to complete chapter',
        };
    }
}
