import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AnnotationdataService } from '../providers/annotationdata.service';
import {PageEvent} from '@angular/material/paginator';

@Component({
  selector: 'app-roiwall',
  templateUrl: './roiwall.component.html',
  styleUrls: ['./roiwall.component.css']
})
export class RoiwallComponent implements OnInit {

  constructor(private adata: AnnotationdataService, private titleService: Title) { }

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


}
