import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { normalizeChapterId, normalizeTag } from '../utils/tagNormalize';

type ChapterTagIndex = {
  byChapter: Map<string, Set<string>>;     // chapterId -> set of normalized tags
  ownerByTag: Map<string, string>;         // normalized tag -> chapterId
  loading: boolean;
  error?: string;
};

export function useChapterTagIndex(syllabusChapters: string[]): ChapterTagIndex {
  const [state, setState] = useState<ChapterTagIndex>({
    byChapter: new Map(),
    ownerByTag: new Map(),
    loading: true,
  });

  const ids = useMemo(
    () => (syllabusChapters || []).map(normalizeChapterId).filter(Boolean),
    [syllabusChapters]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const byChapter = new Map<string, Set<string>>();
        const ownerByTag = new Map<string, string>();

        for (const chapterId of ids) {
          const snap = await getDoc(doc(firestore, 'Chapters', chapterId));
          if (!snap.exists()) continue;

          const data = snap.data() as any;
          const rawList: string[] =
            Array.isArray(data?.skillTags) ? data.skillTags : [];

          const normSet = new Set<string>();
          for (const t of rawList) {
            const key = normalizeTag(t);
            if (!key) continue;
            normSet.add(key);
            // Register ownership (first writer wins; dupes across chapters should not happen)
            if (!ownerByTag.has(key)) ownerByTag.set(key, chapterId);
          }
          byChapter.set(chapterId, normSet);
        }

        if (!cancelled) {
          setState({ byChapter, ownerByTag, loading: false });
        }
      } catch (e: any) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false, error: e?.message || 'Failed to load chapter tags' }));
        }
      }
    }

    setState(s => ({ ...s, loading: true, error: undefined }));
    run();

    return () => { cancelled = true; };
  }, [ids.join('|')]);

  return state;
}
