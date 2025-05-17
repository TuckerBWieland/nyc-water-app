# Analytics Service

This module provides a standardized API for tracking analytics events across the application. 

## Usage

### Basic Event Tracking

```typescript
import { analytics, AnalyticsEvent } from '@/services/analytics';

// Track an event with type-safe payload
analytics.track(AnalyticsEvent.VIEWED_SAMPLE_PIN, {
  sampleId: '123',
  location: 'Manhattan Beach'
});
```

### Page View Tracking

```typescript
import { analytics } from '@/services/analytics';

// Track a page view with path and optional referrer
analytics.trackPageView('/sample/123', '/map');
```

### User Identification

```typescript
import { analytics } from '@/services/analytics';

// Identify a user with properties
analytics.identify('user-123', {
  name: 'Jane Doe',
  email: 'jane@example.com'
});
```

### User Logout/Reset

```typescript
import { analytics } from '@/services/analytics';

// Reset user on logout
analytics.reset();
```

## Backward Compatibility

For backward compatibility with the previous implementation, the following exports are also available:

```typescript
import { track, EVENTS, identify, reset } from '@/services/analytics';

// Legacy usage
track(EVENTS.VIEWED_PAGE, { page: '/map' });
identify('user-123');
reset();
```

## Configuration

Analytics can be configured through environment variables:

```
VITE_POSTHOG_API_KEY=your_api_key_here
VITE_POSTHOG_HOST=https://app.posthog.com
```

In development mode, analytics calls are logged to the console instead of being sent to the provider.

## Event Types

All supported event types are defined in the `AnalyticsEvent` enum in `src/types/analytics.ts`. Each event has a corresponding payload type in `EventPayloadMap`.

## Adding New Events

1. Add the new event name to the `AnalyticsEvent` enum
2. Create a corresponding payload interface
3. Add it to the `EventPayloadMap` type
4. Use the new event in your code with type-safe payloads