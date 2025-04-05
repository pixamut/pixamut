import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapDisplayComponent } from './map-display.component';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [MapDisplayComponent],
  imports: [
    CommonModule,
    IonicModule
  ],
  exports: [MapDisplayComponent]
})
export class MapDisplayModule { } 