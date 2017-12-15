import { Component, OnInit } from '@angular/core';
import * as taggle from 'taggle';

@Component({
  selector: 'app-image-tagger',
  templateUrl: './image-tagger.component.html',
  styleUrls: ['./image-tagger.component.css']
})
export class ImageTaggerComponent implements OnInit {
  private taggleInstance: taggle.Taggle;

  constructor() {
    this.taggleInstance = new taggle.Taggle('tags', {
      onTagAdd: (event, tag) => {
        // $.getJSON('/action?button=tag&filename=' + currentFileInfo.filename + '&ajax=true&tag=' + tag, function (data) {
        //     console.log(data);
        // });
      },
      onTagRemove: (event, tag) => {
        // if (!clearingTags) {
        //     $.getJSON('/action?button=untag&filename=' + currentFileInfo.filename + 'ajax=true&tag=' + tag, function (data) {
        //         console.log(data);
        //     });
        // }
      }
    });
  }

  ngOnInit() {
  }

}
