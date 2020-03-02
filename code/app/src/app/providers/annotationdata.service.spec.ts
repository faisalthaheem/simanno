/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { AnnotationdataService } from './annotationdata.service';

describe('Service: Annotationdata', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AnnotationdataService]
    });
  });

  it('should ...', inject([AnnotationdataService], (service: AnnotationdataService) => {
    expect(service).toBeTruthy();
  }));
});
