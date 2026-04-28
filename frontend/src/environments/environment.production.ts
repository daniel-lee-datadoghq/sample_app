export const environment = {
  production: true,
  datadog: {
    applicationId: '7c2a1106-78db-4481-a28f-b66f752cdfc3',
    clientToken: 'pub17dcc826a24006a9628a2c6c082e3709',
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
