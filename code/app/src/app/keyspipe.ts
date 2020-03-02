// https://angular.io/guide/pipes
// https://stackoverflow.com/questions/35534959/access-key-and-value-of-object-using-ngfor
import { PipeTransform, Pipe } from '@angular/core';

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
  transform(value, args: string[]): any {
    let keys = [];
    for (let key in value) {
      keys.push(key);
    }
    return keys;
  }
}
