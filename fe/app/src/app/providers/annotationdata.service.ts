import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ConfigurationService } from './configuration.service';

@Injectable({
  providedIn: 'root'
})
export class AnnotationdataService {

  baseurl = '';

  constructor(private http: HttpClient, private config: ConfigurationService) {
    this.baseurl = config.getConfig('baseurl');
  }

  getNextImage(unreviewed: boolean, filter: string, filterval: string) {
    // Backend expects query parameters, not headers
    let params = new HttpParams()
      .set('unreviewed', unreviewed ? 'true' : 'false');
      
    if (filter) {
      params = params.set('filter', filter);
    }
    
    if (filterval) {
      params = params.set('filterval', filterval);
    }

    return this.http.get(this.baseurl + '/get-next-image', { params });
  }

  getPrevImage() {
    // Simple GET request with no parameters
    return this.http.get(this.baseurl + '/get-prev-image');
  }

  deleteImage(imgName: string) {
    // Backend expects imgname as a header parameter
    const headers = new HttpHeaders()
      .set('imgname', imgName);

    return this.http.delete(this.baseurl + '/delete-image', { headers });
  }

  deleteCurrImage() {
    // Simple DELETE request
    return this.http.delete(this.baseurl + '/delete-current-image');
  }

  getRoiWallData(pageInfo: any) {
    // Backend expects pageInfo and scriptip as header parameters
    const headers = new HttpHeaders()
      .set('pageInfo', JSON.stringify(pageInfo))
      .set('scriptip', this.baseurl);

    return this.http.get(this.baseurl + '/get-roi-wall-data', { headers });
  }

  updateAnnotation(dbName: string, imgname: string, coords: any) {
    // Send data as JSON in request body instead of form data
    const body = {
      db: dbName,
      imgname: imgname,
      imgcoords: JSON.stringify(coords)
    };

    return this.http.post(this.baseurl + '/update-annotation', body);
  }

  updateLabel(dbName: string, imgname: string, labelid: string) {
    // Send data as JSON in request body instead of form data
    const body = {
      db: dbName,
      imgname: imgname,
      labelid: labelid
    };

    return this.http.post(this.baseurl + '/set-label-to', body);
  }

  getLabels() {
    // Simple GET request
    return this.http.get(this.baseurl + '/get-labels');
  }
}
