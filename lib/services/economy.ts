// Economy & Gacha Service
// Handles card templates, pack opening, and marketplace

import { prisma } from '@/lib/prisma';
import type { CreateCardTemplateInput } from '@/lib/validations';
import type { CardRarity } from '@/lib/types';

/**
 * Create a new card template
 */
export async function createCardTemplate(data: CreateCardTemplateInput) {
    try {
        const cardTemplate = await prisma.cardTemplate.create({
            data: {
                name: data.name,
                image: data.image,
                rarity: data.rarity,
                stats: data.stats,
                description: data.description,
                collectionId: data.collectionId,
            },
            include: {
                collection: true,
            },
        });

        return {
            success: true,
            data: cardTemplate,
        };
    } catch (error) {
        console.error('Error creating card template:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create card template',
        };
    }
}

/**
 * Drop rate configuration (stored in-memory for now, could be DB-backed)
 */
const PACK_DROP_RATES: Record<string, Record<CardRarity, number>> = {
    STANDARD: {
        COMMON: 60,
        RARE: 25,
        SR: 10,
        SSR: 4,
        UR: 1,
    },
    PREMIUM: {
        COMMON: 0,
        RARE: 50,
        SR: 30,
        SSR: 15,
        UR: 5,
    },
    FEATURED: {
        COMMON: 0,
        RARE: 40,
        SR: 35,
        SSR: 20,
        UR: 5,
    },
};

/**
 * Get drop rates for a pack type
 */
export function getDropRates(packType: string) {
    return PACK_DROP_RATES[packType] || PACK_DROP_RATES.STANDARD;
}

/**
 * Update drop rates configuration (ADMIN only)
 */
export function updateDropRates(packType: string, rates: Record<CardRarity, number>) {
    // Validate rates sum to 100
    const total = Object.values(rates).reduce((sum, rate) => sum + rate, 0);

    if (Math.abs(total - 100) > 0.01) {
        return {
            success: false,
            error: 'Drop rates must sum to 100%',
        };
    }

    PACK_DROP_RATES[packType] = rates;

    return {
        success: true,
        data: PACK_DROP_RATES[packType],
    };
}

/**
 * Generate random rarity based on drop rates
 */
function rollRarity(rates: Record<CardRarity, number>): CardRarity {
    const random = Math.random() * 100;
    let cumulative = 0;

    const rarities: CardRarity[] = ['COMMON', 'RARE', 'SR', 'SSR', 'UR'];

    for (const rarity of rarities) {
        cumulative += rates[rarity];
        if (random <= cumulative) {
            return rarity;
        }
    }

    // Fallback (should never reach here)
    return 'COMMON';
}

/**
 * Open a card pack for a user
 */
export async function openCardPack(userId: string, packType: string) {
    try {
        const PACK_COSTS: Record<string, number> = {
            STANDARD: 100,
            PREMIUM: 300,
            FEATURED: 500,
        };

        const CARDS_PER_PACK = 5;

        const cost = PACK_COSTS[packType] || PACK_COSTS.STANDARD;

        // Check user's rubies balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { rubies: true },
        });

        if (!user || user.rubies < cost) {
            return {
                success: false,
                error: 'Insufficient rubies',
            };
        }

        // Get drop rates
        const rates = getDropRates(packType);

        // Generate cards
        const pulledCards: CardRarity[] = [];
        for (let i = 0; i < CARDS_PER_PACK; i++) {
            pulledCards.push(rollRarity(rates));
        }

        // Fetch random card templates for each rarity
        const userCards = [];

        for (const rarity of pulledCards) {
            const templates = await prisma.cardTemplate.findMany({
                where: { rarity },
            });

            if (templates.length === 0) {
                throw new Error(`No ${rarity} cards available`);
            }

            const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

            const userCard = await prisma.userCard.create({
                data: {
                    userId,
                    templateId: randomTemplate.id,
                },
                include: {
                    template: true,
                },
            });

            userCards.push(userCard);
        }

        // Deduct rubies and create transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    rubies: { decrement: cost },
                },
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    type: 'PURCHASE_CARD_PACK',
                    amount: -cost,
                    description: `Opened ${packType} pack`,
                },
            }),
        ]);

        const hasRare = pulledCards.some((r) => ['SSR', 'UR'].includes(r));

        return {
            success: true,
            data: {
                cards: userCards,
                hasRare,
                newBalance: user.rubies - cost,
            },
        };
    } catch (error) {
        console.error('Error opening card pack:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to open card pack',
        };
    }
}

