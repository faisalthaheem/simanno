import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterModule, NgbModule, CommonModule]
})
export class AppComponent {
  title = 'Image Annotator';
  isCollapsed = false;

  showNavigation() {
    // Always show navigation
    return true;
  }

}
