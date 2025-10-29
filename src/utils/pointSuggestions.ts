// Smart dynamic point earning suggestions with badge proximity and leaderboard integration
import { BadgeLevel } from "@/hooks/useBadgeLevels";

export interface PointToastMessage {
  title: string;
  description: string;
}

// Major badges that warrant showing progress even when further away
const MAJOR_BADGES = ["Connector", "Ambassador"];

/**
 * Generates a smart dynamic toast message based on:
 * - Badge proximity (10 points = always show, 20 points = major badges only)
 * - Leaderboard rank changes (only upward movement, significant changes)
 * - Current user context
 */
export function generateSmartPointToast(
  pointsEarned: number,
  oldPoints: number,
  newPoints: number,
  currentBadge: BadgeLevel | null,
  nextBadge: BadgeLevel | null,
  oldRank: number | null,
  newRank: number | null,
  totalUsers: number
): PointToastMessage {
  const pointsToNextBadge = nextBadge ? nextBadge.min_points - newPoints : 0;
  
  // Check if rank improved (lower number = better rank)
  const rankImproved = oldRank !== null && newRank !== null && newRank < oldRank;
  const rankChange = oldRank && newRank ? oldRank - newRank : 0;
  const isSignificantRankChange = rankChange >= 3 || (newRank !== null && newRank <= 10);
  const enteredTop10 = oldRank && oldRank > 10 && newRank !== null && newRank <= 10;

  // Determine what to show
  const showBadgeProgress = nextBadge && (
    pointsToNextBadge <= 10 || 
    (pointsToNextBadge <= 20 && MAJOR_BADGES.includes(nextBadge.name))
  );
  
  const showRankChange = rankImproved && isSignificantRankChange;

  // CASE 1: Show both badge progress AND rank change (user on fire!)
  if (showBadgeProgress && showRankChange) {
    if (enteredTop10) {
      return {
        title: `🔥 +${pointsEarned} Points - Top 10!`,
        description: `You're now #${newRank} of ${totalUsers}! Just ${pointsToNextBadge} more points to unlock ${nextBadge!.name} badge!`
      };
    }
    return {
      title: `🔥 +${pointsEarned} Points - Rank #${newRank}!`,
      description: `Climbed ${rankChange} ${rankChange === 1 ? 'spot' : 'spots'}! Only ${pointsToNextBadge} more points to ${nextBadge!.name} badge!`
    };
  }

  // CASE 2: Show badge progress only
  if (showBadgeProgress) {
    if (pointsToNextBadge === 1) {
      return {
        title: `🎯 +${pointsEarned} Points`,
        description: `Just 1 more point to unlock ${nextBadge!.name} badge!`
      };
    }
    return {
      title: `🎯 +${pointsEarned} Points`,
      description: `${pointsToNextBadge} more points to unlock ${nextBadge!.name} badge!`
    };
  }

  // CASE 3: Show rank change only
  if (showRankChange) {
    if (enteredTop10) {
      return {
        title: `🏆 +${pointsEarned} Points - Top 10!`,
        description: `Welcome to the top! You're now ranked #${newRank} of ${totalUsers} neighbors!`
      };
    }
    return {
      title: `📈 +${pointsEarned} Points - Rank #${newRank}!`,
      description: `You climbed ${rankChange} ${rankChange === 1 ? 'spot' : 'spots'} on the leaderboard!`
    };
  }

  // CASE 4: Simple acknowledgment (beyond 20 points from badge, no significant rank change)
  const emoji = pointsEarned >= 10 ? "🎉" : "✨";
  return {
    title: `${emoji} +${pointsEarned} Points!`,
    description: newRank && newRank <= 20 
      ? `You're ranked #${newRank} of ${totalUsers} neighbors!`
      : `Keep building your community reputation!`
  };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use generateSmartPointToast instead
 */
export interface PointSuggestion {
  message: string;
  includeInviteGuidance: boolean;
}

export function generatePointSuggestion(currentPoints: number): PointSuggestion {
  return {
    message: `You earned points!`,
    includeInviteGuidance: false
  };
}

export function getInviteGuidance(isMobile: boolean = false): string {
  return "";
}
