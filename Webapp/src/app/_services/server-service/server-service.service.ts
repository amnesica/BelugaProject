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
   * Methode ruft Flugzeuge von den Feedern und vom Opensky-Network ab.
   * Zusätzlich kann die ISS abgerufen werden (Server-Aufruf)
   * @param lomin lower bound for the longitude in decimal degrees
   * @param lamin lower bound for the latitude in decimal degrees
   * @param lomax upper bound for the longitude in decimal degrees
   * @param lamax upper bound for the latitude in decimal degrees
   * @param selectedFeeder Ausgewählter Feeder (oder 'AllFeeder')
   * @param fetchFromOpensky Boolean, ob Opensky angefragt werden soll
   * @param showIss Boolean, ob ISS abgefragt werden soll
   * @returns
   */
  getPlanesUpdate(
    lomin: number,
    lamin: number,
    lomax: number,
    lamax: number,
    selectedFeeder: any,
    fetchFromOpensky: boolean,
    showIss: boolean
  ): Observable<Aircraft[]> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('lomin', lomin.toString());
    params = params.append('lamin', lamin.toString());
    params = params.append('lomax', lomax.toString());
    params = params.append('lamax', lamax.toString());
    params = params.append('selectedFeeder', selectedFeeder.toString());
    params = params.append('fetchFromOpensky', fetchFromOpensky.toString());
    params = params.append('showIss', showIss.toString());

    return this.httpClient.get<Aircraft[]>(Globals.urlGetPlanes, {
      params: params,
    });
  }

  /**
   * Methode ruft Flughäfen im Extent ab (Server-Aufruf)
   * @param lomin lower bound for the longitude in decimal degrees
   * @param lamin lower bound for the latitude in decimal degrees
   * @param lomax upper bound for the longitude in decimal degrees
   * @param lamax upper bound for the latitude in decimal degrees
   * @param zoomLevel Aktuelles Zoomlevel
   * @returns
   */
  getAirportsInExtent(
    lomin: number,
    lamin: number,
    lomax: number,
    lamax: number,
    zoomLevel: number
  ): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('lomin', lomin.toString());
    params = params.append('lamin', lamin.toString());
    params = params.append('lomax', lomax.toString());
    params = params.append('lamax', lamax.toString());
    params = params.append('zoomLevel', zoomLevel.toString());

    return this.httpClient.get<any>(Globals.urlGetAirports, {
      params: params,
    });
  }

  /**
   * Methode ruft Flughäfen im Extent ab (Server-Aufruf)
   * @param hex String
   * @param registration String
   * @returns
   */
  getAllAircraftData(
    hex: string,
    registration: string,
    isFromOpensky: boolean
  ): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('hex', hex);
    params = params.append('registration', registration);
    params = params.append('isFromOpensky', isFromOpensky.toString());

    return this.httpClient.get(Globals.urlGetAircraftData, {
      params: params,
    });
  }

  /**
   * Methode ruft alle Trail-Elemente eines Flugzeugs vom Server ab
   * (Server-Aufruf)
   * @param hex string
   * @param selectedFeeder selectedFeeder
   * @returns Observable<any>
   */
  getTrail(hex: string, selectedFeeder: any): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('hex', hex);
    params = params.append('selectedFeeder', selectedFeeder.toString());

    return this.httpClient.get(Globals.urlGetTrailData, {
      params: params,
    });
  }

  /**
   * Methode ruft alle RangeData-Einträge zwischen einer Start- und
   * einer Endzeit vom Server ab (Server-Aufruf)
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

  /**
   * Methode ruft die ISS ohne Angabe eines Extents vom Server ab (Server-Aufruf)
   */
  getISSWithoutExtent(): Observable<any> {
    return this.httpClient.get(Globals.urlGetISSWithoutExtent);
  }
}
