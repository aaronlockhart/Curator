import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { FileMetadata, isFileMetadata } from '../classes/file-metadata';

@Injectable()
export class FileInfoService {
  private currentFileMetadataSubject: BehaviorSubject<FileMetadata>;

  public get observableCurrentFileMetadata(): Observable<FileMetadata> {
    return this.currentFileMetadataSubject;
  }

  public get currentFileMetadata(): FileMetadata {
    return this.currentFileMetadataSubject.getValue();
  }

  constructor(private http: HttpClient) {
    this.currentFileMetadataSubject = new BehaviorSubject<FileMetadata>(undefined);
    this.getCurrentFileInfo();
  }

  /**
   * Retrieves the current file information from the server
   */
  public getCurrentFileInfo(): void {
    this.http.get('/api/currentFileInfo').subscribe(response => {
      console.log(response);
      if (isFileMetadata(response)) {
        this.currentFileMetadataSubject.next(response);
      }
    }, error => console.log(error));
  }

  /**
   * Updates the current image with the info from the server
   */
  public setCurrentFileInfo(currentInfo: FileMetadata): void {
    this.currentFileMetadataSubject.next(currentInfo);
  }
}
