import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

export class FileMetadata {
  public filename: string;
  public path: string;
  public keep: boolean;
  public tags: string[];

  public constructor(init?) {
    init = init || {};
    this.filename = init.filename || '';
    this.path = init.path || '';
    this.keep = init.keep == undefined ? false : init.keep;
    this.tags = init.tags || [];
  }
}

@Component({
  selector: 'app-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.css']
})
export class ImageViewerComponent implements OnInit {
  SWIPE_ACTION = { LEFT: 'swipeleft', RIGHT: 'swiperight', UP: 'swipeup', DOWN: 'swipedown' };

  private clearingTags = false;
  private currentFileInfo = new FileMetadata();

  public imageUrl: string;

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


  constructor(private http: HttpClient) { }

  public ngOnInit() {
    this.getCurrentFileInfo();
  }

  /**
   * Retrieves the current file information from the server
   */
  public getCurrentFileInfo(): void {
    this.http.get('/api/currentFileInfo').subscribe(response => {
      console.log(response);
      this.setCurrentFileInfo(new FileMetadata(response));
    }, error => console.log(error));
  }

  /**
   * Updates the current image with the info from the server
   */
  public setCurrentFileInfo(currentInfo: FileMetadata, fetch?: boolean): void {
    fetch = fetch == undefined ? true : fetch;
    this.currentFileInfo = currentInfo;

    if (this.currentFileInfo.keep) {
      // $("#image").attr("class", "highlighted");
    } else {
      // $("#image").attr("class", "");
    }

    for (let i = 0; i < this.currentFileInfo.tags.length; i++) {
      // taggle.add(currentFileInfo.tags[i]);
    }

    if (fetch) {
      this.imageUrl = '/api/file?filename=' + this.currentFileInfo.filename;
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
      this.setCurrentFileInfo(new FileMetadata(data));
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
      this.setCurrentFileInfo(new FileMetadata(data));
    });
  }

  /**
   * Handler for an up swipe
   */
  public swipeUp(event): void {
    this.clearTags();
    console.log(event);
    if (this.currentFileInfo.filename) {
      this.http.get('/api/action?button=keep&ajax=true&filename=' + this.currentFileInfo.filename).subscribe(data => {
        console.log(data);
        this.setCurrentFileInfo(new FileMetadata(data), false);
      });
    }
  }

  /**
   * Handler for a down swipe
   */
  public swipeDown(event): void {
    this.clearTags();
    if (this.currentFileInfo.filename) {
      this.http.get('/api/action?button=unkeep&ajax=true&filename=' + this.currentFileInfo.filename).subscribe(data => {
        console.log(data);
        this.setCurrentFileInfo(new FileMetadata(data), false);
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
