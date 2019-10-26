import { Injectable } from '@angular/core';

@Injectable()
export class ConfigurationService {

  config = {};

  constructor() {
    this.config['baseurl'] = 'http://' + location.hostname + ':5000';
    // todo: remove before production
    this.config['username'] = 'admin';
    this.config['password'] = 'secret';
  }

  setConfig(key: string, val: string, persist: boolean) {
    this.config[key] = val;
  }

  getConfig(key: string) {
    return this.config[key];
  }

  eraseconfig(key: string) {
    delete this.config[key];
  }

}
