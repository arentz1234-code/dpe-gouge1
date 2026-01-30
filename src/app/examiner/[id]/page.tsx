'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

const DPE_TAGS = [
  'Fair', 'Thorough', 'By the book', 'Relaxed', 'Friendly', 'Professional',
  'Good feedback', 'Intimidating', 'Rushed', 'Patient', 'Knowledgeable',
  'Tough oral', 'Easy oral', 'Scenario based', 'Covers everything'
];

interface Examiner {
  id: number;
  name: string;
  location: string;
  state: string;
  certificates: string[];
  phone: string | null;
  email: string | null;
  stats: {
    avg_quality: number | null;
    avg_difficulty: number | null;
    total_gouges: number;
    would_recommend_pct: number | null;
    pass_count: number;
    fail_count: number;
  };
  rating_distribution: { quality_rating: number; count: number }[];
  top_tags: { tag: string; count: number }[];
}

interface Gouge {
  id: number;
  username: string;
  checkride_type: string;
  checkride_date: string | null;
  outcome: string;
  quality_rating: number;
  difficulty_rating: number;
  would_recommend: boolean;
  tags: string[];
  comment: string;
  oral_topics: string | null;
  flight_maneuvers: string | null;
  tips: string | null;
  thumbs_up: number;
  thumbs_down: number;
  user_vote: number | null;
  created_at: string;
}

