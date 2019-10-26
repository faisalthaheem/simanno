import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AnnotationdataService } from '../providers/annotationdata.service';

@Component({
  selector: 'app-roiwall',
  templateUrl: './roiwall.component.html',
  styleUrls: ['./roiwall.component.css']
})
export class RoiwallComponent implements OnInit {

  constructor(private adata: AnnotationdataService, private titleService: Title) { }

  rows: any = [
    {
      'col0': '<img src="https://cdn0.iconfinder.com/data/icons/vehicle-1/48/8-128.png" />',
      'col1': 'img 2',
      'col2': 'img 3',
      'col3': 'img 4',
    }
  ];

  ngOnInit() {
    this.titleService.setTitle('ROI Wall');
    this.refreshData();
  }

  refreshData() {

    this.adata.getRoiWallData()
    .subscribe(data => {
      this.rows = data['rows'];
    });
  }

}
