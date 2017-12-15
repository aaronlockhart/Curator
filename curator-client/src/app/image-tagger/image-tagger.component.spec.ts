import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageTaggerComponent } from './image-tagger.component';

describe('ImageTaggerComponent', () => {
  let component: ImageTaggerComponent;
  let fixture: ComponentFixture<ImageTaggerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageTaggerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageTaggerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