export default function ExaminerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [examiner, setExaminer] = useState<Examiner | null>(null);
  const [gouges, setGouges] = useState<Gouge[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('recent');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id, sort]);

  const fetchData = async () => {
    try {
      const [examinerRes, gougesRes] = await Promise.all([
        fetch(`/api/examiners/${id}`),
        fetch(`/api/examiners/${id}/gouges?sort=${sort}`),
      ]);
      if (examinerRes.ok) setExaminer(await examinerRes.json());
      if (gougesRes.ok) setGouges(await gougesRes.json());
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

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!examiner) return <div className="text-center py-12">Examiner not found</div>;

  const maxRatingCount = Math.max(...examiner.rating_distribution.map(r => r.count), 1);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex gap-8 mb-8">
        {/* Rating Box */}
        <div className="text-center">
          <div className={`rating-box ${getRatingClass(examiner.stats.avg_quality)}`} style={{ width: 120, height: 120, fontSize: '3.5rem' }}>
            {examiner.stats.avg_quality?.toFixed(1) || 'N/A'}
          </div>
          <p className="text-sm text-gray-500 mt-2 font-medium">Overall Quality</p>
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{examiner.name}</h1>
          <p className="text-xl text-gray-500 mb-2">
            DPE at {examiner.location}, {examiner.state}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {examiner.certificates.map((cert) => (
              <span key={cert} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-medium">
                {cert}
              </span>
            ))}
          </div>

          <div className="flex gap-8 text-sm">
            <div>
              <p className="text-2xl font-bold">{examiner.stats.would_recommend_pct ?? 'N/A'}%</p>
              <p className="text-gray-500">Would take again</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{examiner.stats.avg_difficulty?.toFixed(1) ?? 'N/A'}</p>
              <p className="text-gray-500">Level of difficulty</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{examiner.stats.pass_count}</p>
              <p className="text-gray-500">Passes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{examiner.stats.fail_count}</p>
              <p className="text-gray-500">Fails</p>
            </div>
          </div>

          {(examiner.phone || examiner.email) && (
            <div className="mt-4 text-sm text-gray-500">
              {examiner.phone && <span className="mr-4">{examiner.phone}</span>}
              {examiner.email && <a href={`mailto:${examiner.email}`} className="text-[#00a67c]">{examiner.email}</a>}
            </div>
          )}
        </div>
      </div>

      {/* Rating Distribution */}
      {examiner.stats.total_gouges > 0 && (
        <div className="card p-6 mb-6">
          <h3 className="font-bold mb-4">Rating Distribution</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const dist = examiner.rating_distribution.find(r => r.quality_rating === rating);
              const count = dist?.count || 0;
              const width = (count / maxRatingCount) * 100;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <span className="w-12 text-sm">{'★'.repeat(rating)}</span>
                  <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-[#00a67c]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-8 text-sm text-gray-500">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {examiner.top_tags.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-3">Top Tags</h3>
          <div className="flex flex-wrap">
            {examiner.top_tags.map(({ tag, count }) => (
              <span key={tag} className="tag">
                {tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">
          {examiner.stats.total_gouges} {examiner.stats.total_gouges === 1 ? 'Review' : 'Reviews'}
        </h3>

        <div className="flex items-center gap-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>

          {session ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-2 bg-[#00a67c] text-white rounded hover:bg-[#008f6b]"
            >
              {showForm ? 'Cancel' : 'Rate this DPE'}
            </button>
          ) : (
            <Link href="/login" className="px-6 py-2 bg-[#00a67c] text-white rounded hover:bg-[#008f6b]">
              Login to Rate
            </Link>
          )}
        </div>
      </div>

      {showForm && <ReviewForm examinerId={examiner.id} onSuccess={() => { setShowForm(false); fetchData(); }} />}

      {/* Reviews */}
      <div className="space-y-4">
        {gouges.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          gouges.map((gouge) => (
            <ReviewCard key={gouge.id} gouge={gouge} onVote={fetchData} />
          ))
        )}
      </div>
    </div>
  );
}

function ReviewCard({ gouge, onVote }: { gouge: Gouge; onVote: () => void }) {
  const { data: session } = useSession();
  const [thumbsUp, setThumbsUp] = useState(gouge.thumbs_up);
  const [thumbsDown, setThumbsDown] = useState(gouge.thumbs_down);
  const [userVote, setUserVote] = useState(gouge.user_vote);

  const handleVote = async (vote: number) => {
    if (!session) {
      alert('Please login to vote');
      return;
    }

    const newVote = userVote === vote ? 0 : vote;
    const res = await fetch(`/api/gouges/${gouge.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: newVote }),
    });

    if (res.ok) {
      const data = await res.json();
      setThumbsUp(data.thumbs_up);
      setThumbsDown(data.thumbs_down);
      setUserVote(newVote === 0 ? null : newVote);
    }
  };

  const getRatingClass = (rating: number) => {
    if (rating >= 4) return 'rating-good';
    if (rating >= 2.5) return 'rating-ok';
    return 'rating-bad';
  };

  const outcomeColors = {
    pass: 'bg-green-100 text-green-800',
    fail: 'bg-red-100 text-red-800',
    discontinue: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="card p-6">
      <div className="flex gap-4">
        {/* Rating */}
        <div className="text-center">
          <div className={`rating-box ${getRatingClass(gouge.quality_rating)}`} style={{ width: 60, height: 60, fontSize: '1.5rem' }}>
            {gouge.quality_rating}
          </div>
          <p className="text-xs text-gray-500 mt-1">QUALITY</p>
        </div>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-2 py-0.5 rounded text-sm font-medium ${outcomeColors[gouge.outcome as keyof typeof outcomeColors]}`}>
              {gouge.outcome.toUpperCase()}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm">{gouge.checkride_type}</span>
            <span className="text-sm text-gray-500">
              Difficulty: <strong>{gouge.difficulty_rating}</strong>
            </span>
            <span className="text-sm text-gray-500">
              {gouge.would_recommend ? '👍 Would recommend' : '👎 Would not recommend'}
            </span>
          </div>

          {/* Tags */}
          {gouge.tags.length > 0 && (
            <div className="mb-2">
              {gouge.tags.map((tag) => (
                <span key={tag} className="tag text-xs">{tag}</span>
              ))}
            </div>
          )}

          {/* Comment */}
          <p className="text-gray-700 dark:text-gray-300 mb-3">{gouge.comment}</p>

          {/* Details */}
          {gouge.oral_topics && (
            <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <strong className="text-sm">Oral Topics:</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400">{gouge.oral_topics}</p>
            </div>
          )}

          {gouge.flight_maneuvers && (
            <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <strong className="text-sm">Flight Maneuvers:</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400">{gouge.flight_maneuvers}</p>
            </div>
          )}

          {gouge.tips && (
            <div className="mb-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
              <strong className="text-sm">💡 Tips:</strong>
              <p className="text-sm text-gray-600 dark:text-gray-400">{gouge.tips}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500">
              <span>by {gouge.username}</span>
              <span className="mx-2">•</span>
              <span>{new Date(gouge.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => handleVote(1)}
                className={`flex items-center gap-1 ${userVote === 1 ? 'text-[#00a67c]' : 'text-gray-500 hover:text-[#00a67c]'}`}
              >
                👍 <span>{thumbsUp}</span>
              </button>
              <button
                onClick={() => handleVote(-1)}
                className={`flex items-center gap-1 ${userVote === -1 ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
              >
                👎 <span>{thumbsDown}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewForm({ examinerId, onSuccess }: { examinerId: number; onSuccess: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    checkride_type: 'PPL',
    checkride_date: '',
    outcome: 'pass',
    quality_rating: 0,
    difficulty_rating: 0,
    would_recommend: true,
    tags: [] as string[],
    comment: '',
    oral_topics: '',
    flight_maneuvers: '',
    tips: '',
  });

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.quality_rating === 0 || form.difficulty_rating === 0) {
      setError('Please select both quality and difficulty ratings');
      return;
    }
    if (form.comment.length < 20) {
      setError('Please write at least 20 characters about your experience');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/examiners/${examinerId}/gouges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit');
      }
    } catch {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Rate this DPE</h3>

      {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Quality *</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, quality_rating: n })}
                className={`w-12 h-12 rounded font-bold text-lg ${
                  form.quality_rating === n
                    ? n >= 4 ? 'bg-[#00a67c] text-white' : n >= 2.5 ? 'bg-[#ffbd00] text-black' : 'bg-[#ff6666] text-white'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Difficulty *</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, difficulty_rating: n })}
                className={`w-12 h-12 rounded font-bold text-lg ${
                  form.difficulty_rating === n
                    ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-black'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Checkride Type *</label>
          <select
            value={form.checkride_type}
            onChange={(e) => setForm({ ...form, checkride_type: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            {['PPL', 'IR', 'CPL', 'CFI', 'CFII', 'MEI', 'ATP', 'Sport'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Outcome *</label>
          <select
            value={form.outcome}
            onChange={(e) => setForm({ ...form, outcome: e.target.value })}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="discontinue">Discontinue</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Would you recommend?</label>
          <select
            value={form.would_recommend ? 'yes' : 'no'}
            onChange={(e) => setForm({ ...form, would_recommend: e.target.value === 'yes' })}
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Tags (optional)</label>
        <div className="flex flex-wrap">
          {DPE_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`tag cursor-pointer ${form.tags.includes(tag) ? 'selected' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Your Experience * (min 20 characters)</label>
        <textarea
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
          rows={4}
          placeholder="Describe your overall experience with this DPE..."
          className="w-full p-3 border rounded dark:bg-gray-800 dark:border-gray-700"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Oral Topics (optional)</label>
          <textarea
            value={form.oral_topics}
            onChange={(e) => setForm({ ...form, oral_topics: e.target.value })}
            rows={2}
            placeholder="Topics covered..."
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Flight Maneuvers (optional)</label>
          <textarea
            value={form.flight_maneuvers}
            onChange={(e) => setForm({ ...form, flight_maneuvers: e.target.value })}
            rows={2}
            placeholder="Maneuvers performed..."
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tips (optional)</label>
          <textarea
            value={form.tips}
            onChange={(e) => setForm({ ...form, tips: e.target.value })}
            rows={2}
            placeholder="Advice for future applicants..."
            className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 bg-[#00a67c] text-white rounded font-semibold hover:bg-[#008f6b] disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
