import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { FileMetadata, isFileMetadata } from '../classes/file-metadata';

@Injectable()
export class FileInfoService {
  private currentFileMetadataSubject: BehaviorSubject<FileMetadata>;

  public get currentFileMetadata(): FileMetadata {
    return this.currentFileMetadataSubject.getValue();
  }

  constructor(private http: HttpClient) {
    this.currentFileMetadataSubject = new BehaviorSubject<FileMetadata>(undefined);
  }

  /**
   * Retrieves the current file information from the server
   */
  public getCurrentFileInfo(): Observable<FileMetadata> {
    if (this.currentFileMetadataSubject.getValue() == undefined) {

      this.http.get('/api/currentFileInfo').subscribe(response => {
        if (isFileMetadata(response)) {
          this.currentFileMetadataSubject.next(response);
        } else {
          throw new Error('Unrecognized response' + JSON.stringify(response));
        }
      }, error => console.log(error));

    }

    return this.currentFileMetadataSubject.asObservable();
  }

  /**
   * Updates the current image with the info from the server
   */
  public setCurrentFileInfo(currentInfo: FileMetadata): void {
    this.currentFileMetadataSubject.next(currentInfo);
  }
}
