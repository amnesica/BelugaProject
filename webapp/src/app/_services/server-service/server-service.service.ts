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
   * Methode ruft Flugzeuge von den Feedern und vom Opensky-Network/Airplanes-Live ab.
   * Zusätzlich kann die ISS abgerufen werden (Server-Aufruf)
   * @param lomin lower bound for the longitude in decimal degrees
   * @param lamin lower bound for the latitude in decimal degrees
   * @param lomax upper bound for the longitude in decimal degrees
   * @param lamax upper bound for the latitude in decimal degrees
   * @param selectedFeeder Ausgewählter Feeder (oder 'AllFeeder')
   * @param fetchRemote String, ob Remote angefragt werden soll (Name von Remote-Netzwerk)
   * @param showIss Boolean, ob ISS abgefragt werden soll
   * @param markedHex String, hex des aktuell markierten Flugzeugs
   * @param showOnlyMilitary Boolean, ob nur Militär angezeigt werden soll
   * @returns
   */
  getPlanesUpdate(
    lomin: number,
    lamin: number,
    lomax: number,
    lamax: number,
    selectedFeeder: any,
    fetchRemote: string | null,
    showIss: boolean,
    markedHex: string | null,
    showOnlyMilitary: boolean
  ): Observable<Aircraft[]> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('lomin', lomin.toString());
    params = params.append('lamin', lamin.toString());
    params = params.append('lomax', lomax.toString());
    params = params.append('lamax', lamax.toString());
    params = params.append('selectedFeeder', selectedFeeder.toString());
    if (fetchRemote != null) params = params.append('fetchRemote', fetchRemote);
    params = params.append('showIss', showIss.toString());
    if (markedHex != null) params = params.append('markedHex', markedHex);
    params = params.append('showOnlyMilitary', showOnlyMilitary.toString());

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
    isFromRemote: boolean
  ): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('hex', hex);
    params = params.append('registration', registration);
    params = params.append('isFromRemote', isFromRemote);

    return this.httpClient.get(Globals.urlGetAircraftData, {
      params: params,
    });
  }

  /**
   * Methode ruft alle Trail-Elemente eines Flugzeugs vom Server ab
   * (Server-Aufruf)
   * @param hex string
   * @param selectedFeeder selectedFeeder
   * @param fetchRemote string
   * @returns Observable<any>
   */
  getTrail(
    hex: string,
    selectedFeeder: any,
    fetchRemote: string | null
  ): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('hex', hex);
    params = params.append('selectedFeeder', selectedFeeder.toString());
    if (fetchRemote != null) params = params.append('fetchRemote', fetchRemote);

    return this.httpClient.get(Globals.urlGetTrailData, {
      params: params,
    });
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

  /**
   * Methode ruft alle Trails vom Server ab (Server-Aufruf)
   * @returns Observable<any>
   */
  getAllTrails(): Observable<any> {
    return this.httpClient.get(Globals.urlGetAllTrailData);
  }

  /**
   * Methode ruft AIS-Daten von aisstream.io ab
   * @param lomin lower bound for the longitude in decimal degrees
   * @param lamin lower bound for the latitude in decimal degrees
   * @param lomax upper bound for the longitude in decimal degrees
   * @param lamax upper bound for the latitude in decimal degrees
   * @returns
   */
  getAisDataInExtent(
    lomin: number,
    lamin: number,
    lomax: number,
    lamax: number,
    enable: boolean
  ): Observable<any> {
    // Initialiere Params-Objekt
    let params = new HttpParams();

    // Weise Parameter zu
    params = params.append('lomin', lomin.toString());
    params = params.append('lamin', lamin.toString());
    params = params.append('lomax', lomax.toString());
    params = params.append('lamax', lamax.toString());
    params = params.append('enable', enable);

    return this.httpClient.get<any>(Globals.urlGetAisData, {
      params: params,
    });
  }

  getAisPhoto(mmsi: string): Observable<any> {
    let params = new HttpParams();
    params = params.append('mmsi', mmsi.toString());

    return this.httpClient.get<any>(Globals.urlGetAisPhoto, {
      params: params,
    });
  }

  getActualRangeOutline(selectedFeeder: any): Observable<any> {
    let params = new HttpParams();
    params = params.append('selectedFeeder', selectedFeeder.toString());

    return this.httpClient.get<any>(Globals.urlGetActualRangeOutline, {
      params: params,
    });
  }

  getAddressFromServer(inputPlace: any): Observable<any> {
    let params = new HttpParams();
    params = params.append('inputPlace', inputPlace.toString());

    return this.httpClient.get<any>(Globals.urlGetLocationFromPlaceInput, {
      params: params,
    });
  }
}
