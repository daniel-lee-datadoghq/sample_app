import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { REGION_FLAGS, SymbolSummary } from '../../models/trade.model';
import { MarketDataService } from '../../services/market-data.service';
import { ResearchStore } from '../../services/research.store';

/** Toolbar entry point into Quotes & Research, mirroring the header search in the product. */
@Component({
  selector: 'app-research-search',
  standalone: true,
  imports: [ReactiveFormsModule, MatAutocompleteModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="search-field">
      <mat-icon matPrefix>search</mat-icon>
      <input
        matInput
        placeholder="Search name or symbol"
        aria-label="Search name or symbol for research"
        [formControl]="control"
        [matAutocomplete]="auto"
      />
      <mat-autocomplete #auto (optionSelected)="onSelected($event.option.value)">
        @for (match of matches(); track match.symbol) {
          <mat-option [value]="match.symbol">
            <span class="option-symbol">{{ flags[match.region] }} {{ match.symbol }}</span>
            <span class="option-name">{{ match.name }}</span>
          </mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  styles: [
    `
      .search-field {
        width: 280px;
        --mat-form-field-container-height: 40px;
        --mat-form-field-container-vertical-padding: 8px;
        background-color: var(--mat-sys-surface);
        border-radius: 4px;
      }

      mat-icon[matPrefix] {
        margin-right: 6px;
        color: var(--mat-sys-on-surface-variant);
      }

      .option-symbol {
        font-weight: 600;
        margin-right: 8px;
      }

      .option-name {
        font-size: 12px;
        color: var(--mat-sys-on-surface-variant);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchSearchComponent {
  private readonly market = inject(MarketDataService);
  private readonly store = inject(ResearchStore);

  readonly control = new FormControl('', { nonNullable: true });
  readonly matches = signal<SymbolSummary[]>([]);
  readonly flags = REGION_FLAGS;

  constructor() {
    this.control.valueChanges
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((term) => this.market.searchSymbols(term)),
        takeUntilDestroyed(),
      )
      .subscribe((matches) => this.matches.set(matches));
  }

  onSelected(symbol: string): void {
    this.store.open(symbol, 'toolbar_search');
    this.control.setValue('', { emitEvent: false });
  }
}
