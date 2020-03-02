import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AnnotationdataService } from '../providers/annotationdata.service';
import {PageEvent} from '@angular/material/paginator';
import {NotificationsService} from '../providers/notifications.service';
import { ConfirmDialogModel, ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material';

@Component({
  selector: 'app-roiwall',
  templateUrl: './roiwall.component.html',
  styleUrls: ['./roiwall.component.css']
})
export class RoiwallComponent implements OnInit {

  constructor(
    private adata: AnnotationdataService,
    private titleService: Title,
    private notifications: NotificationsService,
    public dialog: MatDialog

  ) { }

  length = 100;
  pageSize = 10;
  pageSizeOptions: number[] = [50, 100, 500, 1000];
  pageData = []

  ngOnInit() {
    this.titleService.setTitle('ROI Wall');

    let initialEvent = {
      'length': 3,
      'pageIndex': 0,
      'pageSize': 50,
      'previousPageIndex': 1
    }

    this.getDataForWall(initialEvent);
  }

  onPageChange(pageEvent: PageEvent){
    this.getDataForWall(pageEvent);
  }

  getDataForWall(pageEvent: any){
    console.log(pageEvent);

    this.adata.getRoiWallData(pageEvent).subscribe(
      data => {
        console.log(data);
        this.length = data['total'];
        this.pageData = data['data'];
      },
      error => {
        console.log(error);
      }
    );
  }

  onDeleteSelected(){

    const message = 'Are you sure you want to delete the selected images?';

    const dialogData = new ConfirmDialogModel("Confirm Delete", message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      data: dialogData
    });

    var self = this;
    dialogRef.afterClosed().subscribe(dialogResult => {

      if (dialogResult === true){
        this.notifications.raiseNotifyRoiDeleteSelected();
      }
    });

  }


}
