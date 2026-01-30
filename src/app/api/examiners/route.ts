import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, run } from '@/lib/db';
import { z } from 'zod';

const examinerSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  state: z.string().min(2).max(2),
  certificates: z.array(z.string()).min(1),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
});

interface ExaminerRow {
  id: number;
  name: string;
  location: string;
  state: string;
  certificates: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  avg_quality: number | null;
  avg_difficulty: number | null;
  would_recommend_pct: number | null;
  total_gouges: number;
  all_tags: string | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const state = searchParams.get('state');

    let sql = `
      SELECT e.*,
        AVG(g.quality_rating) as avg_quality,
        AVG(g.difficulty_rating) as avg_difficulty,
        AVG(g.would_recommend * 100.0) as would_recommend_pct,
        COUNT(g.id) as total_gouges,
        GROUP_CONCAT(g.tags) as all_tags
      FROM examiners e
      LEFT JOIN gouges g ON e.id = g.examiner_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (search) {
      sql += ' AND (e.name LIKE ? OR e.location LIKE ? OR e.state LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (state) {
      sql += ' AND e.state = ?';
      params.push(state);
    }

    sql += ' GROUP BY e.id ORDER BY total_gouges DESC, e.name ASC';

    const examiners = query<ExaminerRow>(sql, params);

    return NextResponse.json(
      examiners.map(e => {
        // Parse and count tags
        const tagCounts: Record<string, number> = {};
        if (e.all_tags) {
          e.all_tags.split(',').forEach(tagStr => {
            if (tagStr) {
              try {
                const tags = JSON.parse(tagStr);
                tags.forEach((t: string) => {
                  tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
              } catch {}
            }
          });
        }
        const topTags = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);

        return {
          id: e.id,
          name: e.name,
          location: e.location,
          state: e.state,
          certificates: JSON.parse(e.certificates),
          avg_quality: e.avg_quality ? Math.round(e.avg_quality * 10) / 10 : null,
          avg_difficulty: e.avg_difficulty ? Math.round(e.avg_difficulty * 10) / 10 : null,
          would_recommend_pct: e.would_recommend_pct ? Math.round(e.would_recommend_pct) : null,
          total_gouges: e.total_gouges,
          top_tags: topTags,
        };
      })
    );
  } catch (error) {
    console.error('Error fetching examiners:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = examinerSchema.parse(body);

    const result = run(
      `INSERT INTO examiners (name, location, state, certificates, phone, email, website, added_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.location,
        data.state.toUpperCase(),
        JSON.stringify(data.certificates),
        data.phone || null,
        data.email || null,
        data.website || null,
        parseInt(session.user.id),
      ]
    );

    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error adding examiner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
