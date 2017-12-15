import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import './rxjs-operators';

import { AppComponent } from './app.component';
import { AppHammerConfig } from './config/app-hammer-config';
import { FileInfoService } from './services/file-info.service';
import { ImageViewerComponent } from './image-viewer/image-viewer.component';
import { ImageTaggerComponent } from './image-tagger/image-tagger.component';

@NgModule({
  declarations: [
    AppComponent,
    ImageViewerComponent,
    ImageTaggerComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule
  ],
  providers: [
    FileInfoService,
    { provide: HAMMER_GESTURE_CONFIG, useClass: AppHammerConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
