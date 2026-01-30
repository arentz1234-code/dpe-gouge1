import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { run, get } from '@/lib/db';
import { z } from 'zod';

const gougeUpdateSchema = z.object({
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const gougeId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Check if gouge exists and belongs to user
    const gouge = await get<{ id: number; user_id: number }>(
      'SELECT id, user_id FROM gouges WHERE id = ?',
      [gougeId]
    );

    if (!gouge) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (gouge.user_id !== userId) {
      return NextResponse.json({ error: 'You can only edit your own reviews' }, { status: 403 });
    }

    const body = await request.json();
    const data = gougeUpdateSchema.parse(body);

    await run(
      `UPDATE gouges SET
        checkride_type = ?,
        checkride_date = ?,
        outcome = ?,
        quality_rating = ?,
        difficulty_rating = ?,
        would_recommend = ?,
        tags = ?,
        comment = ?,
        oral_topics = ?,
        flight_maneuvers = ?,
        tips = ?
      WHERE id = ?`,
      [
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
        gougeId,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('Error updating gouge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const gougeId = parseInt(id);
    const userId = parseInt(session.user.id);

    const gouge = await get<{ id: number; user_id: number }>(
      'SELECT id, user_id FROM gouges WHERE id = ?',
      [gougeId]
    );

    if (!gouge) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (gouge.user_id !== userId) {
      return NextResponse.json({ error: 'You can only delete your own reviews' }, { status: 403 });
    }

    await run('DELETE FROM gouges WHERE id = ?', [gougeId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gouge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
