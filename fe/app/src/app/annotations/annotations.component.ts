import { Component, OnInit, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AnnotationdataService } from '../providers/annotationdata.service';
import { HostListener } from '@angular/core';
import { ConfirmDialogModel, ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from 'ngx-alerts';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import 'jquery';

// https://medium.com/all-is-web/angular-5-using-jquery-plugins-5edf4e642969

@Component({
  selector: 'app-annotations',
  templateUrl: './annotations.component.html',
  styleUrls: ['./annotations.component.css'],
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule]
})
export class AnnotationsComponent implements OnInit, OnDestroy {

  defImg: string = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHcAAAA2CAYAAAD9PQZDAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAA/qSURBVHhe7ZwJtFXTH8d3mTKLEJa0ElKRpJSKkjLLnGQeKpGMy9IyVsgQoSyZWkVKpbAkhIoMoSgkSqFkSGQoFPZ/f37t327f8859777c1//1ut+1fuvs89t7n3vO+e3hN51byTqYAiokKvtjAes4+vfvbw444ABTqVIls3LlSuEVZu46ii+//NKMGTPGDBo0yHz++eeeuwoq0oJw1xGsWLHCDB061IwYMcK8+uqrnlsU+++/v5k2bZqUiwh3wIABZt68eaZmzZrmn3/+MVWqVDG1atUyrVu3Nj/99JP5888/zeabb2423XRTs8UWW/heBZQFxo8fb4YPH26eeOKJMBtLwrhx48xRRx0l5SDcCy+80DzyyCPCLC2qVq1qatSoYVq0aGH23ntvU69ePdOyZUuzwQYb+BYF5IJZs2YFgersKwmDBw+WyXbqqafKeTwIgnAbNGhgZs6cKcx8YquttjL77ruvqV+/vqldu7asAnXq1JFBsL7jrbfeEmE+++yz5qOPPvLc3MBK+vTTT8vEatu2rXnllVdkgn311Ve+RSTczp07m4cffngV02lc1atXN99++62clyV22GEHc8ghh5g99thDhM75LrvsYnbddVez9dZb+1brJubMmWM++eQTmTRsdZ9++qmZO3eubG9rih49epg77rjDbLzxxp6zSl6gS5cu5sEHH5QyCMIdPXq0OeWUU4QJYC9evNi8/PLLZsqUKWb27Nlm6dKlsucyOv744w/fcu1gxx13FMHzUNttt53ZdtttZQBss802Zvvtt5d6+BCDY8stt/Q9849ly5aJkBDYzz//bBYtWiTa62effSbChJcv8BwdO3Y0Xbt2NQ0bNvTc1fj111/DJBg7dqw5/vjjpQwyFCodASBiFwvU8G+++cZUrlxZNLrvv/9eHvrDDz80M2bMMPPnz8/5WmUFtgIGAYJn6apWrZqsTAxQ7jl+bsA5Axkhcv88I6vYX3/95VuUDTbaaCOz3377mebNm5uDDjooY7Jlw7333msuu+wyKSffc4Zw69atK0sHYENHrQaMDEYIRvL7778vvJKAyt6hQwd/Zszff/8t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';
  currImg: string = this.defImg;
  currImgName: string;
  currAnnoArea: any;
  currDbName: string;
  aspectRatio: number = 0.0;
  availableLabels: {};
  defaultLabel: {};
  currentLabel:  Map<string,any>;
  queryParameters: {};

  constructor(private adata: AnnotationdataService,
    private titleService: Title,
    private alerts: AlertService,
    public dialog: MatDialog,
    private router: ActivatedRoute
    ) {
      this.currentLabel = new Map<string,any>();
      this.currentLabel.set('id',0);
      this.currentLabel.set('lbl','unkn');

      this.router.queryParams.subscribe(params => {
        this.queryParameters = params;
      });

    }



  ngOnInit() {
    // Check if jQuery is available
    if (typeof $ === 'undefined') {
      console.error('jQuery is not available in ngOnInit');
    }

     this.adata.getLabels().subscribe( (data) => {
      this.availableLabels = data['available'];
      this.defaultLabel = data['default'];


      // Add error checking for data
      if (!this.defaultLabel) {
        console.error('defaultLabel is undefined or null');
        return;
      }

      const defaultLabelKeys = Object.keys(this.defaultLabel);
      if (!defaultLabelKeys || defaultLabelKeys.length === 0) {
        console.error('defaultLabel keys are empty or undefined');
        return;
      }

      this.currentLabel['id'] = defaultLabelKeys[0];
      this.currentLabel['lbl']= this.defaultLabel[this.currentLabel['id']];

      //seek to the requested image if applicable
      if("seektoimg" in this.queryParameters)
      {
        console.debug("Seeking to requested image: " + this.queryParameters["seektoimg"]);
        this.loadNextImage(false,'name',this.queryParameters["seektoimg"] as string);
      }
    });
  }


