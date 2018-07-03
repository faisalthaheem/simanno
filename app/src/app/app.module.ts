import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ConfirmationPopoverModule } from 'angular-confirmation-popover';
import { AlertsModule } from 'angular-alert-module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './login/login.component';
import { AuthenticationService } from './providers/authentication.service';
import { ConfigurationService } from './providers/configuration.service';
import { AnnotationdataService } from './providers/annotationdata.service';

import { LogoutComponent } from './logout/logout.component';
import { ChangepasswordComponent } from './changepassword/changepassword.component';
import { AnnotationsComponent } from './annotations/annotations.component';
import { RoiwallComponent } from './roiwall/roiwall.component';


const appRoutes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'change-password', component: ChangepasswordComponent },
  { path: 'annotations', component: AnnotationsComponent},
  { path: 'roiwall', component: RoiwallComponent},
];

@NgModule({
  declarations: [
    AppComponent,
    LandingComponent,
    LoginComponent,
    LogoutComponent,
    ChangepasswordComponent,
    AnnotationsComponent,
    RoiwallComponent
],
  imports: [
    NgxDatatableModule,
    BrowserModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    ConfirmationPopoverModule.forRoot(),
    HttpClientModule,
    FormsModule,
    AlertsModule.forRoot()
  ],
  providers: [
    ConfigurationService,
    AuthenticationService,
    AnnotationdataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
