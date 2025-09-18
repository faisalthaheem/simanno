import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private notifyRoiDeleteSelected = new Subject<any>();
  /**
   * Observable string streams
   */
  notifyRoiDeleteSelectedObservable$ = this.notifyRoiDeleteSelected.asObservable();

  constructor(){}

  public raiseNotifyRoiDeleteSelected() {
    this.notifyRoiDeleteSelected.next(null);
  }
}
