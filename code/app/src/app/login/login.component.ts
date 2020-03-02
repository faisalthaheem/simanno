import { Component, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AuthenticationService } from '../providers/authentication.service';
import { ConfigurationService } from '../providers/configuration.service';
import { Router } from '@angular/router';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  username: string = null;
  password: string = null;
  formstate = 'form';

  constructor(private auth: AuthenticationService, private config: ConfigurationService, private router: Router) { }

  ngOnInit() {
    if (this.config.getConfig('username') != null) {
      this.formstate = 'loggedin';
    } else {
      this.formstate = 'form';
    }
  }

  checkDisableLogin() {
    return (this.username == null || this.password == null);
  }

  doLogin() {
    this.auth.authenticate(
      this.username, this.password)
      .subscribe(
        data => {

          if (data['response'] === 'valid') {
            this.config.setConfig('username', this.username, false);
            this.config.setConfig('password', this.password, false);
            // re reoute
            this.router.navigateByUrl('dashboard');
          } else {
            this.formstate = 'invalid';
          }
        }, error => {});
  }

}
