import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyKsh',
  standalone: true,
})
export class CurrencyKshPipe implements PipeTransform {
  transform(value: number | null | undefined, compact = false): string {
    if (value === null || value === undefined) {
      return 'KSh 0';
    }

    if (compact) {
      if (value >= 1_000_000) {
        return `KSh ${(value / 1_000_000).toFixed(1)}M`;
      }

      if (value >= 1_000) {
        return `KSh ${(value / 1_000).toFixed(1)}k`;
      }
    }

    return `KSh ${value.toLocaleString('en-KE')}`;
  }
}
