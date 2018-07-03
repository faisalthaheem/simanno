import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from './configuration.service';


@Injectable()
export class AuthenticationService {

  baseurl = '';

  constructor(private http: HttpClient, private config: ConfigurationService) {
    this.baseurl = config.getConfig('baseurl');
  }

  authenticate(username: string, password: string) {

    const endpoint = this.baseurl + '/authenticate';
    const formData: FormData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    return this.http.post(endpoint, formData);
  }

  changepassword(currpassword: string, newpassword: string) {

    const endpoint = this.baseurl + '/change-password';

    const formData: FormData = new FormData();
    formData.append('currpassword', currpassword);
    formData.append('newpassword', newpassword);

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'));

    return this.http.post(endpoint, formData, {headers});
  }
}
