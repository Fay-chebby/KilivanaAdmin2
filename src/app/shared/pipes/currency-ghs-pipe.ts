import { Pipe, PipeTransform } from '@angular/core';

/** 2004 -> "GHS 2,004"   |   284600 with compact=true -> "GHS 284.6k" */
@Pipe({ name: 'currencyGhs' })
export class CurrencyGhsPipe implements PipeTransform {
  transform(value: number | null | undefined, compact = false): string {
    if (value === null || value === undefined) return '—';
    if (compact && Math.abs(value) >= 1000) {
      const k = (value / 1000).toFixed(1).replace(/\.0$/, '');
      return `GHS ${k}k`;
    }
    return `GHS ${value.toLocaleString('en-US')}`;
  }
}
