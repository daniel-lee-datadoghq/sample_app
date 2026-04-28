import { bootstrapApplication } from '@angular/platform-browser';
import { datadogRum } from '@datadog/browser-rum';
import { angularPlugin } from '@datadog/browser-rum-angular';
import { environment } from './environments/environment';
import { appConfig } from './app/app.config';
import { App } from './app/app';

datadogRum.init({
  applicationId: environment.datadog.applicationId,
  clientToken: environment.datadog.clientToken,
  site: environment.datadog.site,
  service: environment.datadog.service,
  env: environment.datadog.env,
  version: '1.0.0',
  sessionSampleRate: environment.datadog.sessionSampleRate,
  sessionReplaySampleRate: environment.datadog.sessionReplaySampleRate,
  trackUserInteractions: environment.datadog.trackUserInteractions,
  trackResources: environment.datadog.trackResources,
  trackLongTasks: environment.datadog.trackLongTasks,
  // Connect RUM sessions to backend APM traces
  allowedTracingUrls: environment.datadog.allowedTracingUrls,
  traceSampleRate: environment.datadog.traceSampleRate,
  // Share the RUM session cookie between parent page and iframe (and across subdomains)
  trackSessionAcrossSubdomains: environment.datadog.trackSessionAcrossSubdomains,
  defaultPrivacyLevel: 'mask-user-input',
  plugins: [angularPlugin({ router: true })],
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
