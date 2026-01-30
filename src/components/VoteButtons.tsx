'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface VoteButtonsProps {
  gougeId: number;
  initialScore: number;
  initialUserVote: number | null;
}

export default function VoteButtons({
  gougeId,
  initialScore,
  initialUserVote,
}: VoteButtonsProps) {
  const { data: session } = useSession();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = async (vote: number) => {
    if (!session) {
      alert('Please login to vote');
      return;
    }

    setLoading(true);
    try {
      const newVote = userVote === vote ? 0 : vote;
      const res = await fetch(`/api/gouges/${gougeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: newVote }),
      });

      if (res.ok) {
        const data = await res.json();
        setScore(data.score);
        setUserVote(newVote === 0 ? null : newVote);
      }
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`text-2xl transition-colors ${
          userVote === 1 ? 'text-green-500' : 'text-gray-400 hover:text-green-400'
        }`}
      >
        ▲
      </button>
      <span className={`font-bold ${score > 0 ? 'text-green-500' : score < 0 ? 'text-red-500' : 'text-gray-500'}`}>
        {score}
      </span>
      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`text-2xl transition-colors ${
          userVote === -1 ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
        }`}
      >
        ▼
      </button>
    </div>
  );
}
