/** Shape of `GET /api/feature-flags`. Flags are resolved server-side from the user's roles. */
export interface FeatureFlagsResponse {
  flags: Record<string, boolean>;
  roles: string[];
}

export const FLAG_RESEARCH_ANALYST_RATINGS = 'research.analyst_ratings';
export const FLAG_RESEARCH_NEWS = 'research.news';
