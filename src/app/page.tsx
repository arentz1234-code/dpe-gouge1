'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Examiner {
  id: number;
  name: string;
  location: string;
  state: string;
  certificates: string[];
  avg_quality: number | null;
  avg_difficulty: number | null;
  would_recommend_pct: number | null;
  total_gouges: number;
  top_tags: string[];
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!search.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/examiners?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        setExaminers(await res.json());
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingClass = (rating: number | null) => {
    if (!rating) return 'bg-gray-300';
    if (rating >= 4) return 'rating-good';
    if (rating >= 2.5) return 'rating-ok';
    return 'rating-bad';
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-[#00a67c] to-[#008f6b] text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Find Your DPE</h1>
          <p className="text-xl mb-8 opacity-90">
            Read reviews. Get the gouge. Pass your checkride.
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex bg-white rounded-lg overflow-hidden shadow-lg">
              <input
                type="text"
                placeholder="Search for a DPE by name or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-6 py-4 text-gray-900 text-lg focus:outline-none"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#1a1a1a] text-white font-semibold hover:bg-black"
              >
                Search
              </button>
            </div>
          </form>

          <Link
            href="/add-examiner"
            className="inline-block mt-6 text-white/80 hover:text-white underline"
          >
            Can&apos;t find your DPE? Add them
          </Link>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Searching...</div>
        ) : hasSearched && examiners.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-500 mb-4">No DPEs found for &quot;{search}&quot;</p>
            <Link href="/add-examiner" className="text-[#00a67c] hover:underline">
              Be the first to add this DPE
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {examiners.map((examiner) => (
              <Link
                key={examiner.id}
                href={`/examiner/${examiner.id}`}
                className="card p-6 flex gap-6 hover:shadow-lg transition-shadow block"
              >
                {/* Rating Box */}
                <div className="flex flex-col items-center">
                  <div className={`rating-box ${getRatingClass(examiner.avg_quality)}`}>
                    {examiner.avg_quality?.toFixed(1) || 'N/A'}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">QUALITY</p>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold">{examiner.name}</h2>
                  <p className="text-gray-500">
                    {examiner.location}, {examiner.state} • {examiner.certificates.join(', ')}
                  </p>

                  <div className="flex gap-6 mt-2 text-sm">
                    <div>
                      <span className="font-bold">
                        {examiner.would_recommend_pct !== null
                          ? `${examiner.would_recommend_pct}%`
                          : 'N/A'}
                      </span>
                      <span className="text-gray-500 ml-1">would recommend</span>
                    </div>
                    <div>
                      <span className="font-bold">
                        {examiner.avg_difficulty?.toFixed(1) || 'N/A'}
                      </span>
                      <span className="text-gray-500 ml-1">difficulty</span>
                    </div>
                  </div>

                  {examiner.top_tags && examiner.top_tags.length > 0 && (
                    <div className="mt-3">
                      {examiner.top_tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Review Count */}
                <div className="text-right text-gray-500">
                  <p className="font-bold text-lg">{examiner.total_gouges}</p>
                  <p className="text-sm">{examiner.total_gouges === 1 ? 'review' : 'reviews'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Browse by State */}
        {!hasSearched && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Browse by State</h2>
            <div className="flex flex-wrap gap-2">
              {['CA', 'TX', 'FL', 'AZ', 'CO', 'WA', 'NY', 'IL', 'GA', 'NC'].map((state) => (
                <button
                  key={state}
                  onClick={() => { setSearch(state); handleSearch(); }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
