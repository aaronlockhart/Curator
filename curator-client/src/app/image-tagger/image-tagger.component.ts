import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as Taggle from 'taggle';

import { FileInfoService } from '../services/file-info.service';

@Component({
  selector: 'app-image-tagger',
  templateUrl: './image-tagger.component.html',
  styleUrls: ['./image-tagger.component.css']
})
export class ImageTaggerComponent implements OnInit {
  private taggleInstance: Taggle;

  constructor(private http: HttpClient, private fileInfo: FileInfoService) {
  }

  ngOnInit() {
    this.taggleInstance = new Taggle('tags', {
      onTagAdd: (event, tag) => {
        this.fileInfo.getCurrentFileInfo()
          .filter(value => value == undefined)
          .take(1)
          .subscribe(currentFileMetadata => {

            this.http.get(
              '/api/action?button=tag&filename=' +
              currentFileMetadata.filename +
              '&ajax=true&tag=' +
              tag
            ).subscribe(data => {
              console.log(data);
            });
          });
      },
      onTagRemove: (event, tag) => {
        this.fileInfo.getCurrentFileInfo()
          .filter(value => value == undefined)
          .take(1)
          .subscribe(currentFileMetadata => {

            this.http.get(
              '/api/action?button=untag&filename=' +
              this.fileInfo.currentFileMetadata.filename +
              'ajax=true&tag=' +
              tag
            ).subscribe(data => {
              console.log(data);
            });
          });
      }
    });
  }
}
