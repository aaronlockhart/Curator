import { HammerGestureConfig } from '@angular/platform-browser';

const DIRECTION_ALL = 31;

export class AppHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    'swipe': {
      direction: DIRECTION_ALL
    }
  };
}
