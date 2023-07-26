import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RainviewerService {
  constructor(private httpClient: HttpClient) {}

  getRainviewerUrlData(): Observable<any> {
    const url = 'https://api.rainviewer.com/public/weather-maps.json';
    return this.httpClient.get<any>(url);
  }
}
