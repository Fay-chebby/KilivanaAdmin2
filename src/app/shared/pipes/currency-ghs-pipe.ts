import { Pipe, PipeTransform } from '@angular/core';

/**
 * 2004 -> "KSh 2,004"
 * 284600 with compact=true -> "KSh 284.6k"
 */
@Pipe({
  name: 'currencyKsh',
})
export class CurrencyKshPipe implements PipeTransform {
  transform(value: number | null | undefined, compact = false): string {
    if (value === null || value === undefined) {
      return '—';
    }

    if (compact && Math.abs(value) >= 1000) {
      const k = (value / 1000).toFixed(1).replace(/\.0$/, '');

      return `KSh ${k}k`;
    }

    return `KSh ${value.toLocaleString('en-KE')}`;
  }
}
