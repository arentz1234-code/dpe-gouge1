import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { run, get } from '@/lib/db';

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
    const gougeId = parseInt(id);
    const userId = parseInt(session.user.id);
    const { vote } = await request.json(); // 1 for thumbs up, -1 for thumbs down, 0 to remove

    const gouge = await get<{ id: number; user_id: number }>(
      'SELECT id, user_id FROM gouges WHERE id = ?',
      [gougeId]
    );
    if (!gouge) {
      return NextResponse.json({ error: 'Gouge not found' }, { status: 404 });
    }

    if (gouge.user_id === userId) {
      return NextResponse.json({ error: 'Cannot vote on your own review' }, { status: 400 });
    }

    const existingVote = await get<{ vote_type: number }>(
      'SELECT vote_type FROM votes WHERE gouge_id = ? AND user_id = ?',
      [gougeId, userId]
    );

    if (vote === 0) {
      if (existingVote) {
        await run('DELETE FROM votes WHERE gouge_id = ? AND user_id = ?', [gougeId, userId]);
        if (existingVote.vote_type === 1) {
          await run('UPDATE gouges SET thumbs_up = thumbs_up - 1 WHERE id = ?', [gougeId]);
        } else {
          await run('UPDATE gouges SET thumbs_down = thumbs_down - 1 WHERE id = ?', [gougeId]);
        }
      }
    } else if (vote === 1 || vote === -1) {
      if (existingVote) {
        if (existingVote.vote_type !== vote) {
          await run('UPDATE votes SET vote_type = ? WHERE gouge_id = ? AND user_id = ?', [vote, gougeId, userId]);
          if (vote === 1) {
            await run('UPDATE gouges SET thumbs_up = thumbs_up + 1, thumbs_down = thumbs_down - 1 WHERE id = ?', [gougeId]);
          } else {
            await run('UPDATE gouges SET thumbs_up = thumbs_up - 1, thumbs_down = thumbs_down + 1 WHERE id = ?', [gougeId]);
          }
        }
      } else {
        await run('INSERT INTO votes (gouge_id, user_id, vote_type) VALUES (?, ?, ?)', [gougeId, userId, vote]);
        if (vote === 1) {
          await run('UPDATE gouges SET thumbs_up = thumbs_up + 1 WHERE id = ?', [gougeId]);
        } else {
          await run('UPDATE gouges SET thumbs_down = thumbs_down + 1 WHERE id = ?', [gougeId]);
        }
      }
    }

    const updated = await get<{ thumbs_up: number; thumbs_down: number }>(
      'SELECT thumbs_up, thumbs_down FROM gouges WHERE id = ?',
      [gougeId]
    );

    return NextResponse.json({
      thumbs_up: updated?.thumbs_up || 0,
      thumbs_down: updated?.thumbs_down || 0,
    });
  } catch (error) {
    console.error('Error voting:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