  toggleAspectRatioEnforcement(ratio) {

    this.aspectRatio = ratio;
  }

  setCurrentLabelTo(lbl_id)
  {
    this.currentLabel['id'] = lbl_id;
    this.currentLabel['lbl'] = this.availableLabels[lbl_id];

    (<any>$('img#img-to-annotate')).selectAreas(
      'setDefaultLabel',
      lbl_id
    );

    this.alerts.success('Tagging all images as [' + this.currentLabel['lbl'] + '] with id: ' + this.currentLabel['id']);
    console.log(JSON.stringify(this.currentLabel));
  }

  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const pressedKey = parseInt(event.key, 10);

    const self = this;

    if(event.target['type'] !== 'text' && event.target['type'] !== 'number' ){
      // if ((pressedKey >= 1 && pressedKey <= 9) ) {

      //   self.adata.updateLabel(self.currDbName, self.currImgName, event.key).subscribe(
      //     data => {
      //       if (data['response'] === 'ok') {
      //         // show toaster
      //         this.alerts.success(data['message']);
      //       } else {
      //         //show toaster wit error
      //         this.alerts.danger(data['message']);
      //       }
      //     }, error => {}
      //   );
      // }else
      if( event.key === '`' ){

        self.updateImgAreas(self);
      }
    }
  }

  updateImgAreas(self){
    var areas = (<any>$('img#img-to-annotate')).selectAreas(
      'areas'
    );
    if(areas.length == 0){
      return;
    }
    self.adata.updateAnnotation(self.currDbName, self.currImgName, areas).subscribe(
      data => {
        if (data['response'] === 'valid') {
          console.log('update success');
          self.alerts.success(self.currImgName + ' updated');
        } else {
          console.log('update failure');
          self.alerts.danger(self.currImgName + ' update failed');
        }
      }, error => {});
      console.log('update call made');
  }

  imageLoaded() {
    try {
      if (this.currAnnoArea != null) {
        const self = this;
        
        // Check if jQuery and selectAreas are available
        if (typeof $ === 'undefined') {
          console.error('jQuery is not available');
          return;
        }
        
        if (!$('img#img-to-annotate').selectAreas) {
          console.error('selectAreas plugin is not available');
          return;
        }

        (<any>$('img#img-to-annotate')).selectAreas({
          minSize: [20, 20],
          aspectRatio: this.aspectRatio,
          labelsDict: self.availableLabels,
          defaultLabelId: Object.keys(self.defaultLabel)[0],
          onLoaded: function() {
            // Previously selected areas
            const str = JSON.stringify(self.currAnnoArea);
            const obj = JSON.parse(str);
            (<any>$('img#img-to-annotate')).selectAreas('add', obj);
          }
        });
      }
    } catch (error) {
      console.error('Error in imageLoaded:', error);
    }
  }

  HorizontalExpandContract(pixels: number) {

    const areas = (<any>$('img#img-to-annotate')).selectAreas('areas');

    const area0 = areas[0];
    area0.x = area0.x - pixels;
    area0.width = area0.width + (pixels * 2);

    (<any>$('img#img-to-annotate')).selectAreas('remove', 0);
    (<any>$('img#img-to-annotate')).selectAreas('add', area0);
  }

  verticalExpandContract(pixels: number) {

    const areas = (<any>$('img#img-to-annotate')).selectAreas('areas');

    const area0 = areas[0];
    area0.y = area0.y - pixels;
    area0.height = area0.height + (pixels * 2);

    (<any>$('img#img-to-annotate')).selectAreas('remove', 0);
    (<any>$('img#img-to-annotate')).selectAreas('add', area0);
  }

  expandContract(pixels: number) {

    const areas = (<any>$('img#img-to-annotate')).selectAreas('areas');

    const area0 = areas[0];
    area0.x = area0.x - pixels;
    area0.y = area0.y - pixels;
    area0.width = area0.width + (pixels * 2);
    area0.height = area0.height + (pixels * 2);

    (<any>$('img#img-to-annotate')).selectAreas('remove', 0);
    (<any>$('img#img-to-annotate')).selectAreas('add', area0);
  }

  expand(direction: string, pixels: number) {

    const areas = (<any>$('img#img-to-annotate')).selectAreas('areas');

    const area0 = areas[0];
    if (direction === 'left') {
      area0.x = area0.x - pixels;
      area0.width = area0.width + pixels;

    } else if (direction === 'top') {
      area0.y = area0.y - pixels;
      area0.height = area0.height + pixels;

    } else if (direction === 'right') {
      area0.width = area0.width + pixels;

    } else if (direction === 'bottom') {
      area0.height = area0.height + pixels;
    }

    (<any>$('img#img-to-annotate')).selectAreas('remove', 0);
    (<any>$('img#img-to-annotate')).selectAreas('add', area0);
  }

  move(direction: string, pixels: number) {

    const areas = (<any>$('img#img-to-annotate')).selectAreas('areas');

    const area0 = areas[0];
    if (direction === 'left') {
      area0.x = area0.x - pixels;

    } else if (direction === 'top') {
      area0.y = area0.y - pixels;

    } else if (direction === 'right') {
      area0.x = area0.x + pixels;

    } else if (direction === 'bottom') {
      area0.y = area0.y + pixels;
    }

    (<any>$('img#img-to-annotate')).selectAreas('remove', 0);
    (<any>$('img#img-to-annotate')).selectAreas('add', area0);
  }


  loadNextImage(forReview = false, filter = '', filterval = '') {
    try {
      // Check if jQuery is available
      if (typeof $ === 'undefined') {
        console.error('jQuery is not available in loadNextImage');
        return;
      }

      this.updateImgAreas(this);

      const imgElement = $('img#img-to-annotate');
      if (imgElement.length > 0 && imgElement.selectAreas) {
        imgElement.selectAreas('destroy');
      }
      this.currAnnoArea = null;
      this.currImg = this.defImg;

      this.adata.getNextImage(forReview, filter, filterval)
      .subscribe(data => {

        if (data['response'] === 'valid') {

          this.currImgName = data['imgname'];
          this.currImg = data['img'];
          this.currDbName = data['db'];
          this.currAnnoArea = JSON.parse(data['annotation']);

          this.titleService.setTitle(data['progress']);

        } else if (data['response'] === 'create') {
          this.currImgName = data['imgname'];
          this.currImg = data['img'];
          this.currDbName = data['db'];
          this.currAnnoArea = [];

          this.titleService.setTitle(data['progress']);
        }
        else{

          if (data['message'] !== undefined) {

            this.alerts.warning(data['message']);
          }

        }
      });
    } catch (error) {
      console.error('Error in loadNextImage:', error);
    }
  }

  loadPrevImage() {
    try {
      // Check if jQuery is available
      if (typeof $ === 'undefined') {
        console.error('jQuery is not available in loadPrevImage');
        return;
      }

      this.updateImgAreas(this);

      const imgElement = $('img#img-to-annotate');
      if (imgElement.length > 0 && imgElement.selectAreas) {
        imgElement.selectAreas('destroy');
      }
      this.currAnnoArea = null;
      this.currImg = this.defImg;

      this.adata.getPrevImage()
      .subscribe(data => {

        if (data['response'] === 'valid') {

          this.currImgName = data['imgname'];
          this.currImg = data['img'];
          this.currDbName = data['db'];
          this.currAnnoArea = JSON.parse(data['annotation']);

          this.titleService.setTitle(data['progress']);

        } else if (data['response'] === 'create') {
          this.currImgName = data['imgname'];
          this.currImg = data['img'];
          this.currDbName = data['db'];
          this.currAnnoArea = [];

          this.titleService.setTitle(data['progress']);
        }
        else{

          if (data['message'] !== undefined) {

            this.alerts.warning(data['message']);
          }

        }
      });
    } catch (error) {
      console.error('Error in loadPrevImage:', error);
    }
  }

  confirmDeleteCurrentImage(self){
    try {
      // Check if jQuery is available
      if (typeof $ === 'undefined') {
        console.error('jQuery is not available in confirmDeleteCurrentImage');
        return;
      }

      const imgElement = $('img#img-to-annotate');
      if (imgElement.length > 0 && imgElement.selectAreas) {
        imgElement.selectAreas('destroy');
      }
      self.currAnnoArea = null;
      self.currImg = this.defImg;

      self.adata.deleteCurrImage()
      .subscribe(data => {

        if (data['response'] === 'valid') {

          self.currImgName = data['imgname'];
          self.currImg = data['img'];
          self.currDbName = data['db'];
          self.currAnnoArea = JSON.parse(data['annotation']);

          self.titleService.setTitle(data['progress']);

          console.log('Current Image changed to :', self.currImgName);

        } else {

          if (data['message'] !== undefined) {

            self.alerts.warning(data['message']);
          }

        }
      });
    } catch (error) {
      console.error('Error in confirmDeleteCurrentImage:', error);
    }
  }

  delCurrImg(unreviwed, filter = '', filterval = '') {

    const message = 'Are you sure you want to delete image [' + this.currImgName +'] ?';

    const dialogData = new ConfirmDialogModel("Confirm Delete", message);

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: "400px",
      data: dialogData
    });

    var self = this;
    dialogRef.afterClosed().subscribe(dialogResult => {

      if (dialogResult === true){
        this.confirmDeleteCurrentImage(self);
      }
    });


  }

  ngOnDestroy() {
    // Clean up jQuery plugin when component is destroyed
    try {
      if (typeof $ !== 'undefined') {
        const imgElement = $('img#img-to-annotate');
        if (imgElement.length > 0 && imgElement.selectAreas) {
          imgElement.selectAreas('destroy');
        }
      }
    } catch (error) {
      console.warn('Error cleaning up selectAreas plugin:', error);
    }
  }
}
