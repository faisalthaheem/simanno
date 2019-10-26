import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ConfirmationPopoverModule } from 'angular-confirmation-popover';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MatButtonModule, MatDialogModule } from '@angular/material';

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
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AlertModule } from 'ngx-alerts';
import { RoiElementComponent } from './roi-element/roi-element.component';
import { MatCardModule } from '@angular/material';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatPaginatorModule} from '@angular/material/paginator';

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
    RoiwallComponent,
    ConfirmDialogComponent,
    RoiElementComponent
],
  imports: [
    NgxDatatableModule,
    NgbModule,
    BrowserModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    ConfirmationPopoverModule.forRoot(),
    HttpClientModule,
    FormsModule,
    AlertModule.forRoot({maxMessages: 5, timeout: 5000, position: 'right'}),
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    MatCardModule,
    MatCheckboxModule,
    MatPaginatorModule
  ],
  providers: [
    ConfigurationService,
    AuthenticationService,
    AnnotationdataService
  ],
  entryComponents: [ConfirmDialogComponent],
  bootstrap: [AppComponent]
})
export class AppModule { }
