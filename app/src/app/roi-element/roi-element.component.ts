import { Component, OnInit } from '@angular/core';
import { AnnotationdataService } from '../providers/annotationdata.service';
import { ConfigurationService } from "../providers/configuration.service";

@Component({
  selector: 'app-roi-element',
  templateUrl: './roi-element.component.html',
  styleUrls: ['./roi-element.component.css'],
  inputs: ['imgname', 'roidata']
})
export class RoiElementComponent implements OnInit {
  imgname: string|null = null;
  roidata: any|null = null;
  baseurl: "";

  constructor(private adata: AnnotationdataService, private config: ConfigurationService) { }

  ngOnInit() {
    this.baseurl = this.config.getConfig("baseurl");
  }

}
