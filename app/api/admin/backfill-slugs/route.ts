
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { transliterate } from '@/lib/utils';

export async function GET() {
    try {
        const supabase = createAdminClient();

        // Fetch all manga without slugs or with empty slugs
        // Note: Supabase/PostgREST doesn't support "is null or empty" easily in one go for text, 
        // but we can fetch all and filter or check for null.
        const { data: allManga, error } = await supabase
            .from('manga')
            .select('id, title, slug');

        if (error) throw error;

        const updates = [];
        const errors = [];

        for (const manga of allManga || []) {
            if (!manga.slug || manga.slug.trim() === '') {
                const sourceText = transliterate(manga.title);
                let baseSlug = sourceText
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '');

                // Ensure it's unique-ish by appending ID if very short or generic, 
                // but since this is a backfill, we might just append a short hash or check existence.
                // For simplicity/speed in backfill, let's just append the ID to be safe and unique.
                const finalSlug = `${baseSlug}-${manga.id.slice(0, 8)}`;

                const { error: updateError } = await supabase
                    .from('manga')
                    .update({ slug: finalSlug })
                    .eq('id', manga.id);

                if (updateError) {
                    errors.push({ id: manga.id, error: updateError.message });
                } else {
                    updates.push({ id: manga.id, title: manga.title, newSlug: finalSlug });
                }
            }
        }

        return NextResponse.json({
            success: true,
            totalProcessed: allManga?.length,
            updatedCount: updates.length,
            updates,
            errors
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
