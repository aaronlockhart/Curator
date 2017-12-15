import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { FileInfoService } from './file-info.service';
import { FileMetadata } from '../classes/file-metadata';

@Injectable()
export class TaggerService {

  constructor(private fileInfo: FileInfoService) { }

  public tag(tagText: string) {
    this.getCurrentFileInfo()
      .subscribe(value => {
        value.tags.push();
      });
  }

  public clear() {
    this.getCurrentFileInfo()
      .subscribe(value => {
        value.tags = [];
      });
  }

  private getCurrentFileInfo(): Observable<FileMetadata> {
    return this.fileInfo.getCurrentFileInfo()
      .filter(value => value != undefined)
      .take(1);
  }
}
