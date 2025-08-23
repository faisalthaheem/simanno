import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { AnnotationsComponent } from './annotations/annotations.component';
import { RoiwallComponent } from './roiwall/roiwall.component';

export const appRoutes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'dashboard', component: LandingComponent },
  { path: 'annotations', component: AnnotationsComponent },
  { path: 'roiwall', component: RoiwallComponent },
];