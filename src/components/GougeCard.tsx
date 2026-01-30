'use client';

import StarRating from './StarRating';
import VoteButtons from './VoteButtons';

interface Gouge {
  id: number;
  username: string;
  checkride_type: string;
  checkride_date: string;
  outcome: string;
  oral_rating: number;
  flight_rating: number;
  fairness_rating: number;
  preparation_rating: number;
  oral_topics: string | null;
  flight_maneuvers: string | null;
  tips: string | null;
  overall_experience: string;
  would_recommend: boolean;
  aircraft_used: string | null;
  duration_oral: number | null;
  duration_flight: number | null;
  score: number;
  user_vote: number | null;
  created_at: string;
}

export default function GougeCard({ gouge }: { gouge: Gouge }) {
  const outcomeColors = {
    pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    discontinue: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  };

  const avgRating = (gouge.oral_rating + gouge.flight_rating + gouge.fairness_rating + gouge.preparation_rating) / 4;

  return (
    <div className="card p-4 flex gap-4">
      <VoteButtons
        gougeId={gouge.id}
        initialScore={gouge.score}
        initialUserVote={gouge.user_vote}
      />

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`px-2 py-0.5 rounded text-sm font-medium ${outcomeColors[gouge.outcome as keyof typeof outcomeColors]}`}>
            {gouge.outcome.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {gouge.checkride_type}
          </span>
          {gouge.aircraft_used && (
            <span className="text-sm text-gray-500">{gouge.aircraft_used}</span>
          )}
          <span className="text-sm text-gray-500">
            {new Date(gouge.checkride_date).toLocaleDateString()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
          <div>
            <span className="text-gray-500">Oral:</span>
            <StarRating rating={gouge.oral_rating} readonly size="sm" />
          </div>
          <div>
            <span className="text-gray-500">Flight:</span>
            <StarRating rating={gouge.flight_rating} readonly size="sm" />
          </div>
          <div>
            <span className="text-gray-500">Fairness:</span>
            <StarRating rating={gouge.fairness_rating} readonly size="sm" />
          </div>
          <div>
            <span className="text-gray-500">Prep:</span>
            <StarRating rating={gouge.preparation_rating} readonly size="sm" />
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
          {gouge.overall_experience}
        </p>

        {gouge.oral_topics && (
          <div className="mb-2">
            <strong className="text-sm">Oral Topics:</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400">{gouge.oral_topics}</p>
          </div>
        )}

        {gouge.flight_maneuvers && (
          <div className="mb-2">
            <strong className="text-sm">Flight Maneuvers:</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400">{gouge.flight_maneuvers}</p>
          </div>
        )}

        {gouge.tips && (
          <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <strong className="text-sm">Tips:</strong>
            <p className="text-sm text-gray-600 dark:text-gray-400">{gouge.tips}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500">
          <div className="flex items-center gap-4">
            <span>Posted by u/{gouge.username}</span>
            {gouge.duration_oral && <span>Oral: {gouge.duration_oral}min</span>}
            {gouge.duration_flight && <span>Flight: {gouge.duration_flight}min</span>}
          </div>
          <div className="flex items-center gap-2">
            <span>{gouge.would_recommend ? '👍 Would recommend' : '👎 Would not recommend'}</span>
            <span className="font-medium">Avg: {avgRating.toFixed(1)}/5</span>
          </div>
        </div>
      </div>
    </div>
  );
}
