/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RoiwallComponent } from './roiwall.component';

describe('RoiwallComponent', () => {
  let component: RoiwallComponent;
  let fixture: ComponentFixture<RoiwallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RoiwallComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoiwallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
