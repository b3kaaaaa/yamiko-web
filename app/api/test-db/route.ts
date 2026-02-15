// Test Database Connection Endpoint
// GET /api/test-db

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Test database connection
        await prisma.$connect();

        // Get counts from database
        const userCount = await prisma.user.count();
        const mangaCount = await prisma.manga.count();
        const chapterCount = await prisma.chapter.count();
        const guildCount = await prisma.guild.count();

        // Get sample user (if exists)
        const sampleUser = await prisma.user.findFirst({
            select: {
                id: true,
                username: true,
                level: true,
                exp: true,
                rubies: true,
                energy: true,
                role: true,
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Database connection successful! ✅',
            database: {
                connected: true,
                counts: {
                    users: userCount,
                    manga: mangaCount,
                    chapters: chapterCount,
                    guilds: guildCount,
                },
            },
            sampleUser: sampleUser || 'No users in database yet',
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Database connection error:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Database connection failed! ❌',
                error: error.message,
                hint: 'Make sure PostgreSQL is running and DATABASE_URL is correct in .env',
            },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
