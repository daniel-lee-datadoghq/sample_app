import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { datadogRum } from '@datadog/browser-rum';
import { FeatureFlagsResponse } from '../models/feature-flag.model';
import { AuthService } from './auth.service';

/**
 * Holds the flag set the server resolved for the signed-in user. Flags are fetched after
 * authentication rather than read from the JWT, so entitlements stay a server-side decision.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly flagMap = signal<Record<string, boolean>>({});

  readonly flags = this.flagMap.asReadonly();
  readonly roles = signal<string[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);

  readonly roleLabel = computed(() => this.roles().join(', '));

  /** Which user the current flag set belongs to, so switching accounts refetches. */
  private loadedForUserId: number | null = null;
  /** User id of the request in flight, so a second run does not start a duplicate. */
  private requestedForUserId: number | null = null;
  /** Bumped on logout so a response for the previous user cannot land afterwards. */
  private generation = 0;

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (!user) {
        this.reset();
        return;
      }
      if (this.loadedForUserId === user.id || this.requestedForUserId === user.id) return;
      this.load(user.id);
    });
  }

  /** Default-closed: an unknown or not-yet-loaded flag is off. */
  isEnabled(key: string): boolean {
    return this.flagMap()[key] ?? false;
  }

  private load(userId: number): void {
    const generation = this.generation;
    this.requestedForUserId = userId;
    this.loading.set(true);
    this.http.get<FeatureFlagsResponse>('/api/feature-flags').subscribe({
      next: (response) => {
        if (!this.isCurrent(generation, userId)) return;
        this.flagMap.set(response.flags);
        this.roles.set(response.roles);
        this.loadedForUserId = userId;
        this.requestedForUserId = null;
        this.loading.set(false);
        this.loaded.set(true);
        this.auth.setRoles(response.roles);
      },
      error: () => {
        if (!this.isCurrent(generation, userId)) return;
        // Stay default-closed, and do not retry: `loading` flipping back to false used to
        // reschedule this effect and hammer the endpoint.
        this.loadedForUserId = userId;
        this.requestedForUserId = null;
        this.loading.set(false);
        this.loaded.set(true);
      },
    });
  }

  private isCurrent(generation: number, userId: number): boolean {
    return generation === this.generation && this.auth.user()?.id === userId;
  }

  /**
   * Reports flags to RUM at the point they gate something the user sees. This mirrors the
   * `flag-used` style hooks Datadog's vendor integrations use: an evaluation is recorded when
   * the application consults a flag, not when the flag set was fetched. RUM scopes evaluations
   * to the current view, which is exactly the view the gated UI is rendering into.
   *
   * Keys absent from the set (not loaded yet, or unknown) are skipped rather than reported as
   * `false`, so a pending fetch is never mistaken for a disabled feature.
   */
  reportEvaluations(keys: readonly string[]): void {
    const flags = this.flagMap();
    for (const key of keys) {
      if (!(key in flags)) continue;
      datadogRum.addFeatureFlagEvaluation(toRumFlagKey(key), flags[key]);
    }
  }

  private reset(): void {
    this.generation++;
    this.loadedForUserId = null;
    this.requestedForUserId = null;
    this.flagMap.set({});
    this.roles.set([]);
    this.loaded.set(false);
    this.loading.set(false);
  }
}

/**
 * Datadog reads `.` in an attribute name as a nested path, so `research.news` would arrive as
 * `@feature_flags.research.news`. Flatten to a single facet name before sending.
 */
export function toRumFlagKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
}
