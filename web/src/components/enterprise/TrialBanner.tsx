import React from 'react';
import { Button } from '../ui/button';

interface TrialBannerProps {
  daysRemaining: number | null;
  memberCount: number;
  limit?: number | null;
  limitReached: boolean;
  onSubscribe: () => void;
  isLoading?: boolean;
}

export function TrialBanner({
  daysRemaining,
  memberCount,
  limit,
  limitReached,
  onSubscribe,
  isLoading = false,
}: TrialBannerProps) {
  const artistCountText =
    limit && limit > 0 ? `${memberCount}/${limit} Artists` : `${memberCount} Artists`;

  return (
    <div className="rounded-xl shadow-lg p-4 border bg-sky-500 text-white border-transparent">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Free Trial Active</p>
          <p className="text-sm opacity-90">
            {artistCountText}
            {limitReached && <span className="ml-2 font-medium">(Limit Reached)</span>}
          </p>
        </div>
        {limitReached && (
          <Button
            onClick={onSubscribe}
            disabled={isLoading}
            className="px-4 py-2 rounded-full font-semibold bg-white text-sky-600 border-none hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Subscribe Now'}
          </Button>
        )}
      </div>
    </div>
  );
}

