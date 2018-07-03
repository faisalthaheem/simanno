import { Component } from '@angular/core';
import { ConfigurationService } from './providers/configuration.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Image Annotator';
  isCollapsed = false;

  constructor(private conf: ConfigurationService) {}

  showNavigation() {
    return true;
  }

}
