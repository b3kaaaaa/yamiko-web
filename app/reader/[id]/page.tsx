import { getChapterContent } from '@/lib/services/content';
import { notFound } from 'next/navigation';
import ReaderViewer from './components/ReaderViewer';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ReaderPage({ params }: PageProps) {
    const { id } = await params;

    // Fetch chapter with navigation context
    const result = await getChapterContent(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const { chapter, manga, navigation } = result.data;

    return (
        <ReaderViewer
            chapter={chapter}
            manga={manga}
            navigation={navigation}
        />
    );
}
