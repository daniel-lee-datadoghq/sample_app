import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({ name: 'safeUrl', standalone: true })
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeResourceUrl {
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin !== window.location.origin) {
      throw new Error(`Untrusted URL origin: ${parsed.origin}`);
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}
