import { enableProdMode, importProvidersFrom } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

// Import services
import { ConfigurationService } from './app/providers/configuration.service';
import { AnnotationdataService } from './app/providers/annotationdata.service';
import { NotificationsService } from './app/providers/notifications.service';

// Import ngx-alerts
import { AlertModule } from 'ngx-alerts';
import { AlertService } from 'ngx-alerts';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(appRoutes),
    importProvidersFrom(
      NgbModule,
      HttpClientModule,
      FormsModule,
      BrowserAnimationsModule,
      MatButtonModule,
      MatDialogModule,
      MatCardModule,
      MatCheckboxModule,
      MatPaginatorModule,
      MatToolbarModule,
      AlertModule.forRoot({ maxMessages: 5, timeout: 5000 })
    ),
    // Provide services
    ConfigurationService,
    AnnotationdataService,
    NotificationsService,
    {
      provide: AlertService,
      deps: [],
      useFactory: () => {
        // Create a basic config for the AlertService
        const config = {
          maxMessages: 5,
          timeout: 5000,
          position: 'right'
        };
        return new AlertService(config);
      }
    }
  ]
}).catch(err => console.log(err));
