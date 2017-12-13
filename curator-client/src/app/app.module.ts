import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { AppHammerConfig } from './config/app-hammer-config';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';


@NgModule({
  declarations: [
    AppComponent,
    ImageViewerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [
    { provide: HAMMER_GESTURE_CONFIG, useClass: AppHammerConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
