import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, run, get } from '@/lib/db';
import { z } from 'zod';

const gougeSchema = z.object({
  checkride_type: z.enum(['PPL', 'IR', 'CPL', 'CFI', 'CFII', 'MEI', 'ATP', 'Sport']),
  checkride_date: z.string().optional(),
  outcome: z.enum(['pass', 'fail', 'discontinue']),
  quality_rating: z.number().min(1).max(5),
  difficulty_rating: z.number().min(1).max(5),
  would_recommend: z.boolean(),
  tags: z.array(z.string()).optional(),
  comment: z.string().min(20),
  oral_topics: z.string().optional(),
  flight_maneuvers: z.string().optional(),
  tips: z.string().optional(),
});

interface GougeRow {
  id: number;
  examiner_id: number;
  user_id: number;
  username: string;
  checkride_type: string;
  checkride_date: string | null;
  outcome: string;
  quality_rating: number;
  difficulty_rating: number;
  would_recommend: number;
  tags: string | null;
  comment: string;
  oral_topics: string | null;
  flight_maneuvers: string | null;
  tips: string | null;
  thumbs_up: number;
  thumbs_down: number;
  created_at: string;
  user_vote: number | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const examinerId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'recent';

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    let orderBy = 'g.created_at DESC';
    if (sort === 'helpful') orderBy = '(g.thumbs_up - g.thumbs_down) DESC';
    if (sort === 'highest') orderBy = 'g.quality_rating DESC';
    if (sort === 'lowest') orderBy = 'g.quality_rating ASC';

    const gouges = query<GougeRow>(
      `SELECT g.*, u.username,
        ${userId ? `(SELECT vote_type FROM votes WHERE gouge_id = g.id AND user_id = ${userId}) as user_vote` : 'NULL as user_vote'}
       FROM gouges g
       JOIN users u ON g.user_id = u.id
       WHERE g.examiner_id = ?
       ORDER BY ${orderBy}`,
      [examinerId]
    );

    return NextResponse.json(
      gouges.map(g => ({
        ...g,
        would_recommend: Boolean(g.would_recommend),
        tags: g.tags ? JSON.parse(g.tags) : [],
      }))
    );
  } catch (error) {
    console.error('Error fetching gouges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const examinerId = parseInt(id);

    const examiner = get<{ id: number }>('SELECT id FROM examiners WHERE id = ?', [examinerId]);
    if (!examiner) {
      return NextResponse.json({ error: 'Examiner not found' }, { status: 404 });
    }

    const body = await request.json();
    const data = gougeSchema.parse(body);

    const result = run(
      `INSERT INTO gouges (
        examiner_id, user_id, checkride_type, checkride_date, outcome,
        quality_rating, difficulty_rating, would_recommend, tags,
        comment, oral_topics, flight_maneuvers, tips
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        examinerId,
        parseInt(session.user.id),
        data.checkride_type,
        data.checkride_date || null,
        data.outcome,
        data.quality_rating,
        data.difficulty_rating,
        data.would_recommend ? 1 : 0,
        data.tags ? JSON.stringify(data.tags) : null,
        data.comment,
        data.oral_topics || null,
        data.flight_maneuvers || null,
        data.tips || null,
      ]
    );

    return NextResponse.json({ id: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error adding gouge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
