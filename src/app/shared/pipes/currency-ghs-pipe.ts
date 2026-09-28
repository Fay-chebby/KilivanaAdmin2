import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyGhs'
})
export class CurrencyGhsPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
