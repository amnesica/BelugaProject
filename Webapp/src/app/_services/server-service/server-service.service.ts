import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Aircraft } from '../../_classes/aircraft';
import { Globals } from 'src/app/_common/globals';

@Injectable({
  providedIn: 'root',
})
export class ServerService {
  constructor(private httpClient: HttpClient) {}

  /**
   * Methode ruft Flugzeuge von den Feedern ab (Server-Aufruf)
   */
  getAircraftsUpdate(): Observable<Aircraft[]> {
    return this.httpClient.get<Aircraft[]>(Globals.urlGetAircrafts);
  }

  /**
   * Methode ruft Links für Flugzeug-Foto von den Feedern ab (Server-Aufruf)
   */
  getAircraftPhoto(hex: string, registration: string): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('hex', hex);
    params = params.append('registration', registration);

    return this.httpClient.get(Globals.urlGetAircraftPhoto, {
      params: params,
    });
  }

  /**
   * Methode ruft die ISS ab (Server-Aufruf)
   */
  getIss(): Observable<Aircraft> {
    return this.httpClient.get<Aircraft>(Globals.urlGetIss);
  }

  /**
   * Methode holt Daten über Flughäfen mit ident aus Datenbank (Server-Aufruf)
   * "ident" ist "destination" oder "origin" des Flugzeugs
   */
  getAirportData(ident: string): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('ident', ident);

    let response = this.httpClient.get(Globals.urlGetAirportData, {
      params: params,
    });

    return response;
  }

  /**
   * Methode holt Daten über Länder mit iso2letter-Code aus Datenbank (Server-Aufruf)
   * "iso2letter-Code" ist der 2-stellige Länderschlüssel in Kleinbuchstaben, z. B. "de"
   */
  getCountryData(countryIso2letter: string): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('countryIso2letter', countryIso2letter);

    let response = this.httpClient.get(Globals.urlGetCountryData, {
      params: params,
    });

    return response;
  }

  /**
   * Methode holt Daten über Operator mit ICAO-Code aus Datenbank (Server-Aufruf)
   * "ICAO-Code" ist der 3-stellige Operator-Code in Grossbuchstaben, z. B. "DLH"
   */
  getOperatorData(operatorIcao: string): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('operatorIcao', operatorIcao);

    let response = this.httpClient.get(Globals.urlGetOperatorData, {
      params: params,
    });

    return response;
  }

  /**
   * Methode holt Daten über Reg-Code-Prefix aus Datenbank (Server-Aufruf)
   * "Reg-Code-Prefix" ist der Prefix der Registrierung in Grossbuchstaben, z. B. "D"
   */
  getRegcodeData(regcodePrefix: string): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('regcodePrefix', regcodePrefix);

    let response = this.httpClient.get(Globals.urlGetRegcodeData, {
      params: params,
    });

    return response;
  }

  /**
   * Methode ruft alle Informationen der Entfernungs-Daten ab (Server-Aufruf)
   */
  getAllRangeData(): Observable<any> {
    return this.httpClient.get(Globals.urlGetAllRangeData);
  }

  /**
   * Methode ruft alle Informationen der Entfernungs-Daten innerhalb einer
   * bestimmten Zeitspanne mit Start- und Endzeit ab (Server-Aufruf)
   */
  getRangeDataBetweenTimestamps(
    startTime: number,
    endTime: number
  ): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('startTime', startTime.toString());
    params = params.append('endTime', endTime.toString());

    let response = this.httpClient.get(
      Globals.urlGetRangeDataBetweenTimestamps,
      {
        params: params,
      }
    );

    return response;
  }

  /**
   * Methode holt benötigte Konfigurations-Variablen vom Server (Server-Aufruf)
   */
  getConfigurationData(): any {
    return this.httpClient.get(Globals.urlGetConfigurationData);
  }
}
