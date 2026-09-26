import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { tokenInterceptor } from './core/token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // El interceptor agrega el header Authorization a las peticiones de la API
    provideHttpClient(withInterceptors([tokenInterceptor])),
  ],
};
