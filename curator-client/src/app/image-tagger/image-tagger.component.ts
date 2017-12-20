import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs/Subject';
import * as Taggle from 'taggle';

import { FileInfoService } from '../services/file-info.service';

@Component({
  selector: 'app-image-tagger',
  templateUrl: './image-tagger.component.html',
  styleUrls: ['./image-tagger.component.css']
})
export class ImageTaggerComponent implements OnInit, OnDestroy {
  private taggleInstance: Taggle;
  private onDestroyed = new Subject<boolean>();
  private userChange = true;

  constructor(private http: HttpClient, private fileInfo: FileInfoService) {
  }

  ngOnDestroy(): void {
    this.onDestroyed.next(true);
  }

  ngOnInit(): void {

    this.taggleInstance = new Taggle('tags', {
      onTagAdd: (event, tag) => {
        if (this.userChange) {
          this.fileInfo.getCurrentFileInfo()
            .filter(value => value != undefined)
            .take(1)
            .subscribe(currentFileMetadata => {

              this.http.get(
                '/api/action?button=tag&filename=' +
                currentFileMetadata.filename +
                '&ajax=true&tag=' +
                tag
              ).subscribe(data => {
                console.log(data);
              }, error => console.log(error));
            });
        }
      },
      onTagRemove: (event, tag) => {
        if (this.userChange) {
          this.fileInfo.getCurrentFileInfo()
            .filter(value => value != undefined)
            .take(1)
            .subscribe(currentFileMetadata => {

              this.http.get(
                '/api/action?button=untag&filename=' +
                this.fileInfo.currentFileMetadata.filename +
                '&ajax=true&tag=' +
                tag
              ).subscribe(data => {
                console.log(data);
              }, error => console.log(error));
            });
        }
      }
    });

    this.fileInfo.getCurrentFileInfo()
      .filter(value => value != undefined)
      .takeUntil(this.onDestroyed)
      .subscribe(currentFileMetaData => {
        this.userChange = false;
        this.taggleInstance.removeAll();
        for (let i = 0; i < currentFileMetaData.tags.length; i++) {
          this.taggleInstance.add(currentFileMetaData.tags[i]);
        }
        this.userChange = true;
      });
  }
}
