import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import * as Cesium from 'cesium';

if (environment.production) {
  enableProdMode();
}

window['CESIUM_BASE_URL'] = '/assets/cesium/';
window['Cesium'] = Cesium;

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
