export const environment = {
  production: false,
  datadog: {
    applicationId: '<YOUR_APPLICATION_ID>',
    clientToken: '<YOUR_CLIENT_TOKEN>',
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
