import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { AnnotationdataService } from '../providers/annotationdata.service';
import { ConfigurationService } from "../providers/configuration.service";
import { Subscription } from 'rxjs';
import { NotificationsService } from '../providers/notifications.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-roi-element',
  templateUrl: './roi-element.component.html',
  styleUrls: ['./roi-element.component.css'],
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatCheckboxModule, FormsModule]
})
export class RoiElementComponent implements OnInit, OnDestroy {
  private _imgname: string|null = null;
  private _roidata: any|null = null;
  baseurl: string = "";
  private subscription: Subscription;
  selected: boolean = false;
  isDeleted: boolean = false;

  @Input() set imgname(value: string|null) {
    console.log('Setting imgname to:', value);
    this._imgname = value;
  }
  
  get imgname(): string|null {
    return this._imgname;
  }

  @Input() set roidata(value: any|null) {
    console.log('Setting roidata to:', value);
    this._roidata = value;
  }
  
  get roidata(): any|null {
    return this._roidata;
  }

  constructor(
    private adata: AnnotationdataService,
    private config: ConfigurationService,
    private notifications: NotificationsService
  ) { }

  ngOnInit() {
    console.log('ROI Element initialized with imgname:', this.imgname, 'and roidata:', this.roidata);
    this.baseurl = this.config.getConfig("baseurl");
    console.log('Base URL set to:', this.baseurl);
    
    // Check if we have valid data
    if (!this.imgname || !this.roidata) {
      console.warn('ROI Element missing required data - imgname:', this.imgname, 'roidata:', this.roidata);
    }
    
    let self = this;

    this.subscription = this.notifications.notifyRoiDeleteSelectedObservable$.subscribe((res) => {

      if(self.selected == true)
      {
        this.adata.deleteImage(self._imgname).subscribe(data => {
          if(data['status'] == "ok"){
            self.isDeleted = true;
          }
        });
      }
    });

  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  handleImageError(event: any) {
    console.log('Image failed to load for ROI:', this._imgname, this._roidata);
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
  }

}
