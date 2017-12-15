import { TestBed, inject } from '@angular/core/testing';

import { FileInfoService } from './file-info.service';

describe('FileInfoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FileInfoService]
    });
  });

  it('should be created', inject([FileInfoService], (service: FileInfoService) => {
    expect(service).toBeTruthy();
  }));
});
