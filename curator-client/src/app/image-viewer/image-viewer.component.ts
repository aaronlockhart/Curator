import { HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs/Subject';

import { FileMetadata, isFileMetadata } from '../classes/file-metadata';
import { FileInfoService } from '../services/file-info.service';


@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.css']
})
export class ImageViewerComponent implements OnInit, OnDestroy {
  SWIPE_ACTION = { LEFT: 'swipeleft', RIGHT: 'swiperight', UP: 'swipeup', DOWN: 'swipedown' };

  private clearingTags = false;
  private unsubscribe = new Subject<boolean>();

  public imageUrl: string;
  public class: string;

  // private taggle = new Taggle('tags', {
  //   onTagAdd: function (event, tag) {
  //     $.getJSON('/action?button=tag&filename=' + currentFileInfo.filename + '&ajax=true&tag=' + tag, function (data) {
  //       console.log(data);
  //     });
  //   },
  //   onTagRemove: function (event, tag) {
  //     if (!clearingTags) {
  //       $.getJSON('/action?button=untag&filename=' + currentFileInfo.filename + 'ajax=true&tag=' + tag, function (data) {
  //         console.log(data);
  //       });
  //     }
  //   }
  // });


  constructor(private http: HttpClient, private fileInfo: FileInfoService) {
  }

  public ngOnInit(): void {
    this.fileInfo.getCurrentFileInfo().takeUntil(this.unsubscribe).subscribe(next => this.onUpdateCurrentFileInfo(next));
  }

  public ngOnDestroy(): void {
    this.unsubscribe.next(true);
  }

  /**
   * Updates the current image with the info from the server
   */
  public onUpdateCurrentFileInfo(currentInfo: FileMetadata): void {
    if (currentInfo) {
      if (currentInfo.keep) {
        this.class = 'highlighted';
      } else {
        this.class = '';
      }

      for (let i = 0; i < currentInfo.tags.length; i++) {
        // taggle.add(currentFileInfo.tags[i]);
      }

      this.imageUrl = '/api/file?filename=' + currentInfo.filename;
    }
  }

  /**
   * Handler for a left swipe
   */
  public swipeLeft(event): void {
    this.clearTags();
    console.log(event);
    this.http.get('/api/action?button=next&ajax=true').subscribe(data => {
      console.log(data);
      if (isFileMetadata(data)) {
        this.fileInfo.setCurrentFileInfo(data);
      }
    });
  }

  /**
   * Handler for a right swipe
   */
  public swipeRight(event): void {
    this.clearTags();
    console.log(event);
    this.http.get('/api/action?button=prev&ajax=true').subscribe(data => {
      console.log(data);
      if (isFileMetadata(data)) {
        this.fileInfo.setCurrentFileInfo(data);
      }
    });
  }

  /**
   * Handler for an up swipe
   */
  public swipeUp(event): void {
    this.clearTags();
    console.log(event);
    if (this.fileInfo.currentFileMetadata && this.fileInfo.currentFileMetadata.filename) {
      this.http.get('/api/action?button=keep&ajax=true&filename=' + this.fileInfo.currentFileMetadata.filename).subscribe(data => {
        console.log(data);
        if (isFileMetadata(data)) {
          this.fileInfo.setCurrentFileInfo(data);
        }
      });
    }
  }

  /**
   * Handler for a down swipe
   */
  public swipeDown(event): void {
    this.clearTags();
    if (this.fileInfo.currentFileMetadata && this.fileInfo.currentFileMetadata.filename) {
      this.http.get('/api/action?button=unkeep&ajax=true&filename=' + this.fileInfo.currentFileMetadata.filename).subscribe(data => {
        console.log(data);
        if (isFileMetadata(data)) {
          this.fileInfo.setCurrentFileInfo(data);
        }
      });
    }
  }

  /**
   * Clears the tags with a flag set to true so we don't send a message to the server to remove the tags from metadata
   */
  public clearTags(): void {
    // clearingTags = true;
    // taggle.removeAll();
    // clearingTags = false;
  }
}
