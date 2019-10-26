import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class AnnotationdataService {

  baseurl = '';

  constructor(private http: HttpClient, private config: ConfigurationService) {
    this.baseurl = config.getConfig('baseurl');
  }

  getNextImage(unreviewed, filter, filterval) {

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'))
      .append('unreviewed', '' + unreviewed)
      .append('filter', filter)
      .append('filterval', filterval);


    return this.http.get(this.baseurl + '/get-next-image', {headers});
  }

  getPrevImage() {

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'));

    return this.http.get(this.baseurl + '/get-prev-image', {headers});
  }

  deleteCurrImage() {

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'));

    return this.http.get(this.baseurl + '/delete-current-image', {headers});
  }


  getRoiWallData(pageInfo: any) {

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'))
      .append('pageInfo', JSON.stringify(pageInfo) )
      .append('scriptip', this.baseurl);
    return this.http.get(this.baseurl + '/get-roi-wall-data', {headers});
  }

  updateAnnotation(dbName: string, imgname: string, coords: any) {

    const endpoint = this.baseurl + '/update-annotation';

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'));

      const formData: FormData = new FormData();
      formData.append('db', dbName);
      formData.append('imgname', imgname);
      formData.append('imgcoords', JSON.stringify(coords));

    return this.http.post(endpoint, formData, {headers});
  }

  updateLabel(dbName: string, imgname: string, labelid: string) {

    const endpoint = this.baseurl + '/set-label-to';

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'));

      const formData: FormData = new FormData();
      formData.append('db', dbName);
      formData.append('imgname', imgname);
      formData.append('labelid', labelid);

    return this.http.post(endpoint, formData, {headers});
  }

  getLabels() {

    const endpoint = this.baseurl + '/get-labels';

    const headers = new HttpHeaders()
      .append('username', this.config.getConfig('username'))
      .append('password', this.config.getConfig('password'));

      const formData: FormData = new FormData();
      console.log("requesting " + endpoint)
    return this.http.get(endpoint, {headers});
  }
}
