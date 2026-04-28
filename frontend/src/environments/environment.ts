export const environment = {
  production: false,
  datadog: {
    applicationId: '7c2a1106-78db-4481-a28f-b66f752cdfc3',
    clientToken: 'pub17dcc826a24006a9628a2c6c082e3709',
    site: 'datadoghq.com',
    service: 'sample-app',
    env: 'development',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    // RUM <-> APM trace connection
    // In dev, /api requests are proxied to localhost:8080 by Angular CLI,
    // so we match on the origin (same-origin relative URLs match window.location.origin).
    allowedTracingUrls: [
      { match: 'http://localhost:4200/api', propagatorTypes: ['tracecontext', 'datadog'] as ('tracecontext' | 'datadog')[] },
    ],
    traceSampleRate: 100,
    trackSessionAcrossSubdomains: true,
  },
};
