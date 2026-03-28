import { posthog } from './posthog';

type TrackableEvent =
  | 'snap_created'
  | 'inspection_completed'
  | 'appraisal_completed'
  | 'walk_completed'
  | 'property_monitored'
  | 'camera_opened'
  | 'photo_captured'
  | 'analysis_received'
  | 'analysis_saved'
  | 'trial_started'
  | 'upgrade_clicked'
  | 'subscription_activated'
  | 'subscription_cancelled'
  | 'feature_used';

export function trackEvent(event: TrackableEvent, properties?: Record<string, unknown>) {
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  posthog.identify(userId, traits);
}

export function resetAnalytics() {
  posthog.reset();
}
