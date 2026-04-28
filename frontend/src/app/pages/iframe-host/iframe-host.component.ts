import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';

@Component({
  selector: 'app-iframe-host',
  standalone: true,
  imports: [MatCardModule, MatIconModule, SafeUrlPipe],
  templateUrl: './iframe-host.component.html',
  styleUrl: './iframe-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IframeHostComponent {
  iframeUrl: string;

  constructor() {
    this.iframeUrl = `${window.location.origin}/embedded/account-summary`;
  }
}
