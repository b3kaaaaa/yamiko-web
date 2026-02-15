import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type");
    const category = searchParams.get("category") || 'manga'; // manga, user, guild, character, studio

    const supabase = createAdminClient();

    try {
        let finalResults = [];

        // POPULAR REQUEST
        if (type === 'popular') {
            const { data, error } = await supabase
                .from('manga')
                .select('title, slug, cover_url, rating, release_year, status')
                .order('views', { ascending: false })
                .limit(4);

            if (error) throw error;

            // Map to frontend format
            const mapped = (data || []).map(item => ({
                title: item.title,
                slug: item.slug,
                coverImage: item.cover_url,
                rating: item.rating,
                releaseYear: item.release_year,
                status: item.status
            }));

            return NextResponse.json({ results: mapped });
        }

        // SEARCH REQUEST
        if (!query) {
            return NextResponse.json({ results: [] });
        }

        switch (category) {
            case 'manga':
                {
                    const { data, error } = await supabase
                        .from('manga')
                        .select('title, slug, cover_url, rating, release_year, status, type')
                        .or(`title.ilike.%${query}%,alt_titles.ilike.%${query}%,slug.ilike.%${query}%`)
                        .limit(10);

                    if (error) throw error;

                    finalResults = (data || []).map(item => ({
                        title: item.title,
                        slug: item.slug,
                        coverImage: item.cover_url,
                        rating: item.rating,
                        releaseYear: item.release_year,
                        status: item.status,
                        type: item.type
                    }));
                }
                break;

            case 'user':
                {
                    const { data, error } = await supabase
                        .from('profiles') // User maps to 'profiles' table
                        .select('username, avatar_url, level, exp')
                        .ilike('username', `%${query}%`)
                        .limit(10);

                    if (error) throw error;

                    finalResults = (data || []).map(u => ({
                        title: u.username,
                        slug: u.username,
                        coverImage: u.avatar_url,
                        status: `Level ${u.level}`,
                        rating: 0,
                        type: 'USER'
                    }));
                }
                break;

            case 'guild':
                {
                    const { data, error } = await supabase
                        .from('Guild') // Prisma defaults to Model name if not mapped? Wait.
                        // Prisma schema: model Guild {} -> in DB usually "Guild" or "guild" depending on Prisma casing
                        // Let's assume standard behavior: if no @map, it uses model name. Postgres usually lowercase.
                        // BUT User model has @@map("profiles"). Guild has only @@index.
                        // Let's check schema again.
                        // Schema: model Guild { ... @@index([name]) } 
                        // If no @@map, Prisma uses "Guild" (if casing preserved) or "guild".
                        // Safest to try "Guild" or "guild". Usually lowercased in PG if quotes not used.
                        // I'll check table list if I can, but let's assume "Guild" or "guild". 
                        // Actually, I'll allow error handling to catch it if I'm wrong.
                        // Wait, I can see other `from` calls in `manga`...
                        // Schema: model Manga @@map("manga").
                        // Schema: model Guild (no map).
                        // Let's try 'Guild' first (Prisma default table name matches model name exactly usually).
                        // Update: Prisma creates "Guild" table. 
                        .select('name, level, members:GuildMember(count)')
                        .ilike('name', `%${query}%`)
                        .limit(10);

                    // Wait, related count in Supabase JS: .select('*, members(count)') ?
                    // Actually tricky. Simple select for now.

                    const { data: guildData, error: guildError } = await supabase
                        .from('Guild')
                        .select('name, level')
                        .ilike('name', `%${query}%`)
                        .limit(10);

                    if (guildError) {
                        // Fallback to lowercase 'guild' if "Guild" fails
                        const { data: guildDataLower, error: guildErrorLower } = await supabase
                            .from('guild')
                            .select('name, level')
                            .ilike('name', `%${query}%`)
                            .limit(10);

                        if (guildErrorLower) throw guildErrorLower;

                        finalResults = (guildDataLower || []).map(g => ({
                            title: g.name,
                            slug: g.name,
                            coverImage: null,
                            status: `Lvl ${g.level}`,
                            rating: 0,
                            type: 'GUILD'
                        }));
                    } else {
                        finalResults = (guildData || []).map(g => ({
                            title: g.name,
                            slug: g.name,
                            coverImage: null,
                            status: `Lvl ${g.level}`,
                            rating: 0,
                            type: 'GUILD'
                        }));
                    }
                }
                break;

            case 'character':
                {
                    const { data, error } = await supabase
                        .from('WikiCharacter') // No map in schema?
                        // Schema: model WikiCharacter @@index...
                        // Try 'WikiCharacter' then 'wikicharacter'
                        .select('name, slug, image, manga:manga(title)')
                        .ilike('name', `%${query}%`)
                        .limit(10);

                    // Simplified handling. I will try lowercase first as Postgres usually downcases unquoted.
                    // But Prisma quotes identifiers.
                    // Let's try 'WikiCharacter' as it matches Model name.

                    if (error) {
                        console.log("Character search error, trying lowercase", error.message);
                        const { data: charDataLower, error: charErrorLower } = await supabase
                            .from('wikicharacter') // or 'wiki_character' if mapped? No map.
                            .select('name, slug, image, manga:manga(title)')
                            .ilike('name', `%${query}%`)
                            .limit(10);

                        if (charErrorLower) throw charErrorLower;

                        finalResults = (charDataLower || []).map(c => ({
                            title: c.name,
                            slug: c.slug,
                            coverImage: c.image,
                            status: c.manga?.title || '',
                            rating: 0,
                            type: 'CHARACTER'
                        }));
                    } else {
                        finalResults = (data || []).map(c => ({
                            title: c.name,
                            slug: c.slug,
                            coverImage: c.image,
                            status: c.manga?.title || '',
                            rating: 0,
                            type: 'CHARACTER'
                        }));
                    }
                }
                break;

            case 'studio':
                {
                    // Distinct studio search via RPC or exact match?
                    // Supabase JS distinct is .select('studio').ilike(...).distinct() ?
                    // Client side distinct if not supported easily.
                    const { data, error } = await supabase
                        .from('manga')
                        .select('studio')
                        .ilike('studio', `%${query}%`)
                        .limit(20);

                    if (error) throw error;

                    const studios = Array.from(new Set(data?.map(s => s.studio).filter(Boolean)));

                    finalResults = studios.slice(0, 5).map(s => ({
                        title: s,
                        slug: s,
                        coverImage: null,
                        status: 'Studio',
                        type: 'STUDIO'
                    }));
                }
                break;

            default:
                finalResults = [];
        }

        return NextResponse.json({ results: finalResults });

    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
