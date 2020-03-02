import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoiElementComponent } from './roi-element.component';

describe('RoiElementComponent', () => {
  let component: RoiElementComponent;
  let fixture: ComponentFixture<RoiElementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoiElementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoiElementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
