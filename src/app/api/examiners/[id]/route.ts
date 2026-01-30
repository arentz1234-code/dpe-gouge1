import { NextResponse } from 'next/server';
import { query, get } from '@/lib/db';

interface ExaminerRow {
  id: number;
  name: string;
  location: string;
  state: string;
  certificates: string;
  phone: string | null;
  email: string | null;
  created_at: string;
}

interface StatsRow {
  avg_quality: number | null;
  avg_difficulty: number | null;
  total_gouges: number;
  would_recommend_pct: number | null;
  pass_count: number;
  fail_count: number;
}

interface RatingDistRow {
  quality_rating: number;
  count: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examinerId = parseInt(id);

    const examiner = get<ExaminerRow>(
      'SELECT * FROM examiners WHERE id = ?',
      [examinerId]
    );

    if (!examiner) {
      return NextResponse.json({ error: 'Examiner not found' }, { status: 404 });
    }

    const stats = get<StatsRow>(
      `SELECT
        AVG(quality_rating) as avg_quality,
        AVG(difficulty_rating) as avg_difficulty,
        COUNT(*) as total_gouges,
        AVG(would_recommend * 100.0) as would_recommend_pct,
        SUM(CASE WHEN outcome = 'pass' THEN 1 ELSE 0 END) as pass_count,
        SUM(CASE WHEN outcome = 'fail' THEN 1 ELSE 0 END) as fail_count
       FROM gouges WHERE examiner_id = ?`,
      [examinerId]
    );

    // Get rating distribution
    const ratingDist = query<RatingDistRow>(
      `SELECT quality_rating, COUNT(*) as count
       FROM gouges WHERE examiner_id = ?
       GROUP BY quality_rating ORDER BY quality_rating DESC`,
      [examinerId]
    );

    // Get all tags with counts
    const gougesWithTags = query<{ tags: string }>(
      'SELECT tags FROM gouges WHERE examiner_id = ? AND tags IS NOT NULL',
      [examinerId]
    );

    const tagCounts: Record<string, number> = {};
    gougesWithTags.forEach(g => {
      if (g.tags) {
        try {
          const tags = JSON.parse(g.tags);
          tags.forEach((t: string) => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          });
        } catch {}
      }
    });

    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return NextResponse.json({
      ...examiner,
      certificates: JSON.parse(examiner.certificates),
      stats: {
        avg_quality: stats?.avg_quality ? Math.round(stats.avg_quality * 10) / 10 : null,
        avg_difficulty: stats?.avg_difficulty ? Math.round(stats.avg_difficulty * 10) / 10 : null,
        total_gouges: stats?.total_gouges || 0,
        would_recommend_pct: stats?.would_recommend_pct ? Math.round(stats.would_recommend_pct) : null,
        pass_count: stats?.pass_count || 0,
        fail_count: stats?.fail_count || 0,
      },
      rating_distribution: ratingDist,
      top_tags: topTags,
    });
  } catch (error) {
    console.error('Error fetching examiner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