/**
 * Create a marketplace listing
 */
export async function createListing(userId: string, cardId: string, price: number) {
    try {
        // Verify user owns the card and it's not locked
        const card = await prisma.userCard.findFirst({
            where: {
                id: cardId,
                userId,
                isLocked: false,
            },
        });

        if (!card) {
            return {
                success: false,
                error: 'Card not found or is locked',
            };
        }

        // Check if already listed
        const existingListing = await prisma.marketListing.findUnique({
            where: { cardId },
        });

        if (existingListing) {
            return {
                success: false,
                error: 'Card is already listed',
            };
        }

        const listing = await prisma.marketListing.create({
            data: {
                cardId,
                sellerId: userId,
                price,
                status: 'ACTIVE',
            },
            include: {
                card: {
                    include: {
                        template: true,
                    },
                },
                seller: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return {
            success: true,
            data: listing,
        };
    } catch (error) {
        console.error('Error creating listing:', error);
        return {
            success: false,
            error: 'Failed to create listing',
        };
    }
}

/**
 * Purchase a card from marketplace
 */
export async function purchaseListing(buyerId: string, listingId: string) {
    try {
        const listing = await prisma.marketListing.findUnique({
            where: { id: listingId },
            include: {
                card: true,
                seller: true,
            },
        });

        if (!listing || listing.status !== 'ACTIVE') {
            return {
                success: false,
                error: 'Listing not found or no longer active',
            };
        }

        if (listing.sellerId === buyerId) {
            return {
                success: false,
                error: 'Cannot buy your own listing',
            };
        }

        // Check buyer's balance
        const buyer = await prisma.user.findUnique({
            where: { id: buyerId },
            select: { rubies: true },
        });

        if (!buyer || buyer.rubies < listing.price) {
            return {
                success: false,
                error: 'Insufficient rubies',
            };
        }

        // Execute transaction
        await prisma.$transaction([
            // Transfer card ownership
            prisma.userCard.update({
                where: { id: listing.cardId },
                data: { userId: buyerId },
            }),
            // Update listing status
            prisma.marketListing.update({
                where: { id: listingId },
                data: {
                    status: 'SOLD',
                    soldAt: new Date(),
                },
            }),
            // Deduct rubies from buyer
            prisma.user.update({
                where: { id: buyerId },
                data: { rubies: { decrement: listing.price } },
            }),
            // Add rubies to seller
            prisma.user.update({
                where: { id: listing.sellerId },
                data: { rubies: { increment: listing.price } },
            }),
            // Create buyer transaction
            prisma.transaction.create({
                data: {
                    userId: buyerId,
                    type: 'MARKET_PURCHASE',
                    amount: -listing.price,
                    description: `Purchased ${listing.card.template.name}`,
                },
            }),
            // Create seller transaction
            prisma.transaction.create({
                data: {
                    userId: listing.sellerId,
                    type: 'MARKET_SALE',
                    amount: listing.price,
                    description: `Sold ${listing.card.template.name}`,
                },
            }),
        ]);

        return {
            success: true,
            data: {
                card: listing.card,
                price: listing.price,
            },
        };
    } catch (error) {
        console.error('Error purchasing listing:', error);
        return {
            success: false,
            error: 'Failed to purchase listing',
        };
    }
}
