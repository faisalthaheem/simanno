import { Component, OnInit, OnDestroy } from '@angular/core';
import { AnnotationdataService } from '../providers/annotationdata.service';
import { ConfigurationService } from "../providers/configuration.service";
import { Subscription } from 'rxjs/Subscription';
import {NotificationsService} from '../providers/notifications.service';

@Component({
  selector: 'app-roi-element',
  templateUrl: './roi-element.component.html',
  styleUrls: ['./roi-element.component.css'],
  inputs: ['imgname', 'roidata']
})
export class RoiElementComponent implements OnInit, OnDestroy {
  imgname: string|null = null;
  roidata: any|null = null;
  baseurl: "";
  private subscription: Subscription;
  selected: boolean = false;
  isDeleted: boolean = false;

  constructor(
    private adata: AnnotationdataService,
    private config: ConfigurationService,
    private notifications: NotificationsService
  ) { }

  ngOnInit() {
    this.baseurl = this.config.getConfig("baseurl");
    let self = this;

    this.subscription = this.notifications.notifyRoiDeleteSelectedObservable$.subscribe((res) => {

      console.log(self.selected);

      if(self.selected == true)
      {
        this.adata.deleteImage(self.imgname).subscribe(data => {
          console.log(data);
          if(data['status'] == true){
            self.isDeleted = true;
          }
        });
      }
    });

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

}
