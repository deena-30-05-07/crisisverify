export type CrisisType =
  | 'Flood'
  | 'Earthquake'
  | 'Wildfire'
  | 'Pandemic'
  | 'Hurricane'
  | 'Industrial Disaster'
  | 'Mass Casualty'
  | 'Severe Storm'
  | 'General Emergency';

export type CredibilityBadge = 'Verified' | 'False' | 'Unverified';

export type ClaimStatus = 'Active' | 'Removed' | 'Archived';

export interface AIAnalysis {
  credibilityScore: number; // 0 - 100
  redFlags: string[];
  supportingEvidence?: string[];
  reasoning: string;
  badge: CredibilityBadge;
  analyzedAt: string;
  modelUsed: string;
}

export interface Claim {
  claimId: string;
  title: string;
  description: string;
  imageUrl?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  crisisType: CrisisType;
  userId: string;
  username: string;
  userAvatar?: string;
  timestamp: string; // ISO string
  aiCredibilityScore: number; // 0-100
  aiAnalysis: AIAnalysis;
  credibilityBadge: CredibilityBadge;
  helpfulVotes: number;
  misleadingVotes: number;
  totalVotes: number;
  status: ClaimStatus;
  spreadRate?: string; // e.g. "420 shares/hr"
  isTrendingFalse?: boolean;
}

export interface Vote {
  voteId: string;
  claimId: string;
  userId: string;
  voteType: 'helpful' | 'misleading';
  timestamp: string;
}

export interface User {
  userId: string;
  email?: string;
  username: string;
  avatarUrl?: string;
  isAnonymous: boolean;
  createdAt: string;
  submissionCount: number;
  reputation: number; // e.g. 50 + helpful votes verified
  badgeTitle?: string;
}

export interface ClaimsFilter {
  crisisType?: string;
  credibilityBadge?: string;
  timeRange?: 'all' | '24h' | '3d' | '7d';
  sortBy?: 'newest' | 'votes' | 'misleading' | 'verified';
  searchQuery?: string;
}

export interface TrendingClaim extends Claim {
  spreadVelocity: number; // calculated virality rate
}
