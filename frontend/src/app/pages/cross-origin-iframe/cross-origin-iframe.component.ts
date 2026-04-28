import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-cross-origin-iframe',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './cross-origin-iframe.component.html',
  styleUrl: './cross-origin-iframe.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrossOriginIframeComponent {
  iframeUrl: SafeResourceUrl;
  rawUrl = 'http://localhost:4201';

  // SafeUrlPipe is intentionally not used here because it rejects cross-origin URLs.
  constructor(private sanitizer: DomSanitizer, private auth: AuthService) {
    const token = this.auth.getToken();
    const url = token ? `${this.rawUrl}?token=${token}` : this.rawUrl;
    this.iframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
