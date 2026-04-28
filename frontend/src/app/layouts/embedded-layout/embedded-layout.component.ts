import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-embedded-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="embedded-container">
      <router-outlet />
    </div>
  `,
  styles: [`
    .embedded-container {
      padding: 16px;
      background: white;
      min-height: 100vh;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbeddedLayoutComponent {}
