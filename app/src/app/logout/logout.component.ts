import { Component, OnInit } from '@angular/core';
import { ConfigurationService } from '../providers/configuration.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css']
})
export class LogoutComponent implements OnInit {

  constructor(private config: ConfigurationService, private router: Router) { }

  ngOnInit() {
  }

  doLogout() {

    this.config.eraseconfig('username');
    this.config.eraseconfig('password');

    this.router.navigateByUrl('');

  }

}
