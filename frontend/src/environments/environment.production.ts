export const environment = {
  production: true,
  datadog: {
    applicationId: '<YOUR_APPLICATION_ID>',
    clientToken: '<YOUR_CLIENT_TOKEN>',
    site: 'datadoghq.com',
    service: 'sample-app',
    env: 'production',
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    allowedTracingUrls: [
      { match: 'https://your-production-domain.com/api', propagatorTypes: ['tracecontext', 'datadog'] as ('tracecontext' | 'datadog')[] },
    ],
    traceSampleRate: 20,
    trackSessionAcrossSubdomains: true,
  },
};
