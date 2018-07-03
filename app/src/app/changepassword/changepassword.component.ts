import { Component, OnInit } from '@angular/core';
import { NgModel } from '@angular/forms';
import { AuthenticationService } from '../providers/authentication.service';
import { ConfigurationService } from '../providers/configuration.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-changepassword',
  templateUrl: './changepassword.component.html',
  styleUrls: ['./changepassword.component.css']
})
export class ChangepasswordComponent implements OnInit {

  currpassword: string = null;
  newpassword: string = null;
  formstate = 'form';

  constructor(private auth: AuthenticationService, private config: ConfigurationService, private router: Router) { }

  ngOnInit() {

    if (this.config.getConfig('username') == null) {
      this.router.navigate(['']);
    }
  }

  checkChangeButtonEnabled() {
    return (this.currpassword == null || this.newpassword == null);
  }

  doChangePassword() {

    if (this.config.getConfig('password') !== this.currpassword){
      this.formstate = 'invalid';
      return;
    }

    this.auth.changepassword(
      this.currpassword, this.newpassword)
      .subscribe(
        data => {

          if (data['response'] === 'changed') {
            this.config.setConfig('password', this.newpassword, false);
            // re reoute
            this.formstate = 'changed';
          } else {
            this.formstate = 'invalid';
          }
        }, error => {});
  }
}
