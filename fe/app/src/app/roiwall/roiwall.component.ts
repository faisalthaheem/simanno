import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AnnotationdataService } from '../providers/annotationdata.service';
import { PageEvent } from '@angular/material/paginator';
import { NotificationsService } from '../providers/notifications.service';
import { ConfirmDialogModel, ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roiwall',
  templateUrl: './roiwall.component.html',
  styleUrls: ['./roiwall.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatPaginatorModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatCardModule, 
    MatCheckboxModule, 
    FormsModule
  ]
})
export class RoiwallComponent implements OnInit {

  constructor(
    private adata: AnnotationdataService,
    private titleService: Title,
    private notifications: NotificationsService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog

  ) { }

  length = 100;
  pageSize = 10;
  pageSizeOptions: number[] = [50, 100, 500, 1000];
  pageData = [];
  gridData = [];
  baseurl = '';

  ngOnInit() {
    console.log('ROI Wall component initialized');
    this.titleService.setTitle('ROI Wall');
    
    // Set the baseurl from the annotation data service
    this.baseurl = this.adata.baseurl;
    console.log('Base URL set to:', this.baseurl);

    let initialEvent = {
      'length': 0,
      'pageIndex': 0,
      'pageSize': 50,
      'previousPageIndex': 0
    }

    this.getDataForWall(initialEvent);
  }

  onPageChange(pageEvent: PageEvent){
    this.getDataForWall(pageEvent);
  }

  getDataForWall(pageEvent: any){
    console.log('Fetching ROI wall data with page event:', pageEvent);

    this.adata.getRoiWallData(pageEvent).subscribe(
      data => {
        console.log('Received ROI wall data:', data);
        this.length = data['total'] || 0;
        this.pageData = data['data'] || [];
        console.log('Page data set to:', this.pageData);
        
        // Process the data to create a flat array of ROI objects for the grid
        this.gridData = [];
        for (const row of this.pageData) {
          // Each row has col0, col1, col2, col3 properties
          for (let i = 0; i < 4; i++) {
            const colKey = `col${i}`;
            if (row[colKey] !== null && row[colKey] !== undefined) {
              this.gridData.push(row[colKey]);
            }
          }
        }
        
        console.log('Grid data set to:', this.gridData);
        console.log('Grid data (JSON):', JSON.stringify(this.gridData));
        console.log('Base URL is:', this.baseurl);
        
        // Log the first few image URLs that would be generated
        if (this.gridData.length > 0) {
          const firstRoi = this.gridData[0];
          const imageUrl = `${this.baseurl}/get-roi-for-wall?filename=${firstRoi.filename}&y=${firstRoi.y}&x=${firstRoi.x}&h=${firstRoi.height}&w=${firstRoi.width}`;
          console.log('First ROI image URL would be:', imageUrl);
        }
        
        // Trigger change detection
        this.cdr.detectChanges();
      },
      error => {
        console.log('Error fetching ROI wall data:', error);
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

  handleImageError(event: any, filename: string) {
    console.log('Image failed to load:', filename);
    // Set a placeholder image when the actual image fails to load
    event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=';
  }

  onImageLoad(event: any, filename: string) {
    console.log('Image loaded successfully:', filename);
  }


}
