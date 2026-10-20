import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideDatadogRouter, provideDatadogErrorHandler } from '@datadog/browser-rum-angular';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { FeatureFlagService } from './services/feature-flag.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideDatadogRouter(),
    provideDatadogErrorHandler(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Instantiated at bootstrap so flags load as soon as there is a signed-in user.
    provideAppInitializer(() => {
      inject(FeatureFlagService);
    }),
  ]
};
