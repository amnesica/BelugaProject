import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import { Style, Fill, Stroke, Circle, Icon, Text } from 'ol/style';
import OSM from 'ol/source/OSM';
import * as olProj from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import { Group as LayerGroup, WebGLPoints } from 'ol/layer';
import { ServerService } from 'src/app/_services/server-service/server-service.service';
import { Aircraft } from 'src/app/_classes/aircraft';
import { Globals } from 'src/app/_common/globals';
import { Helper } from 'src/app/_classes/helper';
import { Markers } from 'src/app/_classes/markers';
import { Title } from '@angular/platform-browser';
import Colorize from 'ol-ext/filter/Colorize';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import * as olInteraction from 'ol/interaction';
import * as olExtent from 'ol/extent';
import LineString from 'ol/geom/LineString';
import * as olExtSphere from 'ol-ext/geom/sphere';
import Polygon from 'ol/geom/Polygon';
import Overlay from 'ol/Overlay';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { Feeder } from 'src/app/_classes/feeder';
import { ToolbarService } from 'src/app/_services/toolbar-service/toolbar-service.service';
import {
  ScaleLine,
  defaults as defaultControls,
  Attribution,
} from 'ol/control';
import { AircraftTableService } from 'src/app/_services/aircraft-table-service/aircraft-table-service.service';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Styles } from 'src/app/_classes/styles';
import { Collection } from 'ol';
import { Draw } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Geometry } from 'ol/geom';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import XYZ from 'ol/source/XYZ';
import { RainviewerService } from 'src/app/_services/rainviewer-service/rainviewer-service.service';
import { Maps } from 'src/app/_classes/maps';
import { CesiumService } from 'src/app/_services/cesium-service/cesium-service.component';
import {
  dummyParentAnimation,
  slideInOutRight,
} from 'src/app/_common/animations';
import { Storage } from 'src/app/_classes/storage';
import { Trail } from 'src/app/_classes/trail';
import { Ship } from 'src/app/_classes/ship';
import BaseLayer from 'ol/layer/Base';
import { StyleLike } from 'ol/style/Style';
import { LiteralStyle } from 'ol/style/literal';

@Component({
  selector: 'app-map',
  changeDetection: ChangeDetectionStrategy.Default,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  animations: [dummyParentAnimation, slideInOutRight],
})
export class MapComponent implements OnInit {
  // Openlayers Karte
  OLMap: any;

  // Openlayers Layer auf Karte
  layers!: Collection<any>;

  // Layer für die OSM Map
  osmLayer: any;

  // Layer für Range Data
  rangeDataLayer!: VectorLayer<VectorSource<Geometry>>;

  // Entfernungs-Ringe und Feeder-Position als Features
  StaticFeatures = new Vector();

  // Flughäfen als Features
  AirportFeatures = new Vector();

  // Schiffe als Features
  AisFeatures = new Vector();

  // Schiff-Labels als Features
  AisLabelFeatures = new Vector();

  // Schiff-Outlines als Features
  AisOutlineFeatures = new Vector();

  // Route als Kurve zum Zielort als Features
  RouteFeatures = new Vector();

  // RangeData als Features
  RangeDataFeatures = new Vector();

  // Objekt mit allen Flugzeugen
  Planes: { [hex: string]: Aircraft } = {};

  // Flugzeug-Labels als Features
  PlaneLabelFeatures = new Vector();

  // Layer für Flugzeug-Labels
  planeLabelFeatureLayer!: VectorLayer<Vector<Geometry>>;

  // Aktuell angeklicktes Aircraft
  aircraft: Aircraft | null = null;

  // Aktuell gehovertes Aircraft
  hoveredAircraftObject: any;

  // Distanzen fuer darzustellende Ringe (in nm)
  circleDistancesInNm: number[] = [];

  // Array mit Feedern aus Konfiguration
  listFeeder: Feeder[] = [];

  // Info über Fehler, wenn Konfiguration nicht geladen
  // werden kann und das Programm nicht startet
  infoConfigurationFailureMessage;

  // Boolean, in welchem Modus sich die Anwendung befindet
  isDesktop!: boolean;

  // Ausgewählter Feeder im Select
  selectedFeederUpdate: string[] = [];

  // Default-Werte für Fetch-Booleans
  showAirportsUpdate: boolean = true;
  showOpenskyPlanes: boolean = false;
  showAirplanesLivePlanes: boolean = false;
  showAisData: boolean = false;
  showIss: boolean = true;
  showOnlyMilitary: boolean = false;

  // Anzahl der momentan laufenden Fetches (Flugzeuge) an den Server
  pendingFetchesPlanes = 0;

  // Anzahl der momentan laufenden Fetches (Airports) an den Server
  pendingFetchesAirports = 0;

  // Boolean, ob DarkMode aktiviert ist
  darkMode: boolean = false;

  // Boolean, ob Flugzeug-Label angezeigt werden sollen
  showAircraftLabel: boolean = false;

  // Boolean, ob Flugzeug-Positionen angezeigt werden sollen
  showAircraftPositions: boolean = true;

  // Zeige Route zwischen Start-Flugzeug-Ziel an
  showRoute: any;

  // Gespeicherte Position und ZoomLevel des Mittelpunkts der Karte
  oldCenterPosition: any;
  oldCenterZoomLevel: any;

  // Boolean zum Anzeigen der ShortInfo beim Hovern
  public showSmallInfo = false;

  // Positions-Werte für die SmallInfoBox (initialisiert mit Default-Werten)
  public topValue = 60;
  public leftValue = 40;

  // RangeData vom Server
  rangeDataJSON: any;

  // Aktuell angeklickter RangeDataPoint (Feature)
  rangeDataPoint: any;

  // Boolean, ob Popup für RangeDataPoint angezeigt
  // werden soll nach Klick
  showPopupRangeDataPoint: boolean = false;

  // Positionswerte für das Popup zum Anzeigen der
  // RangeData-Informationen
  leftValueRangeData!: number;
  topValueRangeData!: number;

  // Popup für RangeData-Punkte
  rangeDataPopup: any;

  // Number-Array mit Timestamps (startTime, endTime)
  datesCustomRangeData!: number[];

  // Boolean, ob RangeData nach Feeder farblich sortiert sein soll
  markRangeDataByFeeder: boolean = false;

  // Boolean, ob RangeData nach Höhe farblich sortiert sein soll
  markRangeDataByHeight: boolean = false;

  // Bottom-Wert für RangeDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  rangeDataPopupBottomValue: any = 0;

  // Selektierte Feeder, nachdem Range Data selektiert werden soll
  selectedFeederRangeData: string[] = [];

  // Layer für WebGL-Features
  webglLayer: WebGLPoints<VectorSource<Point>> | undefined;

  // Boolean, ob POMD-Point angezeigt werden soll
  showPOMDPoint: boolean = false;

  // Boolean, ob Range-Data sichtbar ist
  rangeDataIsVisible: boolean = true;

  // Alte Kartenposition und Zoomlevel, wenn ISS im Zentrum angezeigt werden soll
  oldISSCenterPosition: any;
  oldISSCenterZoomLevel: any;

  // Layer zum Zeichnen der aktuellen Geräte-Position
  drawLayer: any;

  // Aktuelle Geräte-Position als Feature
  DrawFeature = new Vector();

  // Boolean, ob RainViewer (Rain) Data sichtbar ist
  showRainViewerRain: boolean = false;

  // Boolean, ob RainViewer (Clouds) Data sichtbar ist
  showRainViewerClouds: boolean = false;

  // Boolean, ob RainViewer Forecast (Rain) Data sichtbar ist
  showRainViewerRainForecast: boolean = false;

  // Layer für die Rainviewer Daten (Regen)
  rainviewerRainLayer: TileLayer<XYZ> = new TileLayer();

  // Layer für die Rainviewer Daten (Clouds)
  rainviewerCloudsLayer: TileLayer<XYZ> = new TileLayer();

  // Urls für RainViewer Forecast
  forecastRainPathAndTime: any[] = [];

  // Id des Refresh-Intervals für Rainviewer-Daten
  refreshIntervalIdRainviewer: any;

  // Id des Refresh-Intervals für Rainviewer-Daten (Forecast Animation)
  refreshIntervalIdRainviewerForecast: any;

  // Ids für timeouts zum Anzeigen der Forecast-Animation-Frames
  timeoutHandlerForecastAnimation: any;

  // Aktuell angeklickter AirportDataPoint (Feature)
  airportDataPoint: any;

  // Aktuell angeklickter AisDataPoint (Feature)
  aisDataPoint: any;

  // Positionswerte für das Popup zum Anzeigen der
  // AirportData-Informationen
  leftValueAirporteData!: number;
  topValueAirportData!: number;

  // Popup für AirportData-Punkte
  airportDataPopup: any;

  // Popup für AisData-Punkte
  aisDataPopup: any;

  // Bottom-Wert für AirportDataPopup
  // (wenn dieser angezeigt wird, soll dieser auf 10px gesetzt werden)
  airportDataPopupBottomValue: any = 0;

  aisDataPopupBottomValue: any = 0;

  // Layer für Airports
  airportLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für AIS Features
  aisFeatureLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für AIS Labels
  aisLabelFeatureLayer!: VectorLayer<VectorSource<Geometry>>;

  // Layer für AIS Outline (Shape) Features
  aisOutlineFeaturesLayer!: VectorLayer<VectorSource<Geometry>>;

  // Liste an verfügbaren Map-Stilen
  listAvailableMaps: any;

  // API-Key für Geoapify
  geoapifyApiKey: any;

  // API-Key für aisstream.io
  aisstreamApiKeyExists: boolean = false;

  // Aktuell ausgewählter Map-Stil
  currentSelectedMapStyle: any;

  // Boolean, ob Map gedimmt werden soll
  shouldDimMap: boolean = true;

  // Boolean, ob dunkle Range Ringe und dunkles Antenna-Icon gezeigt werden soll
  darkStaticFeatures: boolean = true;

  // Access Token für Cesium Ion für 3d-Komponente
  cesiumIonDefaultAccessToken: any;

  // API-Key für Google Maps
  cesiumGoogleMapsApiKey: any;

  // Boolean, ob Map gerade bewegt wird
  mapIsBeingMoved: boolean = false;

  // Breite der Cesium-Map-Komponente
  cesiumMapWidth: string = '';

  // Boolean, um alle gespeicherten Trails anzuzeigen
  showTrailData: boolean = false;

  // Layer für alle Trails vom Server
  allTrailsLayer: LayerGroup | undefined;

  // Boolean, ob Altitude Chart angezeigt werden soll
  showAltitudeChart: boolean = true;

  // Interval-ID für fetch AIS Funktion
  fetchAisIntervalId: number = 0;

  // Open Sea Map Layer
  openSeaMapLayer: TileLayer<OSM> | undefined;

  // Min-Zoom für Sichtbarkeit der AIS Outlines
  minZoomAisOutlines: number = 11.5;

  static aisSpritesAll: string =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAABuCAYAAACgLRjpAAAc1UlEQVR4nO2de1hU953/3+c2l8MMg8IMaATvCuIYURSVQSDGWAy5CIlpA0ISSmPcXzPb3d/q+qTtb9ttt+262bTNY7bK2g22tE00pk00W9ekNCsmGk1ipMG7Ri4NggFHYG7n8v39MSNhmDOcM0KeGHNezzMPz5zvd158hvPmzLl8v2cAHZ2bHVu1jbdV2yxj5atxVPE1jqox86Wl1/Jp6bVj5nM5Gd7lZMbMV2a28mVm65j5iguMfHGBccx8fGYez2fmjZmv1OTkS01OTT5ak5FmNoNmNo2qqohfSm+mQY+ZD6A3Ywx9FLCZAsbMxwCbmTH0sSw2s+zY+UCzm0GzY/h+6c2MxvVBqXWwVdvMwto7WwGAe/H1DE+9xzea4mocVebywEOtAPCS8YWMHV07R+VLS681B/xrWgHAaHo5o7OtblQ+l5MxLyGOVgA4THVlNDVLo/KVma3mR0ShFQCeZ7mMPb6+UfmKC4zmb/6t1AoAz/6UyWg8GBiVj8/MM7OrNrQCgLj/uQzvqSOj8pWanOavG5a0AsB/Bg9n7PU3j+jTsgWsDCyakhJYNCUFQOVoirvuy/UuSsn1Lhoz30BfbspAX+6Y+aYTS8p0YhkzX54kpORJwpj5luVLKcvypTHzMbMXpzCzF4+Zbyk7NWUpO1WTTzWA4sqlbslugWS3QFy51D3a6u4QVrrtgh12wY47hJWj9gnBYnfQb0fQb4cQLB61z0nGuxMJh0TCwUnGj9p3jyS6HbIEhyzhHkkcte/hdbI7NZUgNZXg4XXyqH1M/kNuyuYAZXOAyX9o1L4y1ul20FY4aCvKWKeqb8QA2qpthcEl07KvPw8umZZtq7YV3mhxNY6qwjz/0kFfnn9pdo2j6oZ9aem1hT7v4kGfz7s4Oy299oZ9LidTOJNYB30ziTXb5WRu2FdmthbmS8KgL18SssvM1hv2FRcYC5cXSoO+5YVSdnGB8YZ9fGZeIZOVP+hjsvKz+cy8G/aVmpyFLm76oM/FTc8uNTlH9I0YQNmZtUmYbh98Lky3Q3Zm3fDOarY0b9N03/TB59N905EtzbthnyTN2eTt+9Tn7ZsOSZpzw750WDalEtPg81RiQjosN+zLleVNMyVx8PlMSUSuLN+wb3kx2TRrljz4fNYsGcuLyQ376MyCTfSEGZ8+nzADdGbBDfvymIxNMxnH4POZjAN5TMaIvpgBtFXbsoLFc0qGLw8WzymxVduy4i2uxlGVVRQojvIVBYpLahxVcfvS0muz/L7CKJ/fV1iSll4bt8/lZLKy5aQoX7acVOJyMnH7yszWrJWSEOVbKQklZWZr3L7iAmPW6tVSlG/1aqmkuMAYt4/PzMticu6K8jE5d5XwmXlx+0pNzqxVXFaUbxWXVVJqcsb0xQwgcaS6g86JUcuDzokgjtS49xXsxOGeO+CMWj53wAk7ccTtIyTF3e+ZG7W83zMXhKTE7UsE584gfNTyDMIjEVzcvomEuG8Xhajlt4sCJhISt2/qNOLOWSBFLc9ZIGHqtPh9lH2qm5k6L2o5M3UeKPvUuH2TKJt7Pjspavl8dhImUbaYPsUA2qptycHVCysJx0S1EY5BcPXCSlu1LVlrcTWOquSvBO6u5AgX1cYRDl8J3F1Z46jS7EtLr032+1ZVEjnaR2QOft+qyrT0Ws0+l5NJziHJlYzCWSkGFHJIcqXLyWj2lZmtyfdLQiUHEtXGgeB+SagsM1s1+4oLjMkPPSxXctFvFxwHPPSwXFlcYNTs4zPzkpll5ZVgFIQMB2ZZeSWfmafZV2pyJpdzt1dyiM4LBwbl3O2VpSanoi/WFrA6uHByQqxfGG6r1loggOqFAwtj+sJtcfkGrsX2hdvi8k2TLTF94ba4fItFIaYv3BaXb8kSKaYv3BaXj5m5KKYv3BaXL4+bEtMXblP0RQXQVm2jhPuKNspWY8zfJluNEO4r2mirtqmeyK5xVFH3BO/faJGsMftYJCvuCd6/scZRpepLS6+lgoG7N4pC7Cs9omBBMHD3xrT0WlWfy8lQuSRlo0nhv/c6JjDIJSkbXU5G1VdmtlJfk8SNViLH7GMlMr4miRvLzFZVX3GBkfrGE/LGxMTorel1EhMJvvGEvLG4wKjq4zPzKGZFzUbKHHt9UGYrmBU1G/nMPFVfqclJreNyN1opU8w+VsqEdVzuxlKTM8qntAWsCC6ZmhpRkCiBEiP3P8J9KtQKBFCx2JsX4RMpESIlRnQK99HkG+hfHFkfLYKiI33hPpp8M4g1wieBQBr28Rnuo8m3TAxGvl9QEId9vIf7aPIVFEgRPkEIPYYS7qPJx2QujfBBEkOPIYT7aPLlc9Mi64MEAZF5CfeJ8rHDF0gFuW5xgi1URHc/DMfb+rkDHzQAgLDy9org/HSLZLdAnGCDVJDrRv0bvx6punxxuXtCMHQwc4XrxnH+/f43DK83AMCK4J0V8705lhTBjgnBicgXl7t3YOeIPlFY5g54JwAADKYr4C3H+42mxgYACPiLK7z98y1BfwoC3gkQE5e5gboRfZkkyT2OGAAA1ygBH1ED/c1UTwMAOMn4iikkwZJIOIwjBmSSJHcTPhnRt1KW3BPl0B+/m2bwLsP172PYBgC4WxIrFkqCxS5LmChLWClL7j3AiL41D8ju2yaFtqZdXRTeeYfpf/klugEA1pTLFYsXSxaHg+C2STLWPCC7Gw+O7KMX3eemx4fWB/F0Qzr/Xr/0zisNAMAsvreCmb7AQtnsoMdPBL3oPjdOHRnRV8JmuW+jk0L1yX04Jrb2vyr8pQEA7uHmVuSyGRYHbcVtdBJK2Cz3XjRH+CL+LW3Vtnzf369tAkvDcPj8MebNo3UAGjz1noFwewKACqlwUW1wyfRciDLMT7/o8tR7DikVV+Ooyv/bgf/bxBIWh01vH2ti36wD0LCja+dAuD0BQIVLLKxd4l+aK1Iifprwb64dXTsVfWnptfn9155sIoSFmT9yjOUO1QFo6GyrGwi3JwCoEIX8Wp83L5eiRFgSf+7qbKtT9LmcTP7dcnoTAwpnqWvHTlJX6wA0NDVLA+H2BAAVWSSpdiZJzJVAsI9uczU1S4q+MrM1/7uCv4kjQBPLHdtPM3UAGvb4+gbC7QkAKlbJUq1LFHIFCvg+Z3Lt8fUp+ooLjPn//jOxieWAN/9MH3vpRboOQEPjwcBAuD0BQEX5Wrm2sEjOFQXg79ysq/FgQNHHZ+blc+t+3ASGg9TSdEx+5+U6AA3eU0cGwu0JACroxWtqmTmuXEgChF/9o8t76oiir9TkzP+BaXUTCwYHxXPH9okn6wA07PU3D4TbEwBU3M1m1RawM3JFSPi2/zXXXn/zoG94AJ8hU6fw1MWPtnnqPe8p/dIhfReQqVMepy5+5PXUe76l1KfGUfXMZHkqf4m+uG1H184RfTWOqgWT5amPX6Ivend07VT0paXXPiPLGTxNt27rbKsb0ZeWXrtAljMep+lWb2dbnaLP5WSescPEd8O/ralZGtHncjIL7DA93g2/t6lZUvSVma3PzCKEP0NR2/b4+kb0lZmtC2YR8vgZivLu8fUp+ooLjM/Mm0/4E8epbY0HAyP6iguMC+bNJ4+fOE55Gw8GFH18Zt4zVMY8nrSe2OY9dWREH5+Zt4DKmPc4aT3h9Z46ougrNTmfyaId/Em5a9tef/OIvlKTc0EW7Xj8pNzl3etvVvTp6Ojo6Ojo6Ojo6Ojo6Ojo6Ojo3JpomhUHIAsAAXDcU++JfVVcAzWOqgjfjq6do/KlpddG+Drb6kblczmZCF9TszQqX5nZGuHb4+sbla+4wBjhazwYGJWPz8yL8HlPHRmVr9TkjPDt9TeP6Iu6FnwdW7VtDsnI2BJcNrtEmjSOAgD2zGVf4vgPd1M9V57y1Hva4imsxlE1J12evGVJYFnJJGESRSiCc9xZ3zj7+N29VM9TO7p2xuVLS6+dI8uTtgT8S0qE4G0UQGAwnvOlThq3m6J6n+psq4vL53Iyc1Jg2jKTJJYkk9Coko8pn8/ivLq7H+JTTc1SXL4ys3XODEK2LBeFknQiUQBwmmZ9DpNldxdFPbXH1xeXr7jAOCd7Htly50qpZPJkQgHAyRbad1u6cXdHG55qPBiIy8dn5s2hJmVvYZzFJZQ9nQIB5I7TvoTxt+0mPR1PeU8dictXanLOmUXbtxSxM0om0+MpAuCU1OlLpay7L5O+p/b6mxV9iltAW7WtSLxr2T5v2QKemCIzSvf5wf/mSDvz9vurPPWeFi3F1TiqilYId+0r85TzRjly2E4f04ff2Rraj7Bvr9rRtVOTLy29tkgI3rGv98oaXpYih42xXB+SUn7XzrJHV3W21WnyuZxM0Twyft9iOZnnhg0Q8kHCIbq7/SzlWdXULGnylZmtRfdJ4r61gp83kcgNQB9Fo95gam+kmVV7fH2afMUFxqKKKnlfRaXIm0yRvmvXKPxnHdu+9w/0qsaDAU0+PjOviMn/6j6uYC0PLnJ9EF8fhDfq2+X3X1vlPXVEk6/U5CwqZ+ft+6pxIW+iIge5XiN+/Jf/cPvr0plVe/3NUb6oANqqbXZpee6FgeplFsIoj1elBAmWf99/mj55JkdtonqNo8ruEgsvrOuttjBEecydQAn4afLTp0/TJ3PUJqqnpdfaRWHZhU8ur7OQGD6KFmBP+9lpmjmTozZR3eVk7Jkk6UKh7LDQMfZIJBDsYzpOd2AgR22iepnZar9Lli7UBLyWWB8vAij8yMSf/oCic9QmqhcXGO1lD8oX1j8hWNgYQkEA/um7htNvH6Jy1Caq85l5dnrR/RcMd9VYQMcYAykJCOz60Wly9nCO2kT1UpPTvprNulBryrewMcY3C5DwA+8fT78nd+QMn6iu9Aq3b82CmOEDQsPyA/cvnA1g9UjFXffdd21NzPABoWH59w2s0ezz9N4XM3xAaFj+QP+9mn2L5eSY4QNCw/Jz5WTNvgeD/pjhA0LD8tcKQc2+hyvEmOEDQsPyK9aJmn2c68HY4QMAhgPnWqvZ95BhYczwAaFh+V81KOcl6lXSkvmF0rjoyTnDCc5OBbE77lLrt0hcUjhOHKfqm+WbjRRiV/WJYm6hEFD3DVybBUKSVX0zSGJhQuxd4UEmEjOs4FR9hbJUOH6E0dDXyZQEpBGi6lt9j1w4frz6ccGcOTImT4Gqj55fUkhZ1P9+9KRMUCmTVX0rmJmF42n1vGSxaZhIJUb5ogIozk03q9rCSItnq665uYJTsy9XzFP1CcFszT5ByFX1pSNBs28GSVT1zZclzT6XLKn6Fi4kmn133Cmr+uhp8zX76OxCVV8OO0mzbzk7PcoXFUCm7RPNh+H0mb+q/qu3sW2afWeZM6o+lm3X7GPZc6q+T6D9NMbHlFfVd4miNftO0rSq7+JFSrOv+QSl6iNdlzT75LYPVX0fST2afS1SZ5QvKoDsgSOHKH/0fNaofh97QJ89f0yt35+4/znkp/2qvo8Nf8V5+oyqjzM0HmIYdZ+R/xg0rV5fM9VzKAj1j8xeKohO+FR9rzLsIR+lenoVf6UZfEjRqr7fNtCHfD51X0c7jWPvUKo+6a0XDpGg+g2w5J6/glx4V9X3snjikI+o56VDvooT8sdRvug9R1nabt7fMnKqCWB65fgnAHar/WIZ8vb/Sdw/oo+AYK/lVU0+QN5uSz6g8l9HYLXt0+QjwPYT9FXV/+J3qR5NPgnY/t+cUeX9Ans4ozafiO2vvsKM7CPACy8w2v5+srRdfPePqn8/8e09Gt8v2b4v+BfV9/tSQDkvUQH01HtauJcbN5gbTyvKKFEG/+oJH/P2+5Wees8nagXu6NrZ8ophz4bGxD8ptouUiH1Jr/qOsG9V7ujaqerrbKtrMRhf3ZCU8mfl+mgR4+z7fCz7TmVnW52qr6lZajlKdW/4kPYotksgeJfu8Z2lPJVNzZKqb4+vr6WB4Ta8zilPaxVB4fcGk6+RZir3+PpUfY0HAy2/2Mps2P9H5d0xUQR272J9e/9AVzYeDKj6vKeOtEiv120QP3hDuYMkQjj8B5/83muV3lNHVH17/c0t9cLRDQeCJ5Xrg4w9geO+A9KZyr3+5ihfzG27rdpWLi2ZvzXompUqpSUCBGAvXoHhrbMt9PEP13vqPQfVihtKjaOqfLG4dOsyvys1TUgDQHDReBFvGw+1nGCOr9/RtTMuX1p6bbkoLtrq9y5LDQZCswJN5oswmg+3MEzz+s62urh8LidTPoMkbs0kttQkhO5p0I0ATlOelktU//qmZikuX5nZWl4kS1sLJSF1ghz6iD9PM/hfhms5QtPr9/j64vIVFxjL775X3rriTjl14sSQ79xZGm+8wbQ0vk6tbzwYiMvHZ+aV0zklW5m5Ran0+AkAIZA7L0D6y5stcsuf13tPHYnLV2pylq9gZm4t5malTqRtICA4L13Bn8WzLW9JH63f629W9I24cxGeeJ6PT6/tvaX16ocS4YnnET6tVz+UCE88j/BpvfqhRHjieYRP69UPJcITzyN8Wq9+KBGeeB7h03r1Q4nwxPMIn9arH0qEJ55H+JSufujo6Ojo6Oh8YZgGDWMHbyGfzk3E7e+/j7b6evwHxmYl3w683wbUj5nvfaCtHmNWn85NxLyWFrQTAhIMQqivxy8wupU8D2hpD506DQpA/ah9LUA7AUgQEOox6vp0biKcLS3oIATk+mOUIXQCLR2h8F1/jCqEzhagY4hMD+EtxNzh4VMIobav+Qr7osMXFcK4fMPDpxDCeHw6NxExwzcshNugbSWPEL6IEGr2xQrfsBBq9encRGSrhW9oCJ9/XnUlZ6uHb2gIn1f1qYVvaAif10P4hWKOUvjOnMEnTU149sMPcTFGCLdDeSXPUQ7fmU+ApmeBDy/GCGFMn1L4zgCfNAHPfghcjBHCWD6dm4gspfBJEoI5Obg33CfP40FQIYTBcAiHTjLIUg6fFARyBn2AJ6gQwmA4hBE+pfBJQDAHQ+oDggohDD6PqPp0bhJoACgvR1piIpRuc06mTsX129EnUVT0F1+wLGA2YzyAwfFHFMrTgERFHzB10AcojfZlAZgjfA8AaYmIUR+G1AeF+gCYEVmfzk3II49gRXs7eoZv4To60HPwIA6cP4/u4W2yjOCuXdgDQGFWyiMrgPae6C1cRw9w8ABwvju6TQ4CuxR9jwAr2oGe4Vu4DqDnIHDgPNA9vE0GgrsQqz6dm45HH8UdSiFUeoTD9xJGXLmP3qEcQqWHHAR2jeh7FLhDKYRKj3D4VOrTuenQEkJt4Rs0agihevgGbRpCqIfvC85jj6E4VgjD4duNuFbuY8WxQygHgV1x+R4DimOFMBy+OOvTuel47DEUDQ+hLCOwe/eNrtzHiqJDKAeA3TfkewwoGh5CGQjs1sN36zA0hOHw7QIQ80vpNBiLPg2hHAB2j8o3NITh8I2yPp2bjpoaFLa24vLowzdoLARaL482fIM2oLAVuKyH79ZmMcZ25d7sPh0dHZ1I/g4ASQftR+iKw99/zvXofMk4/gAS+zxwdT6AxD4AJz7vgnS+PBgA+PZjroegiBzA3KsA/NBPd+iMEq3DlNIBmKaDFwAg/NMIYMpnVJfOlwStATQCgB0GFgDSYFS/paiOjgbiGqhpROjmiyPdT1lHJx70kcI6nytaAjgPwC9jtP0KwMKxK0dH51M4AN8FEAQg7MCMTgmFfoIiIqHQ/yvM7AQghtu/H+6vozMm5AB4DwApQ2LvOSzuJCgiwx/nsfjjSoy7htCJ6ffCr9PR0czwowkDgG8D2ASA/TVmdT+INJsBtNJ8DABAELJ/Fzo9lThjR2iL+BMAP0Boy6ijMyJDA5gLoB7AnIeRdO2fMcs/DbxDq+gCvF3fwRnTb3A1EUALgFoAb41tuTq3GhRC+24/APAtANQuZPbeh9QEDhQPQPZA9FyA1yCD0DOQQGxg+WsQB85igKZBydPAB21gbQBoAcT7B1weeBCnkhA6wHkWwGaErpro6ChyEgBZh3G9l5B3WUCh9xQWXdmNzN6vIekqQvt3BAA5ihwfQRE5ihzf0OUPwnb1BczuaUFut4BCbweW9HwDKT3h9ubP643pfDGQnoSj5ffI6tiMCV0JoK6PdgkAeBOhfcL5AM4MC+BlALcD2Bju5wNAEkD5/xETrvweWa1/A/spANLn8aZ0vjjI+HRrdg7AVoTuNpA4rF/LfsztJigir8N5BaH9vKFYw6/7Wdhz3an+NUQ6X1pYhE4yvwPgAIBLiB2YqwLkFADwQ5IB9A9r7wPwSvjxLQCTAaxEaLSyjo4iLICva+w7/KuERvoWHRnARYTuybL9BurS+ZIQ17XgqxATAMALSb/Pis6YEE8AewkIDQAByAbop1Z0xgCtAWQBTB22bDaAlLEtR+fLhpYAMgD+C8ASC1gBAFJhHEDo+8D2A0j6zKrT0QHwcwBkNRJaT2NRVxeWeS4hz7MJaWcQOs2yH/qcXJ3PiL/Bp+fzBABkHKhg+Ll/SNuvP7cKdb7QqH0EDx1e1QLg3V4QDsBhAIfw6R1JF3wGtenoRPHU84mJ3SsZ5vefdyE6tyYLGeBfAIxTaEv6Mc+3HXc4yG9ttj4AhTEcdzDAj6B/W5GOBoZ/BE/7qcXy8AMsuxdA6rC21QvNZgsAzDYamYlAiYLvwR/yfH2twXA/9ADqaGB4AHd9s7//uQKTadIjHPdHAJOuN4wDZtkZJjH8IvMjJtPcYa99dEtCwpYOUfT8IhhcC30Qgo4GlA5C/tXd3/+v2QaD9RsGw34A0wGgwmCYPbS/nWEW4NOt3P95OiHhO6eCQc9zweD90McA6mgk1lHw1n8YGPjnySzLPWk07gcw9zaWnTy0QwrLjkdoX3Hzzy2Wf3g3EOjeIQilCA3F0tHRhNp+WvkPef7ZXknqn8Jx41w8P3jprVUQrny9t/fQ96zWpY0+3/kXRXENQoNUdXQ0o+VAYdX3zOZt91qtk6ghX3clEuI7Lwhdv+7ru/CqJJUD6P3sytS5VVE7ET0FQMYVSfJQw75rjaUos0+W+b2S9A6ADOhHvTo3gGJoaKDs22bzt2caDFMmc5wxkaZj3gcwQEigQxDks8Fg52t+f8Obsvydz65cnVsNxdusPcZxy8usVk13OTBSlHGawYBpBsNUnqbXvNnfrwdQRzOKAfyNIJyZ6/WeczCMbTLHJSSMsAUUCBn4qyiSVkG4djQQ+OCzK1XnVkRtv20WgIeftVjcBTyfNLwxQMiV5d3dlwLAkwCOIjRiRkdHM2oHIQMVLLuaAL6f9PQclYcMw3+pr+/olt7e809bLBMcwD0I3RdGR2fMmL6O444+nZBwCcA3AXy1MTn56nGHgxx3OMg9DPMcAOtqhjnwnNV6YWJoPrB+616dMWHOkwbDqX/h+dMAHgkvm7U7Kclz3OEgx+z2fgDu8HJTPk2/vN1qvZRDUb+EHkKdUbLgW0bjuR/yfDuAtUOWW7ZZrVePOxzkT8nJVwE8MKTNuIiifrsjMfHyYprehfBNzXV04mXhRpPp3PfM5lYAq4c3/pjnjxx3OMiLSUkeADOHNbO3U9Qv66zW1rsY5jXoJ6Z1NDD8IGR6hyj2/D+frwrAa8M7fyxJrQDQI0kcQrfxGIr4ASFf/35//++SKOo2BbeOzujIpKh/Ou5wyD/hef3GkzpjQlxbqVOEXPETEuyQpPbPqiCdLxdajlifAEB9hWEmZbNsgUQIO46mMzcYDP/xXDB4EYAJobvk6+jEjeqBwhMGwy8fsdnWGCnKNry/SMjAGwMDH2/yeocfkOjoaEJ1C0gA+bDPFxzPMP0OhmHsLMv1StJAjyQx7YIgeQnRz/vpfKasRegWvBMA3JVH0+cArAcwDcB3oN//T2cU/H8SmD8+LrQaXgAAAABJRU5ErkJggg==';

  private ngUnsubscribe = new Subject<void>();

  // Boolean, um große Info-Box beim Klick anzuzeigen (in Globals, da ein
  // Klick auf das "X" in der Komponente die Komponente wieder ausgeblendet
  // werden soll und der Aufruf aus der Info-Komponente geschehen soll)
  get displayAircraftInfo() {
    return Globals.displayAircraftInfoLarge;
  }

  // Boolean, um 3d-Map anzuzeigen (in Globals, da ein
  // Klick auf das "X" in der Komponente die Komponente wieder ausgeblendet
  // werden soll und der Aufruf aus der 3d-Map-Komponente geschehen soll)
  get display3dMap() {
    return Globals.display3dMap;
  }

  constructor(
    private serverService: ServerService,
    private titleService: Title,
    public breakpointObserver: BreakpointObserver,
    private settingsService: SettingsService,
    private toolbarService: ToolbarService,
    private aircraftTableService: AircraftTableService,
    private snackBar: MatSnackBar,
    private rainviewerService: RainviewerService,
    private cesiumService: CesiumService
  ) {}

  /**
   * Einstiegspunkt
   */
  ngOnInit(): void {
    // Initiiere Default-Settings
    Storage.setDefaultSettingsValues();

    // Hole Konfiguration vom Server, wenn diese nicht vorhanden ist, breche ab
    this.getConfiguration();
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Holt die Konfiguration vom Server und intialisiert wichtige
   * Variable wie anzuzeigende Position. Wenn alle erforderlichen
   * Variablen vorhanden und gesetzt sind, starte das eigentliche
   * Programm
   */
  private getConfiguration() {
    this.serverService
      .getConfigurationData()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (configuration) => this.setConfigurationValues(configuration),
        (error) => {
          console.error(
            'Configuration could not be loaded. Is the server online? Program will not be executed further.'
          );
          this.infoConfigurationFailureMessage =
            'Configuration could not be loaded. Is the server online? Program will not be executed further.';
        },
        () =>
          // Überprüfe gesetzte Werte, WebGl-Support und starte Programm
          this.startProgramOrThrowError()
      );
  }

  private setConfigurationValues(configuration: any) {
    // Setze Werte aus Konfiguration
    Globals.latFeeder = configuration.latFeeder;
    Globals.lonFeeder = configuration.lonFeeder;
    Globals.globalScaleFactorIcons = configuration.scaleIcons;
    Globals.smallScaleFactorIcons = configuration.smallScaleIcons;

    // Setze App-Daten (App-Name, App-Version, App-Stage (dev/Master) und App-Buildtime
    Globals.appName = configuration.appName;
    Globals.appVersion = configuration.appVersion;
    Globals.appStage = configuration.appStage;
    Globals.appBuildTime = configuration.appBuildTime;

    // Setze SitePosition aus neu zugewiesenen Werten
    Globals.SitePosition = [Globals.lonFeeder, Globals.latFeeder];

    // Setze shapesMap, catMap, typesMap
    Globals.shapesMap = configuration.shapesMap;
    Globals.catMap = configuration.catMap;
    Globals.typesMap = configuration.typesMap;

    // Setze IP-Adresse des Clients
    Globals.clientIp = configuration.clientIp;

    // Setze Boolean, ob Opensky-Credentials vorhanden sind
    Globals.openskyCredentials = configuration.openskyCredentials;

    // Konvertiere circleDistancesInNm aus JSON richtig in Array
    if (configuration.circleDistancesInNm) {
      this.circleDistancesInNm = [];

      let jsonArray: number[] = configuration.circleDistancesInNm;
      for (let i = 0; i < jsonArray.length; i++) {
        this.circleDistancesInNm[i] = jsonArray[i];
      }
    }

    // Erstelle Feeder aus Konfiguration, damit Farbe in Statistiken richtig gesetzt wird
    if (configuration.listFeeder) {
      this.listFeeder = [];
      for (let i = 0; i < configuration.listFeeder.length; i++) {
        this.listFeeder.push(
          new Feeder(
            configuration.listFeeder[i].name,
            configuration.listFeeder[i].type,
            configuration.listFeeder[i].color
          )
        );
      }
      this.selectedFeederUpdate = this.listFeeder.map((f) => f.name);
      this.selectedFeederRangeData = this.listFeeder.map((f) => f.name);
    }

    // Setze Geoapify-API-Key (nicht mandatory)
    if (configuration.geoapifyApiKey) {
      this.geoapifyApiKey = configuration.geoapifyApiKey;
    }

    // Setze Cesium Ion-Default Access Token (nicht mandatory)
    if (configuration.cesiumIonDefaultAccessToken) {
      this.cesiumIonDefaultAccessToken =
        configuration.cesiumIonDefaultAccessToken;
    }

    // Setze Cesium.GoogleMaps-API-Key (nicht mandatory)
    if (configuration.cesiumGoogleMapsApiKey) {
      this.cesiumGoogleMapsApiKey = configuration.cesiumGoogleMapsApiKey;
    }

    // Setze aisstream-API-Key (nicht mandatory)
    if (configuration.aisstreamApiKeyExist) {
      this.aisstreamApiKeyExists = configuration.aisstreamApiKeyExist;
    }

    if (localStorage.getItem('globalIconSize') == null) {
      Storage.savePropertyInLocalStorage(
        'globalIconSize',
        Globals.globalScaleFactorIcons
      );
    }

    Globals.defaultGlobalScaleFactorIcons = Globals.globalScaleFactorIcons;

    if (localStorage.getItem('smallIconSize') == null) {
      Storage.savePropertyInLocalStorage(
        'smallIconSize',
        Globals.smallScaleFactorIcons
      );
    }

    Globals.defaultSmallScaleFactorIcons = Globals.smallScaleFactorIcons;
  }

  private startProgramOrThrowError() {
    if (
      (Globals.latFeeder,
      Globals.lonFeeder,
      Globals.globalScaleFactorIcons,
      Globals.SitePosition,
      Globals.appName,
      Globals.appVersion,
      Globals.appStage,
      Globals.appBuildTime,
      this.circleDistancesInNm.length != 0,
      this.listFeeder.length != 0,
      Globals.shapesMap,
      Globals.catMap,
      Globals.typesMap,
      Globals.clientIp,
      this.browserSupportsWebGl())
    ) {
      this.startProgram();
    } else {
      this.infoConfigurationFailureMessage =
        'Configuration could not be loaded. Is the server online? Program will not be executed further.';
    }
  }

  private startProgram() {
    this.initSubscriptions();
    this.initDarkMode();
    this.initMap();
    this.initBreakPointObserver();
    this.initWebglOnStartup();
    if (!Globals.webgl) return;
    this.initAircraftFetching();
    this.fetchAircraftAfterMapMove();
    this.initClickOnMap();
    this.initHoverOverAircraftIcon();
    this.sendInitialSettingsToSettings();
  }

  private initSubscriptions() {
    this.initRangeDataSubscriptions();
    this.initDataAndVisibilitySubscriptions();
    this.initMapToggleSubscriptions();
    this.initWeatherSubscriptions();
    this.initHistorySubscriptions();
  }

  private initHistorySubscriptions() {
    // Zeige oder verstecke alle Trails auf der Karte
    this.settingsService.showTrailDataSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showTrailData) => this.toggleShowTrailData(showTrailData));
  }

  private initMapToggleSubscriptions() {
    // Toggle zeige Flugzeug-Labels
    this.settingsService.toggleShowAircraftLabels$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAircraftLabel) =>
        this.toggleShowAircraftLabels(showAircraftLabel)
      );

    // Toggle Flughäfen auf der Karte
    this.settingsService.showAirportsUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAirportsUpdate) =>
        this.toggleAirportsUpdate(showAirportsUpdate)
      );

    // Zeige nur militärische Flugzeuge an
    this.settingsService.showOnlyMilitaryPlanesSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showMilitaryPlanes) =>
        this.toggleShowMilitaryPlanes(showMilitaryPlanes)
      );

    // Toggle DarkMode
    this.settingsService.showDarkMode$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showDarkMode) => this.toggleDarkMode(showDarkMode));

    // Toggle POMD-Point
    this.settingsService.showPOMDPoint$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showPOMDPoint) => this.toggleShowPOMDPoints(showPOMDPoint));

    // Toggle WebGL
    this.settingsService.useWebgl$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((webgl) => this.toggleWebGl(webgl));

    // Zentriere Karte auf die ISS oder gehe zur vorherigen Position zurück
    this.settingsService.centerMapOnIssSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((centerMapOnIss) => this.toggleCenterMapOnIss(centerMapOnIss));

    // Bestimme aktuellen Geräte-Standort
    this.settingsService.setCurrentDevicePositionSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((setDevicePosition) =>
        this.toggleSetCurrentDevicePosition(setDevicePosition)
      );

    // Toggle Geräte-Standort als Basis für versch. Berechnungen (Zentrum für Range-Ringe,
    // Distance- und POMD-Feature-Berechnungen (default: Site-Position ist Zentrum der Range-Ringe)
    this.settingsService.devicePositionAsBasisSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((devicePositionAsBasis) =>
        this.toggleDevicePositionAsBasis(devicePositionAsBasis)
      );

    // Toggle zeige/verstecke Flugzeug-Positionen
    this.settingsService.toggleShowAircraftPositions$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAircraftPositions) =>
        this.toggleShowAircraftPositions(showAircraftPositions)
      );

    // Callback für anderen Map-Stil
    this.settingsService.selectMapStyleSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedMapStyle) => this.setMapStyle(selectedMapStyle));

    // Toggle dimme Map
    this.settingsService.dimMapSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((dimMap) => this.toggleDimMap(dimMap));

    // Toggle dunkle Range Ringe und dunkles Antenna-Icon
    this.settingsService.darkStaticFeaturesSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((darkStaticFeatures) =>
        this.toggleDarkStaticFeatures(darkStaticFeatures)
      );

    // Setze Global icon size der Planes
    this.settingsService.setIconGlobalSizeSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((globalIconSizeFactor) =>
        this.setGlobalIconSize(globalIconSizeFactor)
      );

    // Setze icon size für small Planes
    this.settingsService.setIconSmallSizeSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((smallIconSizeFactor) =>
        this.setSmallIconSize(smallIconSizeFactor)
      );

    // Zeige oder verstecke Altitude-Chart
    this.settingsService.showAltitudeChartSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAltitudeChart) =>
        this.showHideAltitudeChartElement(showAltitudeChart)
      );

    // Setze Min-Zoom für AIS Outlines
    this.settingsService.aisOutlineMinZoomSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (minZoomAisOutlines) => (this.minZoomAisOutlines = minZoomAisOutlines)
      );
  }

  private initWeatherSubscriptions() {
    // Toggle Rainviewer (Rain)
    this.settingsService.rainViewerRain$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showRainViewerRain) =>
        this.createOrHideRainViewerRain(showRainViewerRain)
      );

    // Toggle Rainviewer (Clouds)
    this.settingsService.rainViewerClouds$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showRainViewerClouds) =>
        this.createOrHideRainViewerClouds(showRainViewerClouds)
      );

    // Toggle Rainviewer Forecast (Rain)
    this.settingsService.rainViewerRainForecast$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showRainViewerRainForecast) => {
        this.showRainViewerRainForecast = showRainViewerRainForecast;
        this.createOrHideRainViewerRain(this.showRainViewerRain);
      });
  }

  private initDataAndVisibilitySubscriptions() {
    // Filtere Range-Data nach selektiertem Feeder
    this.settingsService.selectedFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedFeederArray) =>
        this.filterRangeDataBySelectedFeeder(selectedFeederArray)
      );

    // Markiere/Entmarkiere ein Flugzeug, wenn es in der Tabelle ausgewählt wurde
    this.aircraftTableService.hexMarkUnmarkAircraft$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((hexMarkUnmarkAircraft) =>
        this.markUnmarkAircraftFromAircraftTable(hexMarkUnmarkAircraft)
      );

    // Zeige Flugzeuge nach selektiertem Feeder an
    this.settingsService.selectedFeederUpdate$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((selectedFeederUpdate) =>
        this.showAircraftFromFeeder(selectedFeederUpdate)
      );

    // Zeige Opensky Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showOpenskyPlanes$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showOpenskyPlanes) =>
        this.toggleOpenSkyPlanes(showOpenskyPlanes)
      );

    // Zeige Airplanes-Live Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showAirplanesLivePlanesSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAirplanesLivePlanes) =>
        this.toggleAirplanesLivePlanes(showAirplanesLivePlanes)
      );

    // AIS-Daten
    this.settingsService.showAisDataSourceSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showAisData) => this.toggleAisData(showAisData));

    // Zeige ISS und Remote Flugzeuge und Flugzeuge nach selektiertem Feeder an
    this.settingsService.showISS$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((showIss) => this.toggleIss(showIss));
  }

  private initRangeDataSubscriptions() {
    // Zeige Range-Data zwischen Zeitstempeln
    this.settingsService.timesAsTimestamps$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((timesAsTimestamps) =>
        this.showCustomRangeData(timesAsTimestamps)
      );

    // Toggle verstecke Range-Data
    this.settingsService.toggleHideRangeData$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleHideRangeData) =>
        this.toggleRangeData(toggleHideRangeData)
      );

    // Toggle markiere Range-Data nach Feeder
    this.settingsService.toggleMarkRangeDataByFeeder$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleMarkRangeDataByFeeder) =>
        this.toggleFilterRangeDataByFeeder(toggleMarkRangeDataByFeeder)
      );

    // Toggle markiere Range-Data nach Höhe
    this.settingsService.toggleMarkRangeDataByHeight$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((toggleMarkRangeDataByHeight) =>
        this.toggleFilterRangeDataByHeight(toggleMarkRangeDataByHeight)
      );
  }

  /**
   * Initialisiert die Karte mit RangeRingen,
   * Feeder-Position und Layern
   */
  private initMap(): void {
    this.createBaseLayer();
    this.createLayers();
    this.createBaseMap();
    this.createRangeRingsAndSitePos(Globals.SitePosition);
  }

  /**
   * Erstellt den Basis OSM-Layer
   */
  private createBaseLayer() {
    this.currentSelectedMapStyle = this.getMapStyleFromLocalStorage();

    if (this.layers == undefined) this.layers = new Collection();
    if (this.layers.getLength() > 0) this.layers.removeAt(0);
    if (this.openSeaMapLayer) {
      this.layers.remove(this.openSeaMapLayer);
      this.openSeaMapLayer = undefined;
    }

    this.osmLayer = this.createSelectedMapLayer(1.0);
    this.layers.insertAt(0, this.osmLayer);

    if (this.currentSelectedMapStyle.name == 'OSM OpenSeaMap')
      this.createOpenSeaMapLayer();

    this.dimMapIfNecessary();
  }

  private createOpenSeaMapLayer() {
    this.layers.removeAt(0);

    this.osmLayer = new TileLayer({
      source: new OSM(),
    });
    this.openSeaMapLayer = this.createSelectedMapLayer(0.9);

    this.layers.insertAt(0, this.osmLayer);
    this.layers.insertAt(1, this.openSeaMapLayer);
  }

  private createSelectedMapLayer(opacity: number) {
    return new TileLayer({
      source: new OSM({
        url: this.currentSelectedMapStyle.url,
        attributions: this.currentSelectedMapStyle.attribution,
      }),
      preload: 0,
      useInterimTilesOnError: false,
      opacity: opacity,
    });
  }

  /**
   * Beobachtet den Modus der Anwendung (Desktop/Mobile)
   * und setzt die Variable isDesktop entsprechend
   */
  private initBreakPointObserver() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isDesktop = false; // Mobile
          this.cesiumMapWidth = '100vw';
        } else {
          this.isDesktop = true; // Desktop
          this.cesiumMapWidth = '40rem';
        }

        this.aircraftTableService.updateWindowMode(this.isDesktop);
        this.showHideAltitudeChartElement(this.showAltitudeChart);
      });
  }

  /**
   * Initialisiert den Dark- oder Light-Modus und setzt die ent-
   * sprechende Variable. Auch ein Listener wird initialisiert, damit
   * der Modus gewechselt wird, wenn das System-Theme geändert wird
   */
  private initDarkMode() {
    // Detekte dunklen Modus und setze Variable initial
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? (this.darkMode = true)
      : (this.darkMode = false);

    // Initialisiere Listener, um auf System-Veränderungen reagieren zu können
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (event) => (this.darkMode = event.matches));

    // Setze default-Value für darkMode
    Storage.savePropertyInLocalStorage(
      'darkMode',
      Storage.getPropertyFromLocalStorage('darkMode', this.darkMode)
    );
  }

  /**
   * Erstellt die Entfernungs-Ringe sowie die
   * Anzeige der Feeder-Postion (Default-Zentrum: Site-Position)
   */
  private createRangeRingsAndSitePos(lonLatPosition: []) {
    if (lonLatPosition === null) return;

    this.StaticFeatures.clear();
    this.createRangeRings(lonLatPosition);
    this.createSitePosition();
  }

  private createSitePosition() {
    const antennaStyle = new Style({
      image: new Icon({
        src: this.darkStaticFeatures
          ? '../../assets/antenna.svg'
          : '../../assets/antenna_dark.svg',
        offset: [0, 0],
        opacity: 1,
        scale: 0.7,
      }),
    });

    const feature = new Feature(
      new Point(olProj.fromLonLat(Globals.SitePosition))
    );
    feature.setStyle(antennaStyle);
    this.StaticFeatures.addFeature(feature);

    // Erstelle Feature für den aktuellen Geräte-Standort
    this.drawDevicePositionFromLocalStorage();
  }

  private createRangeRings(lonLatPosition) {
    for (let i = 0; i < this.circleDistancesInNm.length; i++) {
      const conversionFactor = 1852.0; // nautical
      const distance = this.circleDistancesInNm[i] * conversionFactor;
      const circle = Helper.makeGeodesicCircle(lonLatPosition, distance, 180);
      circle.transform('EPSG:4326', 'EPSG:3857');
      const featureCircle = new Feature(circle);

      // Style des Rings
      let circleStyle = new Style({
        stroke: new Stroke({
          color: this.darkStaticFeatures ? 'black' : 'white',
          width: this.darkStaticFeatures ? 1 : 0.4,
        }),
        text: new Text({
          font: '10px Roboto',
          fill: new Fill({
            color: this.darkStaticFeatures ? 'black' : 'white',
          }),
          offsetY: -8,
          text: this.circleDistancesInNm[i] + ' nm',
        }),
      });

      // Fuege Ring zu StaticFeatures hinzu
      featureCircle.setStyle(circleStyle);
      this.StaticFeatures.addFeature(featureCircle);
    }
  }

  /**
   * Erstellt die Map mit der aktuellen Feeder-Position
   * als Mittelpunkt
   */
  private createBaseMap() {
    // Verhindere Rotation beim Pinch to Zoom-Gesten
    const interactions = olInteraction.defaults({
      altShiftDragRotate: false,
      pinchRotate: false,
    });

    // Erstelle Maßstabs-Anzeige mit nautischen Meilen
    const control = new ScaleLine({
      units: 'nautical',
    });

    // Erstelle eingeklappte Attribution
    const attribution: Attribution = new Attribution({
      collapsible: true,
      collapsed: true,
      tipLabel:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>  contributors.',
    });

    this.createOLMap(interactions, control, attribution);
  }

  private createOLMap(
    interactions: Collection<olInteraction.Interaction>,
    control: ScaleLine,
    attribution: Attribution
  ) {
    let center, zoom;

    let lastCenterPosition = Storage.getPropertyFromLocalStorage(
      'lastCenterPosition',
      undefined
    );
    if (lastCenterPosition)
      lastCenterPosition = olProj.fromLonLat(lastCenterPosition);

    const lastCenterZoomLevel = Storage.getPropertyFromLocalStorage(
      'lastCenterZoomLevel',
      undefined
    );

    if (lastCenterPosition && lastCenterZoomLevel) {
      center = lastCenterPosition;
      zoom = lastCenterZoomLevel;
    } else {
      center = olProj.fromLonLat(Globals.SitePosition);
      zoom = Globals.zoomLevel;
    }

    this.OLMap = new Map({
      interactions: interactions,
      controls: defaultControls({ attribution: false }).extend([
        control,
        attribution,
      ]),
      target: 'map_canvas',
      layers: this.layers,
      maxTilesLoading: 16,
      view: new View({
        center: center,
        zoom: zoom,
        multiWorld: true,
      }),
    });
  }

  private createVectorLayer(
    source: Vector<Geometry>,
    zIndex: number,
    declutter: boolean,
    renderBuffer: number | undefined,
    tags: {},
    style?: StyleLike | null | undefined,
    minZoom?: number | undefined
  ): VectorLayer<Vector<Geometry>> {
    const layer = new VectorLayer({
      source: source,
      zIndex: zIndex,
      declutter: declutter,
      renderBuffer: renderBuffer,
      style: style,
      minZoom: minZoom,
    });

    return this.addTagsToLayer(layer, tags);
  }

  private createLayerGroup(
    layers: BaseLayer[] | Collection<BaseLayer> | undefined,
    zIndex: number | undefined,
    tags: {}
  ) {
    const layerGroup = new LayerGroup({
      layers: layers,
      zIndex: zIndex,
    });

    return this.addTagsToLayer(layerGroup, tags);
  }

  private addTagsToLayer(layer: any, tags: {}): any {
    if (!tags) return layer;

    for (const key in tags) {
      if (tags.hasOwnProperty(key)) layer.set(key, tags[key]);
    }
    return layer;
  }

  /**
   * Erstellt die einzelnen Layer für die Maps
   */
  private createLayers() {
    const renderBuffer = 80;

    // Fuege Layer fuer Plane-Label-Features hinzu
    this.planeLabelFeatureLayer = this.createVectorLayer(
      this.PlaneLabelFeatures,
      200,
      false,
      renderBuffer,
      { name: 'plane_labels', type: 'overlay', title: 'plane labels' },
      this.planeLabelStyle
    );
    this.layers.push(this.planeLabelFeatureLayer);

    // Erstelle Layer fuer Trails der Flugzeuge als Layer-Group
    const trailLayers = this.createLayerGroup(Globals.trailGroup, 150, {
      name: 'ac_trail',
      type: 'overlay',
      title: 'aircraft trails',
    });
    this.layers.push(trailLayers);

    // Fuege Layer fuer POMDs hinzu
    const pomdLayer = this.createVectorLayer(
      Globals.POMDFeatures,
      130,
      false,
      renderBuffer,
      { name: 'pomd_positions', type: 'overlay', title: 'POMD positions' },
      undefined
    );
    this.layers.push(pomdLayer);

    // Fuege Layer fuer Linie vom Zielort zum Flugzeug und vom Flugzeug zum Herkunftsort hinzu
    const routeLayer = this.createVectorLayer(
      this.RouteFeatures,
      125,
      false,
      renderBuffer,
      { name: 'ac_route', type: 'overlay' },
      new Style({
        stroke: new Stroke({
          color: '#EAE911',
          width: 2,
          lineDash: [0.2, 5],
        }),
      })
    );
    this.layers.push(routeLayer);

    // Fuege Layer zum Zeichnen der Geräte-Position hinzu
    this.drawLayer = this.createVectorLayer(
      this.DrawFeature,
      110,
      false,
      renderBuffer,
      { name: 'device_position', type: 'overlay' },
      new Style({})
    );
    this.layers.push(this.drawLayer);

    // Fuege Layer fuer Range-Ringe und Feeder-Position hinzu
    const staticFeaturesLayer = this.createVectorLayer(
      this.StaticFeatures,
      100,
      false,
      renderBuffer,
      {
        name: 'site_pos',
        type: 'overlay',
        title: 'site position and range rings',
      },
      undefined
    );
    this.layers.push(staticFeaturesLayer);

    // Fuege Layer fuer Range Data hinzu
    this.rangeDataLayer = this.createVectorLayer(
      this.RangeDataFeatures,
      50,
      false,
      renderBuffer,
      { name: 'range_data', type: 'overlay' },
      undefined
    );
    this.layers.push(this.rangeDataLayer);

    // Fuege Layer fuer Icons der Flughäfen hinzu
    this.airportLayer = this.createVectorLayer(
      this.AirportFeatures,
      10,
      false,
      renderBuffer,
      { name: 'ap_positions', type: 'overlay', title: 'airport positions' },
      undefined
    );
    this.layers.push(this.airportLayer);

    // Fuege Layer fuer AIS-Label-Features hinzu
    this.aisLabelFeatureLayer = this.createVectorLayer(
      this.AisLabelFeatures,
      25,
      true,
      renderBuffer,
      { name: 'ais_labels', type: 'overlay', title: 'ais labels' },
      this.aisLabelStyle
    );
    this.layers.push(this.aisLabelFeatureLayer);

    // Fuege Layer fuer AIS-Features hinzu
    this.aisFeatureLayer = this.createVectorLayer(
      this.AisFeatures,
      20,
      false,
      renderBuffer,
      { name: 'ais_positions', type: 'overlay', title: 'ais positions' },
      this.aisMarkerStyle
    );
    this.layers.push(this.aisFeatureLayer);

    // Fuege Layer fuer AIS-Outline-Features hinzu
    this.aisOutlineFeaturesLayer = this.createVectorLayer(
      this.AisOutlineFeatures,
      15,
      false,
      renderBuffer,
      {
        name: 'ais_outline_positions',
        type: 'overlay',
        title: 'ais outline positions',
      },
      this.aisOutlineStyleFunction,
      this.minZoomAisOutlines
    );
    this.layers.push(this.aisOutlineFeaturesLayer);
  }

  private planeLabelStyle(feature): Style {
    return new Style({
      text: new Text({
        font: 'bold 10px Roboto',
        text: feature.flightId,
        overflow: false,
        offsetY: feature.offsetY,
        offsetX: feature.offsetX,
        stroke: new Stroke({
          color: 'black',
          width: 4,
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    });
  }

  private aisLabelStyle(feature): Style {
    return new Style({
      text: new Text({
        font: 'bold 10px Roboto',
        text: feature.ship.shipName || feature.ship.mmsi.toString(),
        overflow: false,
        offsetY: 25,
        offsetX: 25,
        stroke: new Stroke({
          color: 'black',
          width: 4,
        }),
        fill: new Fill({
          color: 'white',
        }),
      }),
    });
  }

  private aisMarkerStyle(feature): Style {
    const length = (feature.ship.to_bow || 0) + (feature.ship.to_stern || 0);
    const mult =
      length >= 100 && length <= 200 ? 0.9 : length > 200 ? 1.1 : 0.75;

    return new Style({
      image: new Icon({
        src: MapComponent.aisSpritesAll,
        rotation: feature.ship.rot,
        offset: [feature.ship.cx, feature.ship.cy],
        size: [feature.ship.imgSize, feature.ship.imgSize],
        scale: 1 * mult,
        opacity: 1,
      }),
    });
  }

  private aisOutlineStyleFunction(feature): Style {
    const c = '#808080';
    const o = 0.9;

    return new Style({
      fill: new Fill({
        color: `rgba(${parseInt(c.slice(-6, -4), 16)}, ${parseInt(
          c.slice(-4, -2),
          16
        )}, ${parseInt(c.slice(-2), 16)}, ${o})`,
      }),
      stroke: new Stroke({
        color: '#A9A9A9',
        width: 2,
      }),
    });
  }

  /**
   * Initialisiert WebGL beim Start der Anwendung,
   * wenn WebGL vom Browser unterstützt wird
   */
  private initWebglOnStartup() {
    Globals.webgl = this.initWebgl();
    if (!Globals.webgl)
      this.showErrorLogAndSnackBar(
        'WebGL could not be initialized. If this browser does not support WebGL use another browser.'
      );
  }

  /**
   * Prüfe WebGL-Support des Browsers
   */
  browserSupportsWebGl() {
    return Helper.detectWebGL() == 1;
  }

  /**
   * Initialisiert den WebGL-Layer. Sollte die Initialisierung
   * fehlschlagen, wird false zurückgegeben
   */
  private initWebgl() {
    let initSuccessful = false;

    if (Globals.webgl) {
      if (this.webglLayer) {
        return true;
      } else {
        // Versuche WebGL-Layer hinzuzufügen
        initSuccessful = this.addWebglLayer();
      }
    }

    return initSuccessful;
  }

  /**
   * Fügt den WebGL-Layer zu den Layers hinzu.
   * Sollte ein Error auftreten, wird der Layer
   * wieder entfernt.
   * @returns boolean, wenn Initialisierung
   *          erfolgreich war
   */
  private addWebglLayer(): boolean {
    let success = false;

    try {
      // Definiere WebGL-Style
      let glStyle = {
        symbol: {
          symbolType: 'image',
          src: '../../../assets/beluga_sprites.png',
          size: ['get', 'size'],
          offset: [0, 0],
          textureCoord: [
            'array',
            ['get', 'cx'],
            ['get', 'cy'],
            ['get', 'dx'],
            ['get', 'dy'],
          ],
          color: ['color', ['get', 'r'], ['get', 'g'], ['get', 'b'], 1],
          rotateWithView: false,
          rotation: ['get', 'rotation'],
        },
      };

      // Erstelle WebGL-Layer
      this.webglLayer = this.createWebGlPointsLayer(glStyle);

      // Wenn Layer oder Renderer nicht vorhanden ist, returne false
      if (!this.webglLayer || !this.webglLayer.getRenderer()) return false;

      this.webglLayer.set('name', 'webgl_ac_positions');
      this.webglLayer.set('type', 'overlay');
      this.webglLayer.set('title', 'WebGL Aircraft positions');

      // Füge WebGL-Layer zu den Layern hinzu
      this.layers.push(this.webglLayer);

      this.OLMap.renderSync();

      success = true;
    } catch (error) {
      try {
        // Bei Error entferne WebGL-Layer von den Layern
        this.layers.remove(this.webglLayer);
      } catch (error) {
        console.error(error);
      }

      console.error(error);
      success = false;
    }

    return success;
  }

  private createWebGlPointsLayer(
    glStyle: LiteralStyle
  ): WebGLPoints<Vector<Point>> {
    return new WebGLPointsLayer({
      source: Globals.WebglFeatures,
      zIndex: 200,
      style: glStyle,
    });
  }

  /**
   * Initialisieren der Auto-Fetch Methoden mit Intervall
   */
  private initAircraftFetching() {
    // Entfernen aller nicht geupdateten Flugzeuge alle 30 Sekunden
    window.setInterval(this.removeNotUpdatedPlanes, 30000, this);

    // Aufruf der Update-Methode für Flugzeuge alle zwei Sekunden
    window.setInterval(() => {
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );
    }, 2000);
  }

  /**
   * Initiiere Fetch vom Server, nachdem die Karte bewegt wurde
   */
  private fetchAircraftAfterMapMove() {
    if (!this.OLMap) return;

    this.OLMap.on('movestart', () => {
      this.mapIsBeingMoved = true;

      Globals.webgl &&
        Globals.amountDisplayedAircraft > 500 &&
        this.webglLayer?.setOpacity(0.25);
    });

    this.OLMap.on('moveend', () => {
      this.mapIsBeingMoved = false;

      Globals.webgl && this.webglLayer?.setOpacity(1);

      // Aktualisiere Flugzeuge auf der Karte
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      if (this.showAirportsUpdate) {
        // Aktualisiere Flughäfen auf der Karte
        this.updateAirportsFromServer();
      }

      this.saveMapPositionInLocalStorage();
    });
  }

  private saveMapPositionInLocalStorage() {
    if (!this.OLMap) return;

    const lastCenterPosition = olProj.transform(
      this.OLMap.getView().getCenter(),
      'EPSG:3857',
      'EPSG:4326'
    );

    const lastCenterZoomLevel = this.OLMap.getView().getZoom();

    Storage.savePropertyInLocalStorage(
      'lastCenterPosition',
      lastCenterPosition
    );
    Storage.savePropertyInLocalStorage(
      'lastCenterZoomLevel',
      lastCenterZoomLevel
    );
  }

  private getMyExtent(extent): any {
    const bottomLeft = olProj.toLonLat([extent[0], extent[1]]);
    const topRight = olProj.toLonLat([extent[2], extent[3]]);

    return {
      extent: extent,
      minLon: bottomLeft[0],
      maxLon: topRight[0],
      minLat: bottomLeft[1],
      maxLat: topRight[1],
    };
  }

  private getRenderExtent(extra): any {
    extra || (extra = 0);
    const renderBuffer = 60;
    const mapSize = this.OLMap.getSize();
    const over = renderBuffer + extra;
    const size = [mapSize[0] + over, mapSize[1] + over];
    return this.getMyExtent(this.OLMap.getView().calculateExtent(size));
  }

  private calcCurrentMapExtent(): any {
    const size = this.OLMap.getSize();
    const extent = this.getRenderExtent(80);

    let minLon = extent.minLon.toFixed(6);
    let maxLon = extent.maxLon.toFixed(6);
    const minLat = extent.minLat.toFixed(6);
    const maxLat = extent.maxLat.toFixed(6);

    if (Math.abs(extent.extent[2] - extent.extent[0]) > 40075016) {
      // Alle Longitudes im View
      minLon = -180;
      maxLon = 180;
      return [minLon, minLat, maxLon, maxLat];
    }

    // Checke 180 Longitude Übergang und wähle größeren Bereich bis +-180
    if (+minLon > +maxLon) {
      let d1 = 180 - +minLon;
      let d2 = +maxLon + 180;
      d1 > d2 ? (maxLon = 180) : (minLon = -180);
    }

    return [minLon, minLat, maxLon, maxLat];
  }

  /**
   * Aktualisiert die Flughäfen vom Server
   */
  private updateAirportsFromServer() {
    if (this.pendingFetchesAirports > 0 || this.mapIsBeingMoved) return;

    const extent = this.calcCurrentMapExtent();
    const zoomLevel = this.OLMap.getView().getZoom();

    if (!this.OLMap && !extent) return;

    this.pendingFetchesAirports += 1;

    this.serverService
      .getAirportsInExtent(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        zoomLevel
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (airportsJSONArray) => {
          this.processAirportsUpdate(airportsJSONArray);

          this.pendingFetchesAirports--;
        },
        (error) => {
          this.showErrorLogAndSnackBar(
            'Error updating the airports from the server. Is the server running?'
          );
          this.pendingFetchesAirports--;
        }
      );
  }

  private processAirportsUpdate(airportsJSONArray: any) {
    if (this.showAirportsUpdate) {
      this.AirportFeatures.clear();

      if (airportsJSONArray == null) return;

      for (let i = 0; i < airportsJSONArray.length; i++) {
        const airport = airportsJSONArray[i];
        this.createAirportFeature(airport);
      }
    }
  }

  private createAirportFeature(airport: any) {
    if (!airport) return;

    const airportPoint = new Point(
      olProj.fromLonLat([airport.longitude_deg, airport.latitude_deg])
    );

    const airportFeature: any = new Feature(airportPoint);
    airportFeature.longitude = airport.longitude_deg;
    airportFeature.latitude = airport.latitude_deg;
    airportFeature.elevation_ft = airport.elevation_ft;
    airportFeature.icao = airport.ident;
    airportFeature.iata = airport.iata_code;
    airportFeature.name = airport.name;
    airportFeature.city = airport.municipality;
    airportFeature.type = airport.type;
    airportFeature.featureName = 'AirportDataPoint';

    if (airport.type) {
      const style = Styles.getStyleOfAirportFeature(airport.type);
      airportFeature.setStyle(style);
    }

    this.AirportFeatures.addFeature(airportFeature);
  }

  /**
   * Öffnet eine Snackbar mit einem Text
   * @param message Text, der als Titel angezeigt werden soll
   */
  private openSnackbar(message: string, duration: number) {
    this.snackBar.open(message, 'OK', {
      duration: duration,
    });
  }

  /**
   * Entfernt alle nicht geupdateten Flugzeuge aus
   * verschiedenen Listen und Datenstrukturen
   */
  private removeNotUpdatedPlanes(that: any) {
    if (this.mapIsBeingMoved) return;

    const timeNow = new Date().getTime();
    let aircraft: Aircraft | undefined;
    const length = Globals.PlanesOrdered.length;

    for (let i = 0; i < length; i++) {
      aircraft = Globals.PlanesOrdered.shift();
      if (aircraft == null || aircraft == undefined) continue;

      // Wenn mehr als 20 Sekunden kein Update mehr kam,
      // wird das Flugzeug entfernt (Angabe in Millisekunden)
      if (!aircraft.isMarked && timeNow - aircraft.lastUpdate > 20000) {
        // Entferne Flugzeug
        that.removeAircraft(aircraft);
      } else {
        // Behalte Flugzeug und pushe es zurück in die Liste
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  /**
   * Aktualisiere die Flugzeuge, indem eine Anfrage
   * an den Server gestellt wird
   */
  private updatePlanesFromServer(
    selectedFeeder: any,
    showIss: boolean,
    showOnlyMilitary: boolean
  ) {
    if (this.pendingFetchesPlanes > 0 || this.mapIsBeingMoved) return;

    const extent = this.calcCurrentMapExtent();

    if (!this.OLMap && !extent) return;

    this.pendingFetchesPlanes += 1;

    const fetchRemote = this.getRemoteNetworkParamter();

    // Mache Server-Aufruf und subscribe (0: lomin, 1: lamin, 2: lomax, 3: lamax)
    this.serverService
      .getPlanesUpdate(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        selectedFeeder,
        fetchRemote,
        showIss,
        this.aircraft && this.aircraft.isFromRemote == null
          ? this.aircraft.hex
          : null, // hex des markierten Flugzeugs
        showOnlyMilitary
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (planesJSONArray) => {
          this.processPlanesArray(planesJSONArray, extent);
        },
        (error) => {
          this.showErrorLogAndSnackBar(
            'Error updating the planes from the server. Is the server running?'
          );

          // Aktualisiere angezeigte Flugzeug-Zähler
          this.updatePlanesCounter(0);

          this.pendingFetchesPlanes--;
        }
      );
  }

  private processPlanesArray(planesJSONArray: Aircraft[], extent: any) {
    if (planesJSONArray == null) {
      this.pendingFetchesPlanes--;
      this.updatePlanesCounter(0);
      return;
    }

    // Wenn eine Route angezeigt wird, aktualisiere nur das ausgewählte Flugzeug
    if (this.showRoute) {
      planesJSONArray = planesJSONArray.filter(
        (a) => a.hex === this.aircraft?.hex
      );
      if (planesJSONArray == undefined) {
        this.pendingFetchesPlanes--;
        this.updatePlanesCounter(0);
        return;
      }
    }

    this.processPlanesUpdate(planesJSONArray);

    // Entferne alle nicht ausgewählten Flugzeuge, wenn eine Route angezeigt wird
    if (this.showRoute) {
      this.removeAllNotSelectedPlanes();
    } else {
      this.removePlanesNotInCurrentExtent(extent);
    }

    // Aktualisiere Flugzeug-Tabelle mit der globalen Flugzeug-Liste
    if (Globals.aircraftTableIsVisible)
      this.aircraftTableService.updateAircraftList(Globals.PlanesOrdered);

    this.updateCesiumComponentWithAircraft();

    // Aktualisiere angezeigte Flugzeug-Zähler
    this.updatePlanesCounter(Globals.PlanesOrdered.length);

    this.pendingFetchesPlanes--;
  }

  /**
   * Aktualisiert den Flugzeug-Zähler oben im Tab mit der
   * Anzahl der gefetchten Flugzeuge
   * @param amountFetchedPlanes number
   */
  private updatePlanesCounter(amountFetchedPlanes: number) {
    Globals.amountDisplayedAircraft = amountFetchedPlanes;

    this.titleService.setTitle(
      'Beluga Project  - ' + Globals.amountDisplayedAircraft
    );

    this.toolbarService.updateAircraftCounter(Globals.amountDisplayedAircraft);
  }

  /**
   * Triggert das erstellen oder aktualisieren aller
   * Flugzeuge in dem JSON Array an Flugzeugen
   * @param planesJSONArray Aircraft[]
   */
  private processPlanesUpdate(planesJSONArray: Aircraft[]) {
    for (let i = 0; i < planesJSONArray.length; i++) {
      this.processAircraft(planesJSONArray[i]);
    }
  }

  /**
   * Erstellt oder aktualisiert ein Flugzeug aus JSON-Daten
   */
  private processAircraft(aircraftJSON: Aircraft) {
    let isNewAircraft: boolean = false;

    let hex = aircraftJSON.hex;
    if (!hex) return;

    let aircraft: Aircraft = this.Planes[hex];

    if (!aircraft) {
      ({ aircraft, isNewAircraft } = this.createNewAircraft(
        aircraft,
        aircraftJSON,
        hex,
        isNewAircraft
      ));
    } else {
      aircraft.updateData(aircraftJSON);
    }

    aircraft.updateMarker(!isNewAircraft);

    this.createPlaneLabel(aircraft);

    const isMarkedOnMap =
      this.aircraft != null && aircraft.hex == this.aircraft.hex;
    const isBeingHoveredOnMap =
      this.hoveredAircraftObject &&
      aircraft.hex == this.hoveredAircraftObject.hex;

    if (isMarkedOnMap) {
      if (this.aircraft) this.aircraft.updateTrail();
      this.updateShowRoute();
      this.updateAltitudeChart();
    }

    if (isBeingHoveredOnMap) this.createHoveredAircraft(aircraft);
  }

  private createPlaneLabel(aircraft: Aircraft) {
    if (aircraft && aircraft.labelFeature)
      this.PlaneLabelFeatures.removeFeature(aircraft.labelFeature);
    if (aircraft && aircraft.flightId) {
      const labelFeature: any = aircraft.createLabelFeature();
      this.PlaneLabelFeatures.addFeature(labelFeature);
    }
  }

  private createNewAircraft(
    aircraft: Aircraft,
    aircraftJSON: Aircraft,
    hex: string,
    isNewAircraft: boolean
  ) {
    aircraft = Aircraft.createNewAircraft(aircraftJSON);
    this.Planes[hex] = aircraft;
    Globals.PlanesOrdered.push(aircraft);
    isNewAircraft = true;
    return { aircraft, isNewAircraft };
  }

  /**
   * Holt alle Daten über ein Flugzeug vom Server
   * @param aircraft Flugzeug
   */
  private getAllAircraftData(aircraft: Aircraft) {
    if (!aircraft) return;

    this.serverService
      .getAllAircraftData(
        aircraft.hex,
        aircraft.registration,
        aircraft.isFromRemote == null ? false : true
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (aircraftDataJSONObject) =>
          this.processAllAircraftData(aircraft, aircraftDataJSONObject),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error fetching further aircraft information from the server. Is the server running?'
          )
      );
  }

  private processAllAircraftData(
    aircraft: Aircraft,
    aircraftDataJSONObject: any
  ) {
    if (
      aircraftDataJSONObject &&
      this.aircraft &&
      this.aircraft.hex == aircraft.hex
    ) {
      // Schreibe alle Informationen an markiertes Flugzeug
      this.updateMarkedAircraftWithAllData(aircraftDataJSONObject);
    }
  }

  private updateMarkedAircraftWithAllData(aircraftDataJSONObject: any) {
    if (!this.aircraft) return;

    if (aircraftDataJSONObject[0]) {
      this.aircraft.updateData(aircraftDataJSONObject[0]);
    }

    // Filtere Information über Herkunfts-Ort und Ziel-Ort heraus
    let originJSONInfo;
    let destinationJSONInfo;

    if (aircraftDataJSONObject[1]) {
      originJSONInfo = aircraftDataJSONObject[1];
    }

    if (aircraftDataJSONObject[2]) {
      destinationJSONInfo = aircraftDataJSONObject[2];
    }

    this.setOriginOnMarkedAircraft(originJSONInfo);
    this.setDestinationOnMarkedAircraft(destinationJSONInfo);

    // Setze Information über gesamte Länge der Strecke
    this.aircraft.calcFlightPathLength();
  }

  private setDestinationOnMarkedAircraft(destinationJSONInfo: any) {
    if (!this.aircraft) return;

    if (destinationJSONInfo) {
      if (destinationJSONInfo.municipality) {
        // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
        this.aircraft.destinationFullTown =
          destinationJSONInfo.municipality.split(' /')[0];
      }

      if (destinationJSONInfo.iata_code) {
        this.aircraft.destinationIataCode = destinationJSONInfo.iata_code;
      }

      // Setze Information über Position des Herkunfts-Flughafen
      if (
        destinationJSONInfo.latitude_deg &&
        destinationJSONInfo.longitude_deg
      ) {
        this.aircraft.positionDest = [
          destinationJSONInfo.longitude_deg,
          destinationJSONInfo.latitude_deg,
        ];
      }
    }
  }

  private setOriginOnMarkedAircraft(originJSONInfo: any) {
    if (!this.aircraft) return;

    if (originJSONInfo) {
      if (originJSONInfo.municipality) {
        // Wenn Stadt ein '/' enthält, setze nur den erste Teil als Stadt
        this.aircraft.originFullTown =
          originJSONInfo.municipality.split(' /')[0];
      }

      if (originJSONInfo.iata_code) {
        this.aircraft.originIataCode = originJSONInfo.iata_code;
      }

      // Setze Information über Position des Herkunfts-Flughafen
      if (originJSONInfo.latitude_deg && originJSONInfo.longitude_deg) {
        this.aircraft.positionOrg = [
          originJSONInfo.longitude_deg,
          originJSONInfo.latitude_deg,
        ];
      }
    }
  }

  /**
   * Holt den Trail zu einem Flugzeug vom Server,
   * wenn es kein Flugzeug von Airplanes-Live ist
   * @param aircraft Aircraft
   * @param selectedFeeder Ausgewählter Feeder
   */
  private getTrailToAircraft(aircraft: Aircraft, selectedFeeder: any) {
    if (!aircraft) return;

    // Hint: Opensky schickt falsche Trails momentan zurück
    if (this.isRemoteAircraft(aircraft)) {
      this.createEmptyTrailForRemoteAircraft(aircraft);
      return;
    }

    this.serverService
      .getTrail(
        aircraft.hex,
        selectedFeeder,
        this.showOpenskyPlanes ? 'Opensky' : null
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (trailDataJSONObject) =>
          this.processTrail(trailDataJSONObject, aircraft),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error fetching trail of aircraft from the server. Is the server running?'
          )
      );
  }

  private isRemoteAircraft(aircraft: Aircraft) {
    return (
      aircraft.isFromRemote == 'Airplanes-Live' ||
      aircraft.isFromRemote == 'Opensky'
    );
  }

  private processTrail(trailDataJSONObject: any, aircraft: Aircraft) {
    // Weise neue Werte zu (aircraftDataJSONObject[0] = trail data)
    if (
      !trailDataJSONObject ||
      !this.aircraft ||
      this.aircraft.hex != aircraft.hex
    )
      return;

    if (trailDataJSONObject[0]) {
      this.aircraft.aircraftTrailList = trailDataJSONObject[0];
      this.aircraft.makeTrail();
      this.aircraft.setTrailVisibility2d(true);
      this.updateAltitudeChart();
      this.updateCesiumComponentWithAircraft();
    }
  }

  private createEmptyTrailForRemoteAircraft(aircraft: Aircraft) {
    aircraft.makeTrail();
    aircraft.setTrailVisibility2d(true);
    this.updateCesiumComponentWithAircraft();
  }

  private updateAltitudeChart() {
    if (!this.aircraft) return;

    this.settingsService.sendAircraftAltitudeData(
      this.aircraft.aircraftTrailAltitudes
    );
  }

  private resetAllTrails() {
    Globals.trailGroup.forEach((f) => {
      f.set('visible', false);
    });
  }

  private getHexFromClickOnLayer(evt) {
    return evt.map.forEachFeatureAtPixel(
      evt.pixel,
      (feature) => {
        return feature.hex;
      },
      {
        layerFilter: (layer) =>
          layer == this.webglLayer || this.planeLabelFeatureLayer,
        hitTolerance: 5,
      }
    );
  }

  private getFeatureFromClickOnLayer(evt, requiredLayer1, requiredLayer2?) {
    return evt.map.forEachFeatureAtPixel(
      evt.pixel,
      function (feature: any) {
        return feature;
      },
      {
        layerFilter: (layer) => layer == requiredLayer1 || requiredLayer2,
        hitTolerance: 5,
      }
    );
  }

  /**
   * Initialisiert die Klicks auf die Karte, bspw. wenn
   * auf ein Flugzeug oder einen RangePoint geklickt wird
   */
  private initClickOnMap(): void {
    this.OLMap.on('click', (evt: any) => {
      const hex = this.getHexFromClickOnLayer(evt);

      if (hex) {
        this.markOrUnmarkAircraft(hex, false);
        return;
      }

      let featurePoint;

      if (this.rangeDataIsVisible) {
        featurePoint = this.getFeatureFromClickOnLayer(
          evt,
          this.rangeDataLayer
        );
        if (featurePoint && featurePoint.name === 'RangeDataPoint') {
          this.createAndShowRangeDataPopup(featurePoint, evt);
          return;
        }
      }

      if (this.showAirportsUpdate) {
        featurePoint = this.getFeatureFromClickOnLayer(evt, this.airportLayer);
        if (featurePoint && featurePoint.featureName === 'AirportDataPoint') {
          this.createAndShowAirportDataPopup(featurePoint, evt);
          return;
        }
      }

      if (this.showAisData) {
        featurePoint = this.getFeatureFromClickOnLayer(
          evt,
          this.aisFeatureLayer,
          this.aisLabelFeatureLayer
        );
        if (featurePoint && featurePoint.featureName === 'AisDataPoint') {
          this.createAndShowAisDataPopup(featurePoint, evt);
          return;
        }
      }

      // Reset only if no feature point is found
      this.resetClickOnMap();
    });
  }

  private resetClickOnMap() {
    this.resetAllMarkedPlanes();
    this.resetAllTrails();
    this.resetAllDrawnCircles();
    this.showLargeAircraftInfoComponent(false);
    this.resetRangeDataPopup();
    this.unselectAllPlanesInTable();
    this.resetAllDrawnPOMDPoints();
    this.resetAirportDataPopup();
    this.resetAisDataPopup();
    this.show3dMap(false);
  }

  private unselectAllPlanesInTable() {
    this.aircraftTableService.unselectAllPlanesInTable();
  }

  private markOrUnmarkAircraft(hex: string, isRequestFromTable: boolean) {
    let aircraft: Aircraft = this.Planes[hex];
    if (!aircraft) return;

    aircraft.isMarked
      ? this.unmarkAircraftOnMap()
      : this.markAircraftOnMap(aircraft);

    // Wenn Anfrage zum Markieren des Flugzeugs nicht
    // von der Tabelle kam, markiere Flugzeug in Tabelle
    if (!isRequestFromTable) {
      this.aircraftTableService.selectOrUnselectAircraftInTable(aircraft);
    } else {
      // Zentriere Map-Ansicht auf das ausgewählte Flugzeug,
      // wenn Flugzeug durch die Tabelle markiert wurde
      if (aircraft.isMarked) {
        this.centerMap(
          aircraft.longitude,
          aircraft.latitude,
          Globals.zoomLevel
        );
      }
    }
  }

  private markAircraftOnMap(aircraft: Aircraft) {
    // Setze Zustand auf 'markiert'
    this.resetAllMarkedPlanes();
    this.resetAllTrails();
    this.resetAllDrawnCircles();
    this.resetAllDrawnPOMDPoints();
    this.reset3dEntityCesium();

    aircraft.toggleMarkPlane();

    this.aircraft = aircraft;

    // Prüfe, ob Photo-Url bereits vorhanden ist,
    // wenn nicht starte Anfrage an Server
    if (!this.aircraft.allDataWasRequested) {
      this.aircraft.urlPhotoDirect =
        '../../../assets/placeholder_loading_aircraft_photo.jpg';
      this.getAllAircraftData(aircraft);
      this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);
      this.aircraft.allDataWasRequested = true;
    } else {
      // Hole nur Trail und update 3d-Komponente
      this.getTrailToAircraft(aircraft, this.selectedFeederUpdate);
    }
    this.showLargeAircraftInfoComponent(true);
  }

  private unmarkAircraftOnMap() {
    // Setze Anzeige der Route zurück
    this.showRoute = false;

    // Setze Zustand auf 'unmarkiert'
    this.resetAllMarkedPlanes();
    this.resetAllTrails();
    this.resetAllDrawnCircles();
    this.resetAllDrawnPOMDPoints();

    this.showLargeAircraftInfoComponent(false);
  }

  private reset3dEntityCesium() {
    this.cesiumService.unmarkAircraft();
  }

  private getValueOrDefault(value: any, defaultValue: string = 'N/A'): string {
    return value ?? defaultValue;
  }

  private createAttributes(
    attributesConfig: { key: string; value: any }[]
  ): { key: string; value: string }[] {
    return attributesConfig.map((attr) => ({
      key: attr.key,
      value: this.getValueOrDefault(attr.value),
    }));
  }

  private createAndDisplayPopup(
    elementId: string,
    dataPoint: any,
    evt: any
  ): Overlay {
    const overlay = new Overlay({
      element: document.getElementById(elementId)!,
    });

    const coordinate = dataPoint.getGeometry().getCoordinates();
    overlay.setPosition([
      coordinate[0] + Math.round(evt.coordinate[0] / 40075016) * 40075016,
      coordinate[1],
    ]);

    this.OLMap.addOverlay(overlay);
    return overlay;
  }

  private createAndShowRangeDataPopup(rangePoint: any, evt: any): void {
    const dateToShow = new Date(rangePoint.timestamp).toLocaleString('de-DE', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    this.rangeDataPoint = {
      flightId: this.getValueOrDefault(rangePoint.flightId),
      hex: this.getValueOrDefault(rangePoint.hex),
      attributes: this.createAttributes([
        {
          key: 'Latitude',
          value: rangePoint.x ? `${rangePoint.x} °` : undefined,
        },
        {
          key: 'Longitude',
          value: rangePoint.y ? `${rangePoint.y} °` : undefined,
        },
        { key: 'Type', value: rangePoint.type },
        { key: 'Category', value: rangePoint.category },
        { key: 'Registration', value: rangePoint.registration },
        {
          key: 'Altitude',
          value: rangePoint.altitude ? `${rangePoint.altitude} ft` : undefined,
        },
        {
          key: 'Distance',
          value: rangePoint.distance ? `${rangePoint.distance} km` : undefined,
        },
        { key: 'Feeder', value: rangePoint.feederList },
        { key: 'Source', value: rangePoint.sourceList },
        { key: 'Timestamp', value: dateToShow },
      ]),
    };

    this.rangeDataPopup = this.createAndDisplayPopup(
      'rangeDataPopup',
      rangePoint,
      evt
    );
    this.rangeDataPopupBottomValue = '10px';
    this.showPopupRangeDataPoint = true;
  }

  private createAndShowAirportDataPopup(airportPoint: any, evt: any): void {
    if (!airportPoint) return;

    const elevation = airportPoint.elevation_ft
      ? airportPoint.elevation_ft +
        ' ft / ' +
        (airportPoint.elevation_ft * 0.328084).toFixed(0) +
        ' m'
      : undefined;

    this.airportDataPoint = {
      icao: this.getValueOrDefault(airportPoint.icao),
      featureName: airportPoint.featureName,
      attributes: this.createAttributes([
        { key: 'Elevation', value: elevation },
        { key: 'IATA', value: airportPoint.iata },
        { key: 'City', value: airportPoint.city },
        { key: 'Type', value: airportPoint.type },
        { key: 'Name', value: airportPoint.name },
      ]),
    };

    this.airportDataPopup = this.createAndDisplayPopup(
      'airportDataPopup',
      airportPoint,
      evt
    );
    this.airportDataPopupBottomValue = '10px';
  }

  private createAndShowAisDataPopup(aisDataPoint: any, evt: any): void {
    if (!aisDataPoint) return;

    const shipData = aisDataPoint.ship;
    const getShipDimension = shipData.dimension
      ? shipData.dimension.to_bow +
        shipData.dimension.to_stern +
        ' m ' +
        ' x ' +
        (shipData.dimension.to_port + shipData.dimension.to_starboard) +
        ' m'
      : undefined;

    const getEtaVal = shipData.eta
      ? ('0' + shipData.eta.month).slice(-2) +
        '-' +
        ('0' + shipData.eta.day).slice(-2) +
        ' ' +
        ('0' + shipData.eta.hour).slice(-2) +
        ':' +
        ('0' + shipData.eta.minute).slice(-2)
      : undefined;

    this.aisDataPoint = {
      title: shipData.shipName ?? shipData.mmsi ?? 'N/A',
      link: shipData.mmsi
        ? `https://www.vesselfinder.com/vessels/details/${shipData.mmsi}`
        : null,
      photoUrl: shipData.photoUrl,
      featureName: aisDataPoint.featureName,
      attributes: this.createAttributes([
        { key: 'Status', value: shipData.status },
        { key: 'MMSI', value: shipData.mmsi },
        {
          key: 'IMO',
          value: shipData.imoNumber === 0 ? undefined : shipData.imoNumber,
        },
        { key: 'Class', value: shipData.typeVal },
        { key: 'Destination', value: shipData.destination },
        { key: 'Dimensions', value: getShipDimension },
        { key: 'Type', value: shipData.type },
        { key: 'ETA', value: getEtaVal },
        { key: 'Callsign', value: shipData.callSign },
        {
          key: 'Course',
          value: shipData.cog ? `${shipData.cog} °` : undefined,
        },
        {
          key: 'Speed',
          value: shipData.sog ? `${shipData.sog} kn` : undefined,
        },
        {
          key: 'Heading',
          value: shipData.trueHeading ? `${shipData.trueHeading} °` : undefined,
        },
        {
          key: 'Draught',
          value: shipData.maximumStaticDraught
            ? `${shipData.maximumStaticDraught} m`
            : undefined,
        },
        {
          key: 'Last Signal',
          value:
            shipData.timeUTC?.replace(/\.\d+/, '').replace(' +0000 UTC', '') +
            ' (UTC)',
        },
      ]),
    };

    this.getAisShipPhoto(this.aisDataPoint.link, aisDataPoint);
    this.aisDataPopup = this.createAndDisplayPopup(
      'aisDataPopup',
      aisDataPoint,
      evt
    );
    this.aisDataPopupBottomValue = '10px';
  }

  private getAisShipPhoto(link: string | null, aisDataPoint: any) {
    if (
      link == null ||
      aisDataPoint.ship.mmsi == null ||
      aisDataPoint.ship.photoUrl != null
    )
      return;

    this.serverService
      .getAisPhoto(aisDataPoint.ship.mmsi)
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (photoUrlJson) => {
          if (photoUrlJson == null || photoUrlJson == '') return;
          this.aisDataPoint.photoUrl = photoUrlJson.photoUrl.toString();
        },
        (error) => {}
      );
  }

  private resetPopup(
    popup: Overlay | undefined,
    popupBottomValueProperty: string
  ): void {
    if (popup) {
      popup.setPosition(undefined);
      popup.dispose();
    }

    this[popupBottomValueProperty] = '0px';
  }

  private resetAirportDataPopup(): void {
    this.resetPopup(this.airportDataPopup, 'airportDataPopupBottomValue');
    this.airportDataPoint = undefined;
  }

  private resetAisDataPopup(): void {
    this.resetPopup(this.aisDataPopup, 'aisDataPopupBottomValue');
    this.aisDataPopup = undefined;
  }

  private resetRangeDataPopup(): void {
    this.resetPopup(this.rangeDataPopup, 'rangeDataPopupBottomValue');
    this.rangeDataPopup = undefined;
    this.showPopupRangeDataPoint = false;
  }

  private showLargeAircraftInfoComponent(show: boolean) {
    Globals.displayAircraftInfoLarge = show;
  }

  private resetAllMarkedPlanes() {
    for (var hex of Object.keys(this.Planes)) {
      if (this.Planes[hex].isMarked) {
        this.Planes[hex].toggleMarkPlane();
      }
    }
    this.aircraft = null;
  }

  private initHoverOverAircraftIcon() {
    this.OLMap.on('pointermove', (evt: any) => {
      // Verhindere Hovering, wenn Anwendung mobil genutzt wird
      if (evt.dragging || !this.isDesktop) {
        return;
      }

      const feature = evt.map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => {
          return feature;
        },
        {
          layerFilter: (layer) => layer == this.webglLayer,
          hitTolerance: 5,
        }
      );

      if (feature && feature.hex) {
        this.createSmallInfoBox(evt, feature);
      } else {
        this.OLMap.getTargetElement().style.cursor = '';
        this.hoveredAircraftObject = undefined;
        this.showSmallInfo = false;
      }
    });
  }

  private createSmallInfoBox(evt, feature) {
    const hex = feature.hex;

    this.OLMap.getTargetElement().style.cursor = hex ? 'pointer' : '';

    // Finde gehovertes Flugzeug aus Liste mit Hex
    let aircraft: Aircraft = this.Planes[hex];

    // Zeige Daten des aktuellen Flugzeugs in Small Info-Box
    if (aircraft) {
      // Setze Flugzeug als das aktuell gehoverte
      this.createHoveredAircraft(aircraft);

      // Berechne richtige Position, wenn andere Welt gehovert wird
      const featureCoordinates = feature.getGeometry().getCoordinates();
      const coordinatesNormalized = [
        featureCoordinates[0] +
          Math.round(evt.coordinate[0] / 40075016) * 40075016,
        featureCoordinates[1],
      ];

      const markerPosition = this.OLMap.getPixelFromCoordinate(
        coordinatesNormalized
      );
      if (!markerPosition) return;

      // Setze richtige Position
      let mapSize = this.OLMap.getSize();
      if (markerPosition[0] + 200 < mapSize[0])
        this.leftValue = markerPosition[0] + 20;
      else this.leftValue = markerPosition[0] - 200;
      if (markerPosition[1] + 250 < mapSize[1])
        this.topValue = markerPosition[1] + 50;
      else this.topValue = markerPosition[1] - 250;

      // Zeige kleine Info-Box
      this.showSmallInfo = true;
    }
  }

  private createHoveredAircraft(aircraft: Aircraft) {
    this.hoveredAircraftObject = {
      flightId: this.getValueOrDefault(aircraft.flightId),
      hex: this.getValueOrDefault(aircraft.hex),
      attributes: [
        {
          key: 'Altitude',
          value: this.getValueOrDefault(
            typeof aircraft.altitude !== 'undefined'
              ? aircraft.altitude + ' ft'
              : undefined
          ),
        },
        {
          key: 'Speed',
          value: this.getValueOrDefault(
            typeof aircraft.speed !== 'undefined'
              ? aircraft.speed + ' kn'
              : undefined
          ),
        },
        { key: 'Type', value: this.getValueOrDefault(aircraft.type) },
        {
          key: 'Registration',
          value: this.getValueOrDefault(aircraft.registration),
        },
        {
          key: 'Track',
          value: this.getValueOrDefault(
            typeof aircraft.track !== 'undefined'
              ? aircraft.track + ' °'
              : undefined
          ),
        },
        {
          key: 'Last Seen',
          value: this.getValueOrDefault(
            typeof aircraft.lastSeen !== 'undefined'
              ? aircraft.lastSeen + ' s'
              : undefined
          ),
        },
        { key: 'Feeder', value: this.getValueOrDefault(aircraft.feederList) },
      ],
    };

    if (Globals.useDevicePositionForDistance && Globals.DevicePosition) {
      this.hoveredAircraftObject.attributes.push({
        key: 'Dist. (Dev)',
        value: aircraft.distanceDevicePos
          ? aircraft.distanceDevicePos + ' km'
          : 'N/A',
      });
    } else {
      this.hoveredAircraftObject.attributes.push({
        key: 'Dist. (Ant)',
        value:
          typeof aircraft.distance !== 'undefined'
            ? aircraft.distance + ' km'
            : 'N/A',
      });
    }
  }

  receiveToggleShowAircraftRoute($event) {
    this.showRoute = $event;

    if (this.showRoute) {
      this.createAndShowRoute();
    } else {
      this.resetAllDrawnCircles();

      // Setze Center der Map auf die gespeicherte Position zurueck
      if (!this.oldCenterPosition || !this.oldCenterZoomLevel) return;
      this.centerMap(
        this.oldCenterPosition[0],
        this.oldCenterPosition[1],
        this.oldCenterZoomLevel
      );
    }
  }

  private createAndShowRoute() {
    // Prüfe, ob Positionen des Herkunfts- und
    // Zielorts bekannt sind
    if (
      this.aircraft &&
      this.aircraft.positionOrg &&
      this.aircraft.positionDest
    ) {
      // Speichere alte View-Position und ZoomLevel der Karte ab
      this.oldCenterPosition = olProj.transform(
        this.OLMap.getView().getCenter(),
        'EPSG:3857',
        'EPSG:4326'
      );

      this.oldCenterZoomLevel = this.OLMap.getView().getZoom();

      this.resetAllDrawnCircles();
      this.drawGreatDistanceCirclesThroughAircraft();

      // Erweitere Karte, damit beide Koordinaten
      // (Herkunfts- und Zielort) angezeigt werden können
      this.extentMapViewToFitCoordiates(
        this.aircraft.positionOrg,
        this.aircraft.positionDest
      );
    }
  }

  private drawGreatDistanceCirclesThroughAircraft() {
    if (
      !this.aircraft ||
      !this.aircraft.position ||
      !this.aircraft.positionOrg ||
      !this.aircraft.positionDest
    )
      return;

    // Linie von Herkunftsort -> Flugzeug
    this.createAndAddCircleToFeature(
      this.aircraft.positionOrg,
      this.aircraft.position
    );
    // Linie von Flugzeug -> Zielort
    this.createAndAddCircleToFeature(
      this.aircraft.position,
      this.aircraft.positionDest
    );
  }

  /**
   * Erstellt eine gekruemmte Linie zwischen
   * startPosition und endPosition
   * @param startPosition Array mit long, lat
   * @param endPosition Array mit long, lat
   */
  private createAndAddCircleToFeature(
    startPosition: number[],
    endPosition: number[]
  ) {
    // Erstelle GreatCircle-Linie
    let greatCircleLine = new LineString(
      olExtSphere.greatCircleTrack(startPosition, endPosition)
    );
    greatCircleLine.transform(
      'EPSG:4326',
      this.OLMap.getView().getProjection()
    );

    // Füge GreatCircle-Linie als neues Feature zu DestCircleFeatures hinzu
    this.RouteFeatures.addFeature(new Feature(greatCircleLine));
  }

  /**
   * Setze neuen Center-Punkt der Karte. Veraendere Sichtbereich,
   * damit Start- und Ziel gut zu erkennen sind. Nach Sichtbereichs-
   * veraenderung wird Zoom-Level noch verringert, damit Punkte gut
   * zu sehen sind
   * @param   positionOrg Array mit Koordinaten
   *          lon, lat der Herkunft des Flugzeugs
   * @param   positionDest Array mit Koordinaten
   *          lon, lat des Ziels des Flugzeugs
   */
  private extentMapViewToFitCoordiates(positionOrg: [], positionDest: []) {
    // Setze neuen Center der Karte
    let boundingExtent = olExtent.boundingExtent([positionOrg, positionDest]);
    let source: any = olProj.get('EPSG:4326');
    let destination: any = olProj.get('EPSG:3857');

    boundingExtent = olProj.transformExtent(
      boundingExtent,
      source,
      destination
    );
    this.OLMap.getView().fit(boundingExtent, this.OLMap.getSize());

    // Beziehe aktuelles Zoom-Level nach View-Ausdehnung
    // zum boundingExtent
    let currentZoomLevel = this.OLMap.getView().getZoom();

    // Verringere dieses Zoom-Level, damit genug Platz
    // zwischen Kartenrand und boundingExtent-Raendern ist
    this.OLMap.getView().setZoom(currentZoomLevel - 1);
  }

  /**
   * Setzt den Mittelpunkt der Karte auf die
   * Werte long, lat
   * @param long number
   * @param lat number
   * @param zoomLevel number
   */
  private centerMap(long: number, lat: number, zoomLevel: number) {
    this.OLMap.getView().setCenter(
      olProj.transform([long, lat], 'EPSG:4326', 'EPSG:3857')
    );
    this.OLMap.getView().setZoom(zoomLevel);
  }

  /**
   * Löscht alle Linien zwischen Start-Flugzeug-Ziel
   */
  private resetAllDrawnCircles() {
    this.RouteFeatures.clear();
  }

  /**
   * Löscht alle Features aus Globals.POMDFeatures und
   * entfernt bei jedem Flugzeug den POMD-Point
   */
  private resetAllDrawnPOMDPoints() {
    for (var hex of Object.keys(this.Planes)) {
      let aircraft: Aircraft = this.Planes[hex];
      aircraft.clearPOMDPoint();
    }
    Globals.POMDFeatures.clear();
  }

  /**
   * Aktualisiere Route, wenn Flugzeug sich bewegt hat
   */
  private updateShowRoute() {
    if (!this.showRoute) return;

    if (
      !this.aircraft ||
      !this.aircraft.positionOrg ||
      !this.aircraft.positionDest
    )
      return;

    this.resetAllDrawnCircles();

    // Zeichne Route von Herkunftsort zu Flugzeug
    // und vom Flugzeug zum Zielort
    this.drawGreatDistanceCirclesThroughAircraft();
  }

  /**
   * Sortiert und zeichnet alle Range-Data-Objekte in rangeDataJSON auf der
   * Karte als Polygon und als einzelne Punkte zum Anklicken
   * @param rangeDataJSON rangeDataJSON
   */
  drawRangeDataJSONOnMap(rangeDataJSON: any): void {
    if (
      !rangeDataJSON ||
      !rangeDataJSON.length ||
      !this.selectedFeederRangeData ||
      !this.selectedFeederRangeData.length
    ) {
      this.resetAllDrawnRangeDataPoints();
      return;
    }

    const points = this.selectedFeederRangeData.reduce(
      (acc: any[], feeder: string) => {
        const filteredPoints = rangeDataJSON
          .filter((data: any) => data.feederList.includes(feeder))
          .map((data: any) => ({
            x: data.longitude,
            y: data.latitude,
            timestamp: data.timestamp,
            ...data,
          }));

        return acc.concat(filteredPoints);
      },
      []
    );

    const center = points.reduce(
      (acc, point) => {
        acc.x += point.x / points.length;
        acc.y += point.y / points.length;
        return acc;
      },
      { x: 0, y: 0 }
    );

    // Füge Winkel hinzu und sortiere danach
    points.forEach((point) => {
      point.angle =
        (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
    });
    points.sort((a, b) => a.angle - b.angle);

    this.resetAllDrawnRangeDataPoints();

    // Polygon und Punkte auf der Karte
    const pointsForPolygon = points.map((point) => [point.x, point.y]);
    const polygon = new Polygon([pointsForPolygon]);
    polygon.transform('EPSG:4326', 'EPSG:3857');

    const polygonFeature = this.createPolygonFeature(
      polygon,
      'RangeDataPolygon',
      this.darkStaticFeatures
        ? Styles.RangeDataPolygonStyle
        : Styles.RangeDataPolygonStyleWhite
    );
    this.RangeDataFeatures.addFeature(polygonFeature);

    points.forEach((point) => {
      const pointFeature = this.createPointFeature(point);
      this.RangeDataFeatures.addFeature(pointFeature);
    });

    // Setze Styling je nach markierten Booleans
    if (this.markRangeDataByFeeder) this.showRangeDataByFeeder();
    if (this.markRangeDataByHeight) this.showRangeDataByHeight();
  }

  private createPolygonFeature(
    geometry: any,
    name: string,
    style: any
  ): Feature {
    const feature: any = new Feature(geometry);
    feature.name = name;
    feature.setStyle(style);
    return feature;
  }

  private createPointFeature(data: any): Feature {
    const point = new Point(olProj.fromLonLat([data.x, data.y]));
    const feature: any = new Feature(point);
    Object.assign(feature, data); // Zuordnen von Eigenschaften
    feature.name = 'RangeDataPoint';
    feature.setStyle(
      this.darkStaticFeatures
        ? Styles.RangeDataPointStyle
        : Styles.RangeDataPointStyleWhite
    );
    return feature;
  }

  private showRangeDataByFeeder(): void {
    if (!this.rangeDataLayer) return;
    const RangeDataFeatures: any = this.rangeDataLayer
      .getSource()!
      .getFeatures();
    const styleMap = this.listFeeder.reduce((map, feeder) => {
      map[feeder.name] = feeder.styleFeederPoint;
      return map;
    }, {} as Record<string, any>);

    RangeDataFeatures.forEach((feature) => {
      if (feature.name !== 'RangeDataPolygon' && feature.feederList) {
        const feederName = feature.feederList.find((name) => styleMap[name]);
        if (feederName) feature.setStyle(styleMap[feederName]);
        else feature.setStyle(Styles.RangeDataPointStyle);
      }
    });
  }

  private showRangeDataByHeight(): void {
    if (!this.rangeDataLayer) return;
    const RangeDataFeatures: any = this.rangeDataLayer
      .getSource()!
      .getFeatures();

    RangeDataFeatures.forEach((feature) => {
      const { altitude } = feature;
      if (feature.name !== 'RangeDataPolygon' && altitude !== undefined) {
        const color = Markers.getColorFromAltitude(
          altitude,
          false,
          true,
          false,
          false,
          false
        );
        feature.setStyle(
          new Style({
            image: new Circle({
              radius: 5,
              fill: new Fill({ color }),
              stroke: new Stroke({ color: 'white', width: 1 }),
            }),
          })
        );
      }
    });
  }

  private resetAllDrawnRangeDataPoints() {
    this.RangeDataFeatures.clear();
  }

  private updateRangeDataFromServer() {
    if (this.datesCustomRangeData) {
      this.serverService
        .getRangeDataBetweenTimestamps(
          this.datesCustomRangeData[0],
          this.datesCustomRangeData[1]
        )
        .pipe(takeUntil(this.ngUnsubscribe))
        .subscribe(
          (rangeDataJSON) => {
            this.rangeDataJSON = rangeDataJSON;
          },
          (error) =>
            this.showErrorLogAndSnackBar(
              'Error fetching custom Range-Data from the server. Is the server running?'
            ),
          () => {
            if (this.rangeDataJSON) {
              this.drawRangeDataJSONOnMap(this.rangeDataJSON);
            } else {
              this.resetAllDrawnRangeDataPoints();
            }
          }
        );
    }
  }

  /**
   * Methode versteckt oder zeigt den Layer mit den RangeData-Points
   * Hinweis: Boolean wird hier invertiert, da "versteckt" true ist
   * @param toggleHideRangeData boolean
   */
  private hideRangeDataOverlay(toggleHideRangeData: boolean) {
    // Wenn die Sichtbarkeit der gewünschten bereits entspricht, tue nichts
    if (this.rangeDataLayer.get('visible') === !toggleHideRangeData) {
      return;
    }

    // Verändere Sichtbarkeit des Layers
    // Hinweis: Daten des Layers werden hier nur versteckt und nicht gelöscht!
    this.rangeDataLayer.set('visible', !toggleHideRangeData);
  }

  private toggleDarkModeInRangeData() {
    if (this.rangeDataLayer) {
      this.RangeDataFeatures.getFeatures().forEach((feature) => {
        if (feature.get('name') != 'RangeDataPolygon') {
          feature.setStyle(
            this.darkStaticFeatures
              ? Styles.RangeDataPointStyle
              : Styles.RangeDataPointStyleWhite
          );
        } else if (feature.get('name') == 'RangeDataPolygon') {
          feature.setStyle(
            this.darkStaticFeatures
              ? Styles.RangeDataPolygonStyle
              : Styles.RangeDataPolygonStyleWhite
          );
        }
      });

      if (this.markRangeDataByHeight) {
        this.showRangeDataByHeight();
      }

      if (this.markRangeDataByFeeder) {
        this.showRangeDataByFeeder();
      }
    }
  }

  private toggleShowAircraftLabels(showAircraftLabel) {
    this.showAircraftLabel = showAircraftLabel;
    Globals.showAircraftLabel = showAircraftLabel;

    this.planeLabelFeatureLayer.setVisible(Globals.showAircraftLabel);
    this.aisLabelFeatureLayer.setVisible(
      Globals.showAircraftLabel && this.OLMap.getView().getZoom() > 11.5
    );
  }

  /**
   * Erstellt und zeigt einen POMD-Point an, je nach Wert des
   * Booleans Globals.showPOMDPoint. Wenn der Boolean false ist,
   * werden alle POMD-Points gelöscht
   */
  private toggleShowPOMDPoints(showPOMDPoint: boolean) {
    this.showPOMDPoint = showPOMDPoint;

    if (this.showPOMDPoint) {
      Globals.showPOMDPoint = true;

      // Erstelle für das ausgewählte Flugzeug aus Planes den Point
      if (this.aircraft) {
        this.aircraft.updatePOMDMarker(false);
      }
    } else {
      Globals.showPOMDPoint = false;
      // Entferne für alle Flugzeuge aus Planes den Point
      this.resetAllDrawnPOMDPoints();
    }
  }

  /**
   * Sendet die Liste mit Feedern, die App-Version, den Namen
   * der App, die IP-Adresse des Clients sowie den Boolean,
   * ob es Opensky-Credentials gibt an die Settings-Komponente,
   * damit die Einstellungen angezeigt werden können
   */
  private sendInitialSettingsToSettings() {
    this.settingsService.sendReceiveListFeeder(this.listFeeder);
    this.settingsService.sendReceiveAppNameAndVersion([
      Globals.appName,
      Globals.appVersion,
      Globals.appStage,
      Globals.appBuildTime,
    ]);
    this.settingsService.sendReceiveClientIp(Globals.clientIp);
    this.settingsService.sendReceiveOpenskyCredentialsExist(
      Globals.openskyCredentials
    );
    this.settingsService.sendReceiveAisstreamApiKeyExists(
      this.aisstreamApiKeyExists
    );
    this.sendAvailableMapsToSettings();
  }

  /**
   * Prüfe auf Geoapify-API-Key und gebe Liste an verfügbaren Maps
   * an Settings weiter
   */
  private sendAvailableMapsToSettings() {
    this.listAvailableMaps = Maps.listAvailableFreeMaps;
    if (this.geoapifyApiKey) {
      let listGeoapifyWithApiKey: any[] = [];
      for (let i = 0; i < Maps.listAvailableGeoapifyMaps.length; i++) {
        let element = Maps.listAvailableGeoapifyMaps[i];
        element.url = element.url.concat(this.geoapifyApiKey);
        listGeoapifyWithApiKey.push(element);
      }
      this.listAvailableMaps.push(...listGeoapifyWithApiKey);
    }
    this.markSelectedMapInAvailableMaps(this.listAvailableMaps);
    this.settingsService.sendReceiveListAvailableMaps(this.listAvailableMaps);
  }

  private markSelectedMapInAvailableMaps(listMaps: any) {
    for (let i = 0; i < listMaps.length; i++) {
      let element = listMaps[i];
      if (this.currentSelectedMapStyle.name == element.name)
        element.isSelected = true;
    }
  }

  private filterRangeDataBySelectedFeeder(selectedFeederArray: any[]) {
    this.selectedFeederRangeData = selectedFeederArray;

    if (this.selectedFeederRangeData)
      this.drawRangeDataJSONOnMap(this.rangeDataJSON);
  }

  private markUnmarkAircraftFromAircraftTable(hexSelectedAircraft: string) {
    if (hexSelectedAircraft)
      this.markOrUnmarkAircraft(hexSelectedAircraft, true);
  }

  /**
   * Entfernt ein Flugzeug aus allen Datenstrukturen
   * (bis auf Globals.PlanesOrdered) und zerstört
   * es am Ende
   * @param aircraft Aircraft
   */
  private removeAircraft(aircraft: Aircraft): void {
    // Entferne Flugzeug aus Planes
    delete this.Planes[aircraft.hex];
    this.removeFeatureFromFeatures(
      this.PlaneLabelFeatures,
      'hex',
      aircraft.hex
    );

    // Entferne Flugzeug als aktuell markiertes Flugzeug, wenn es dieses ist
    if (this.aircraft?.hex == aircraft.hex) this.aircraft = null;

    // Zerstöre Flugzeug
    aircraft.destroy();
  }

  /**
   * Hilfsfunktion, um Flugzeuge basierend auf einer Bedingung zu entfernen.
   * @param shouldRemove Funktion, die bestimmt, ob ein Flugzeug entfernt werden soll.
   */
  private removeAircraftBasedOnCondition(
    shouldRemove: (aircraft: Aircraft) => boolean
  ) {
    let length = Globals.PlanesOrdered.length;

    for (let i = 0; i < length; i++) {
      let aircraft = Globals.PlanesOrdered.shift();

      if (!aircraft) continue;

      // Entscheide, ob entfernt werden soll oder nicht
      if (shouldRemove(aircraft)) {
        this.removeAircraft(aircraft);
      } else {
        Globals.PlanesOrdered.push(aircraft);
      }
    }
  }

  private removeAllRemotePlanes() {
    this.removeAircraftBasedOnCondition(
      (aircraft) =>
        !aircraft.isMarked &&
        aircraft.isFromRemote !== undefined &&
        aircraft.isFromRemote !== null
    );
  }

  private removeAllNotSelectedFeederPlanes(selectedFeeder: string) {
    this.removeAircraftBasedOnCondition(
      (aircraft) =>
        !aircraft.isMarked && !aircraft.feederList.includes(selectedFeeder)
    );
  }

  private removeISSFromPlanes() {
    this.removeAircraftBasedOnCondition(
      (aircraft) => !aircraft.isMarked && aircraft.hex === 'ISS'
    );
  }

  private removeAllNotSelectedPlanes() {
    this.removeAircraftBasedOnCondition((aircraft) => !aircraft.isMarked);
  }

  private removePlanesNotInCurrentExtent(extent) {
    this.removeAircraftBasedOnCondition(
      (aircraft) =>
        !aircraft.isMarked && !this.planeInView(aircraft.position, extent)
    );
  }

  private planeInView(position: number[], extent: any): boolean {
    if (position == null) return false;

    let lon = position[0];
    let lat = position[1];

    let minLon = extent[0];
    let minLat = extent[1];
    let maxLon = extent[2];
    let maxLat = extent[3];

    if (lat < minLat || lat > maxLat) return false;

    if (extent[2] - extent[0] > 40075016) {
      // all longtitudes in view, only check latitude
      return true;
    } else if (minLon < maxLon) {
      // no wraparound: view not crossing 179 to -180 transition line
      return lon > minLon && lon < maxLon;
    } else {
      // wraparound: view crossing 179 to -180 transition line
      return lon > minLon || lon < maxLon;
    }
  }

  /**
   * Zentriert die Karte über der ISS wenn centerMapOnIss true ist.
   * Ansonsten wird die vorherige Kartenposition als Zentrum genommen
   * @param centerMapOnIss boolean
   */
  private toggleCenterMapOnIss(centerMapOnIss: boolean) {
    if (!this.showIss) return;

    if (centerMapOnIss) {
      this.getISSFromServer();
    } else {
      // Setze Center der Map auf die gespeicherte Position zurueck
      if (!this.oldISSCenterPosition || !this.oldISSCenterZoomLevel) return;
      this.centerMap(
        this.oldISSCenterPosition[0],
        this.oldISSCenterPosition[1],
        this.oldISSCenterZoomLevel
      );
    }
  }

  private getISSFromServer() {
    this.serverService
      .getISSWithoutExtent()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (IssJSONObject) => this.processISS(IssJSONObject),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error updating the iss without extent from the server. Is the server running?'
          )
      );
  }

  private processISS(IssJSONObject: any) {
    if (!IssJSONObject) return;

    // Mache Update der angezeigten Flugzeuge
    this.processPlanesUpdate([IssJSONObject]);

    // Aktualisiere Flugzeug-Tabelle mit der globalen Flugzeug-Liste
    this.aircraftTableService.updateAircraftList(Globals.PlanesOrdered);

    let iss: Aircraft = this.Planes['ISS'];

    let issPosition = iss.position;
    if (issPosition == undefined) return;

    // Speichere alte View-Position der Karte ab
    this.oldISSCenterPosition = olProj.transform(
      this.OLMap.getView().getCenter(),
      'EPSG:3857',
      'EPSG:4326'
    );
    this.oldISSCenterZoomLevel = this.OLMap.getView().getZoom();

    // Zentriere Karte auf ISS
    this.centerMap(issPosition[0], issPosition[1], Globals.zoomLevel);

    // Merke am Flugzeug, dass Aufruf bereits getätigt wurde (ISS ist Sonderfall)
    iss.allDataWasRequested = true;
  }

  /**
   * Erstellt eine Interaktion mit der der aktuelle Geräte-Standort
   * ausgewählt werden kann. Nach einer Auswahl wird die Interaktion
   * wieder gelöscht
   */
  private setCurrentDevicePosition() {
    // Erstelle Interaktion, um einen Point zu zeichnen
    let draw = new Draw({
      source: this.DrawFeature,
      type: 'Point',
      style: Styles.DevicePositionStyle,
    });
    this.OLMap.addInteraction(draw);

    // Nach Zeichnen eines Points entferne Interaktion wieder
    draw.on('drawend', (evt) => {
      this.OLMap.removeInteraction(draw);

      // Speichere Koordinaten des erstellten Points im LocalStorage ab
      let point = <Point>evt.feature.getGeometry();
      let coordinates = point.getCoordinates();

      // Transformiere Koordinaten in EPSG:3857
      Globals.DevicePosition = olProj.toLonLat(coordinates, 'EPSG:3857');

      Storage.savePropertyInLocalStorage(
        'coordinatesDevicePosition',
        Globals.DevicePosition
      );

      this.DrawFeature.clear();
      this.drawDevicePositionFromLocalStorage();
    });
  }

  /**
   * Markiert den aktuellen Geräte-Standort auf der Karte
   */
  private drawDevicePositionFromLocalStorage() {
    // Schaue im LocalStorage nach bereits gespeicherten Geräte-Standort
    // nach und erstelle Feature
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      let coordinatesDevicePosition = Storage.getPropertyFromLocalStorage(
        'coordinatesDevicePosition',
        null
      );

      if (coordinatesDevicePosition) {
        // Speichere Koordinaten in globaler Variable ab (lon, lat)
        Globals.DevicePosition = coordinatesDevicePosition;
      } else if (Globals.DevicePosition !== null) {
        coordinatesDevicePosition = Globals.DevicePosition;
      }

      if (
        coordinatesDevicePosition == undefined ||
        coordinatesDevicePosition == null
      )
        return;

      // Lösche bisherige Geräte-Position, wenn diese existiert
      if (
        Globals.DevicePosition !== null ||
        localStorage.getItem('coordinatesDevicePosition') !== null
      ) {
        this.removeFeatureFromFeatures(
          this.StaticFeatures,
          'name',
          'devicePosition'
        );
      }

      let feature = new Feature(
        new Point(olProj.fromLonLat(coordinatesDevicePosition))
      );
      feature.setStyle(Styles.DevicePositionStyle);
      feature.set('name', 'devicePosition');
      this.StaticFeatures.addFeature(feature);
    }
  }

  private deleteDevicePosition() {
    if (
      Globals.DevicePosition !== null ||
      localStorage.getItem('coordinatesDevicePosition') !== null
    ) {
      // Lösche bisherige Geräte-Position, wenn diese existiert
      this.removeFeatureFromFeatures(
        this.StaticFeatures,
        'name',
        'devicePosition'
      );

      localStorage.removeItem('coordinatesDevicePosition');

      // reset
      Globals.DevicePosition = null;
    }
  }

  private removeFeatureFromFeatures(
    vectorFeatures: Vector<Geometry>,
    featureKey: string,
    featureValue: string
  ) {
    if (!vectorFeatures) return;

    const features = vectorFeatures.getFeatures();
    const featuresToRemove = features.filter(
      (feature: { get: (arg: string) => any }) =>
        feature.get(featureKey) === featureValue
    );
    featuresToRemove.forEach((feature) =>
      vectorFeatures.removeFeature(feature)
    );
  }

  /**
   * Erstellt die Range-Ringe mit dem aktuellen Geräte-Standort als
   * Zentrum oder der Antennen-Position als Zentrum (Site-Position)
   * @param rangeRingsToDevicePosition boolean
   */
  private setCenterOfRangeRings(rangeRingsToDevicePosition: boolean) {
    if (rangeRingsToDevicePosition) {
      if (Globals.DevicePosition)
        this.createRangeRingsAndSitePos(Globals.DevicePosition);
    } else {
      // Benutze Antennen-Position als Zentrum (Site-Position)
      this.createRangeRingsAndSitePos(Globals.SitePosition);
    }
  }

  private setLightDarkModeInMap() {
    if (!this.osmLayer) return;
    this.resetCurrentCSSFilter();
    this.createNewLuminosityFilter(Globals.luminosityValueMap.toString());
  }

  private createNewLuminosityFilter(brightnessValue: string) {
    var filter = new Colorize();
    filter.setFilter({
      operation: 'luminosity',
      value: brightnessValue,
    });
    this.osmLayer.addFilter(filter);
  }

  private enableDisableCurrentFilters(filters: [], enable: boolean) {
    for (let i = 0; i < filters.length; i++) {
      this.osmLayer.getFilters()[i].setActive(enable);
    }
  }

  private createOrHideRainViewerRain(showRainViewerRain: boolean) {
    this.showRainViewerRain = showRainViewerRain;

    if (this.showRainViewerRain || this.showRainViewerRainForecast) {
      this.createRainViewerRainLayer();

      if (this.refreshIntervalIdRainviewer == undefined) {
        this.initUpdateRainViewerData();
      }

      // initial data request
      this.makeRequestRainviewerApi();
    } else {
      this.removeRainViewerRainLayer();
    }

    // Stoppe forecast animation
    if (!this.showRainViewerRainForecast) {
      this.stopRainForecastAnimation();
    }

    // Stoppe requests nach rainviewer, wenn weder rain noch clouds angezeigt werden sollen
    if (
      !this.showRainViewerRain &&
      !this.showRainViewerClouds &&
      !this.showRainViewerRainForecast
    ) {
      this.stopRequestsToRainviewer();
    }

    this.rainviewerRainLayer?.set(
      'visible',
      this.showRainViewerRain || this.showRainViewerRainForecast
    );
  }

  private createOrHideRainViewerClouds(showRainViewerClouds: boolean) {
    this.showRainViewerClouds = showRainViewerClouds;

    if (this.showRainViewerClouds) {
      this.createRainViewerCloudsLayer();

      if (this.refreshIntervalIdRainviewer == undefined) {
        this.initUpdateRainViewerData();
      }

      // initial data request
      this.makeRequestRainviewerApi();
    } else {
      this.removeRainViewerCloudsLayer();
    }

    // Stoppe requests nach rainviewer, wenn weder rain noch clouds angezeigt werden sollen
    if (!this.showRainViewerRain && !this.showRainViewerClouds) {
      this.stopRequestsToRainviewer();
    }

    this.rainviewerCloudsLayer?.set('visible', this.showRainViewerClouds);
  }

  private removeRainViewerCloudsLayer() {
    this.layers?.remove(this.rainviewerCloudsLayer);
  }

  private createRainViewerCloudsLayer() {
    if (this.layers == undefined) return;

    this.rainviewerCloudsLayer = new TileLayer({
      source: new XYZ({
        url: '',
      }),
      opacity: 0.4,
    });

    this.layers.push(this.rainviewerCloudsLayer);
  }

  private initUpdateRainViewerData() {
    // Update der Rainviewer-Daten alle zwanzig Sekunden automatisch,
    // auch wenn sich Map nicht bewegt
    this.refreshIntervalIdRainviewer = window.setInterval(() => {
      this.makeRequestRainviewerApi();
    }, 20000);
  }

  private stopRequestsToRainviewer() {
    clearInterval(this.refreshIntervalIdRainviewer);
    this.refreshIntervalIdRainviewer = undefined;
  }

  private createRainViewerRainLayer() {
    if (this.layers == undefined) return;

    this.rainviewerRainLayer = new TileLayer({
      source: new XYZ({
        url: '',
      }),
      opacity: 0.4,
    });

    this.layers.push(this.rainviewerRainLayer);
  }

  private removeRainViewerRainLayer() {
    this.layers?.remove(this.rainviewerRainLayer);
  }

  private makeRequestRainviewerApi() {
    this.rainviewerService
      .getRainviewerUrlData()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (rainviewerUrlData) => this.processRainviewerApi(rainviewerUrlData),
        (error) => this.showErrorLogAndSnackBar('Error loading rainviewer data')
      );
  }

  private processRainviewerApi(rainviewerUrlData: any) {
    if (rainviewerUrlData === undefined) return;

    // rain
    let pastRadar: Array<any> = rainviewerUrlData.radar.past;
    // rain (forecast)
    let nowcastRadar: Array<any> = rainviewerUrlData.radar.nowcast;
    // clouds
    let infraredSatellite: Array<any> = rainviewerUrlData.satellite.infrared;

    // reset array
    this.forecastRainPathAndTime = [];

    let nowRain;
    if (pastRadar) {
      // rain
      let lastIndex = pastRadar.length - 1;
      nowRain = pastRadar[lastIndex];
      const updatedUrlRainNow = this.buildRainViewerUrlRain(nowRain.path);

      if (this.showRainViewerRain) {
        this.rainviewerRainLayer.getSource()?.setUrl(updatedUrlRainNow);
      }
    }

    if (pastRadar && nowcastRadar) {
      // rain (past + forecast)
      for (let i = 0; i < pastRadar.length; i++) {
        this.forecastRainPathAndTime.push(pastRadar[i]);
      }

      for (let j = 0; j < nowcastRadar.length; j++) {
        this.forecastRainPathAndTime.push(nowcastRadar[j]);
      }

      if (this.showRainViewerRainForecast) {
        this.stopRainForecastAnimation();
        this.updateRainViewerRainForecastLayerUrl();
      }
    }

    if (infraredSatellite) {
      // clouds
      let lastIndex = infraredSatellite.length - 1;
      let newestTimestampCloudsUrl = infraredSatellite[lastIndex].path;

      const updatedUrlClouds = this.buildRainViewerUrlClouds(
        newestTimestampCloudsUrl
      );
      this.rainviewerCloudsLayer.getSource()?.setUrl(updatedUrlClouds);
    }
  }

  private buildRainViewerUrlRain(pathFromApi: string) {
    return this.buildRainViewerUrl(pathFromApi, 512, 4, 1, 1);
  }

  private buildRainViewerUrlClouds(pathFromApi: string) {
    return this.buildRainViewerUrl(pathFromApi, 512, 0, 0, 0);
  }

  private buildRainViewerUrl(
    pathFromApi: string,
    size: number,
    color: number,
    smoothImage: number,
    displaySnowInSeperateColor: number
  ) {
    const baseUrl = 'https://tilecache.rainviewer.com';
    return (
      baseUrl +
      pathFromApi +
      '/' +
      size +
      '/{z}/{x}/{y}/' +
      color +
      '/' +
      smoothImage +
      '_' +
      displaySnowInSeperateColor +
      '.png'
    );
  }

  private updateRainViewerRainForecastLayerUrl() {
    if (this.showRainViewerRainForecast && this.forecastRainPathAndTime) {
      // initial
      this.playRainViewerForecastAnimation();

      this.refreshIntervalIdRainviewerForecast = window.setInterval(() => {
        this.playRainViewerForecastAnimation();
      }, 18000);
    }
  }

  private async playRainViewerForecastAnimation() {
    this.timeoutHandlerForecastAnimation = [];
    const intervalMs = 1000;

    for (let i = 0; i < this.forecastRainPathAndTime.length; i++) {
      let timeoutHandler = window.setTimeout(
        () =>
          this.showRainViewerForecastAnimationFrame(
            this.forecastRainPathAndTime[i]
          ),
        i * intervalMs
      );
      this.timeoutHandlerForecastAnimation.push(timeoutHandler);
    }
  }

  private showRainViewerForecastAnimationFrame(forecastRainPathAndTimeFrame) {
    if (this.showRainViewerRainForecast && this.forecastRainPathAndTime) {
      this.rainviewerRainLayer
        .getSource()
        ?.setUrl(
          this.buildRainViewerUrlRain(forecastRainPathAndTimeFrame.path)
        );
      this.showForecastHintSnackbar(forecastRainPathAndTimeFrame.time);
    }
  }

  private showForecastHintSnackbar(timestampUTC: any) {
    this.openSnackbar(new Date(timestampUTC * 1000).toLocaleTimeString(), 1000);
  }

  private stopRainForecastAnimation() {
    clearInterval(this.refreshIntervalIdRainviewerForecast);
    this.refreshIntervalIdRainviewerForecast = undefined;
    if (this.timeoutHandlerForecastAnimation) {
      for (let i = 0; i < this.timeoutHandlerForecastAnimation.length; i++) {
        clearInterval(this.timeoutHandlerForecastAnimation[i]);
      }
      this.timeoutHandlerForecastAnimation = [];
    }
  }

  private toggleShowAircraftPositions(showAircraftPositions: boolean) {
    this.showAircraftPositions = showAircraftPositions;

    if (this.OLMap && this.layers && this.webglLayer) {
      this.webglLayer.setVisible(this.showAircraftPositions);
    }
  }

  /**
   * Hole gewünschte Karte aus LocalStorage, ansonsten nehme default
   * @returns object mit MapStyle
   */
  private getMapStyleFromLocalStorage() {
    let mapStyle = Storage.getPropertyFromLocalStorage('mapStyle', null);
    return mapStyle !== null
      ? mapStyle[0] // ist object in array
      : Maps.listAvailableFreeMaps[0];
  }

  /**
   * Speichere gewünschte Karte in LocalStorage
   */
  private saveMapStyleInLocalStorage(selectedMapStyle: any) {
    let mapStyle = this.listAvailableMaps.filter(
      (mapStyle) => mapStyle.name == selectedMapStyle
    );
    Storage.savePropertyInLocalStorage('mapStyle', mapStyle);
  }

  private resetCurrentCSSFilter() {
    let currentFilters = this.osmLayer.getFilters();
    this.enableDisableCurrentFilters(currentFilters, false);
  }

  private toggleDimMap(dimMap: boolean) {
    this.shouldDimMap = dimMap;
    this.dimMapIfNecessary();
  }

  private dimMapIfNecessary() {
    if (this.shouldDimMap) {
      this.setLightDarkModeInMap();
    } else {
      this.resetCurrentCSSFilter();
    }
  }

  private showAircraftFromFeeder(selectedFeederUpdate: string[]) {
    this.selectedFeederUpdate = selectedFeederUpdate;

    // Entferne alle Flugzeuge, die nicht vom ausgewählten Feeder kommen
    if (this.selectedFeederUpdate && this.selectedFeederUpdate.length != 0) {
      for (var selectedFeeder in selectedFeederUpdate) {
        this.removeAllNotSelectedFeederPlanes(selectedFeeder);
      }
    } else if (this.selectedFeederUpdate) {
      this.removeAllNotSelectedPlanes();
    }

    // Aktualisiere Flugzeuge vom Server
    this.updatePlanesFromServer(
      this.selectedFeederUpdate,
      this.showIss,
      this.showOnlyMilitary
    );

    // Aktualisiere Daten des markierten Flugzeugs
    if (this.aircraft) {
      this.getAllAircraftData(this.aircraft);
      this.getTrailToAircraft(this.aircraft, this.selectedFeederUpdate);
    }
  }

  private setNewIconSizeScaleAndRedrawPlanes() {
    if (Globals.webgl) Globals.WebglFeatures.clear();

    // Erstelle Marker neu von jedem Flugzeug
    for (let i in Globals.PlanesOrdered) {
      const aircraft = Globals.PlanesOrdered[i];
      aircraft.clearMarker();
      aircraft.updateMarker(false);
    }
  }

  /**
   * Triggert das Zeigen oder Verstecken der 3d-Map aus der Info-Komponente heraus
   */
  receiveToggleShow3dMap() {
    let show3dMap = !this.display3dMap;
    if (show3dMap && !this.cesiumIonDefaultAccessToken) {
      this.openSnackbar(
        `Cesium Ion Default Access Token is not available. 3D-Map cannot be used!`,
        3000
      );
      show3dMap = !this.display3dMap;
      return;
    }
    this.show3dMap(show3dMap);
  }

  private show3dMap(show: boolean) {
    Globals.display3dMap = show;
  }

  private updateCesiumComponentWithAircraft() {
    if (this.aircraft && Globals.display3dMap) {
      this.cesiumService.updateAircraft(this.aircraft);
    }
  }

  private removeAllNotMilitaryPlanes() {
    this.removeAircraftBasedOnCondition(
      (aircraft) => !aircraft.isMarked && aircraft.isMilitary != 'Y'
    );
  }

  private showAllTrailsOnMap(showTrailData: boolean) {
    if (this.showTrailData) {
      new Promise(() => this.getAllTrailsFromServer());
    } else {
      if (this.allTrailsLayer) this.removeAllTrailsLayer();
    }
  }

  private removeAllTrailsLayer() {
    this.layers?.remove(this.allTrailsLayer);
    this.allTrailsLayer = undefined;
    Globals.allTrailsGroup.clear();
  }

  private createAllTrailsLayer() {
    if (this.layers == undefined) return;

    this.allTrailsLayer = new LayerGroup({
      layers: Globals.allTrailsGroup,
      zIndex: 140,
    });
    this.allTrailsLayer.set('name', 'all_ac_trail');
    this.allTrailsLayer.set('title', 'all aircraft trails');
    this.allTrailsLayer.set('type', 'overlay');
    this.layers.push(this.allTrailsLayer);
  }

  private getAllTrailsFromServer() {
    this.serverService
      .getAllTrails()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (trailsByHexArray) => {
          if (!trailsByHexArray || trailsByHexArray.length == 0) return;
          new Promise(() => this.processAllTrailsFromServer(trailsByHexArray));
        },
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error getting all trails from the server. Is the server running?'
          )
      );
  }

  private processAllTrailsFromServer(trailsByHexArray: any): Promise<void> {
    this.createAllTrailsLayer();

    for (let trailsByHex of trailsByHexArray) {
      if (!trailsByHex) return Promise.reject();

      let trail = new Trail();
      trail.makeTrail(trailsByHex);
      trail.setTrailVisibility2d(true);
    }

    return Promise.resolve();
  }

  private showHideAltitudeChartElement(showAltitudeChart: boolean) {
    this.showAltitudeChart = showAltitudeChart;

    if (!this.isDesktop) {
      document.getElementById('altitude_chart')!.style.visibility = 'hidden';
    } else {
      if (this.showAltitudeChart) {
        document.getElementById('altitude_chart')!.style.visibility = 'visible';
      } else {
        document.getElementById('altitude_chart')!.style.visibility = 'hidden';
      }
    }
  }

  private getRemoteNetworkParamter(): string | null {
    if (this.showOpenskyPlanes) {
      return 'Opensky';
    } else if (this.showAirplanesLivePlanes) {
      return 'Airplanes-Live';
    } else {
      return null;
    }
  }

  private fetchAisData() {
    const extent = this.calcCurrentMapExtent();
    if (!this.OLMap && !extent) return;

    this.serverService
      .getAisDataInExtent(
        extent[0],
        extent[1],
        extent[2],
        extent[3],
        this.showAisData
      )
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(
        (aisDataJsonArray) => this.processAisData(aisDataJsonArray),
        (error) =>
          this.showErrorLogAndSnackBar(
            'Error updating AIS data from the server. Is the server running?'
          )
      );
  }

  private processAisData(aisDataJsonArray: any) {
    if (this.showAisData) {
      // Leere AisFeatures vor jeder Iteration
      this.AisFeatures.clear();
      this.AisLabelFeatures.clear();
      this.AisOutlineFeatures.clear();

      if (aisDataJsonArray != null) {
        for (let i = 0; i < aisDataJsonArray.length; i++) {
          const ship = aisDataJsonArray[i];
          this.createShipOnMap(ship);
        }
      }
    }
  }

  private createShipOnMap(ship: any) {
    Ship.checkAircraftCarrier(ship);
    Ship.getSprite(ship);
    Ship.getNavStatusVal(ship);

    const point = new Point(olProj.fromLonLat([ship.longitude, ship.latitude]));
    let feature: any = new Feature({
      geometry: point,
    });

    feature.ship = ship;
    feature.featureName = 'AisDataPoint';

    // Füge Feature zu AisFeatures und AisLabelFeatures hinzu
    this.AisFeatures.addFeature(feature);
    this.AisLabelFeatures.addFeature(feature);

    this.aisLabelFeatureLayer.setVisible(
      Globals.showAircraftLabel && this.OLMap.getView().getZoom() > 11.5
    );

    if (
      this.OLMap.getView().getZoom() > this.minZoomAisOutlines &&
      ship.trueHeading != null &&
      ship.trueHeading != 511 &&
      ship.dimension != null
    ) {
      var shapeFeature: any = new Feature({
        geometry: Ship.createShipOutlineGeometry(ship),
      });
      shapeFeature.ship = ship;

      // Füge Feature zu AisOutlineFeatures hinzu
      this.AisOutlineFeatures.addFeature(shapeFeature);
    }
  }

  private toggleShowTrailData(showTrailData: boolean) {
    this.showTrailData = showTrailData;
    this.showAllTrailsOnMap(this.showTrailData);
  }

  private setSmallIconSize(smallIconSizeFactor: number) {
    Globals.smallScaleFactorIcons = smallIconSizeFactor;
    this.setNewIconSizeScaleAndRedrawPlanes();
  }

  private setGlobalIconSize(globalIconSizeFactor: number) {
    Globals.globalScaleFactorIcons = globalIconSizeFactor;
    this.setNewIconSizeScaleAndRedrawPlanes();
  }

  private toggleDarkStaticFeatures(darkStaticFeatures: boolean) {
    this.darkStaticFeatures = darkStaticFeatures;
    this.createRangeRingsAndSitePos(
      Globals.DevicePosition ? Globals.DevicePosition : Globals.SitePosition
    );
    this.toggleDarkModeInRangeData();
  }

  private setMapStyle(selectedMapStyle: string) {
    this.saveMapStyleInLocalStorage(selectedMapStyle);
    this.createBaseLayer();
  }

  private toggleDevicePositionAsBasis(devicePositionAsBasis: boolean) {
    Globals.useDevicePositionForDistance = devicePositionAsBasis;

    // Setze Zentrum der Range-Ringe
    this.setCenterOfRangeRings(devicePositionAsBasis);
  }

  private toggleSetCurrentDevicePosition(setDevicePosition: boolean) {
    if (setDevicePosition) {
      this.setCurrentDevicePosition();
    } else {
      this.deleteDevicePosition();
    }
  }

  private toggleWebGl(webgl: boolean) {
    // Setze globalen WebGL-Boolean
    Globals.webgl = webgl;

    // Initialisiert oder deaktiviert WebGL
    // Deaktiviert WegGL, wenn Initialisierung fehlschlägt
    Globals.webgl = this.initWebgl();
  }

  private toggleDarkMode(showDarkMode: boolean) {
    this.darkMode = showDarkMode;
    this.setCenterOfRangeRings(Globals.useDevicePositionForDistance);
  }

  private toggleShowMilitaryPlanes(showMilitaryPlanes: boolean) {
    this.showOnlyMilitary = showMilitaryPlanes;

    if (this.showOnlyMilitary) {
      this.removeAllNotMilitaryPlanes();

      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) {
        this.getAllAircraftData(this.aircraft);
      }
    } else {
      this.removeAllNotSelectedPlanes();
    }
  }

  private toggleAirportsUpdate(showAirportsUpdate: boolean) {
    this.showAirportsUpdate = showAirportsUpdate;

    if (this.showAirportsUpdate) {
      this.updateAirportsFromServer();
    } else {
      this.AirportFeatures.clear();
    }
  }

  private toggleIss(showIss: boolean) {
    this.showIss = showIss;

    // Wenn ISS nicht mehr angezeigt werden soll, entferne sie von Liste
    if (!this.showIss) {
      this.removeISSFromPlanes();
    }

    // Aktualisiere Flugzeuge vom Server
    this.updatePlanesFromServer(
      this.selectedFeederUpdate,
      this.showIss,
      this.showOnlyMilitary
    );

    // Aktualisiere Daten des markierten Flugzeugs
    if (this.aircraft) {
      this.getAllAircraftData(this.aircraft);
      this.getTrailToAircraft(this.aircraft, this.selectedFeederUpdate);
    }
  }

  private toggleAisData(showAisData: boolean) {
    this.showAisData = showAisData;

    if (this.showAisData) {
      this.fetchAisIntervalId = window.setInterval(() => {
        this.fetchAisData();
      }, 2000);
    } else {
      window.clearInterval(this.fetchAisIntervalId);
      this.fetchAisData(); // Um Verbindung zu stoppen
      this.AisFeatures.clear();
      this.AisLabelFeatures.clear();
      this.AisOutlineFeatures.clear();
    }
  }

  private toggleAirplanesLivePlanes(showAirplanesLivePlanes: boolean) {
    this.showAirplanesLivePlanes = showAirplanesLivePlanes;

    if (this.showAirplanesLivePlanes) {
      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) this.getAllAircraftData(this.aircraft);
    } else {
      this.removeAllRemotePlanes();
    }
  }

  private toggleOpenSkyPlanes(showOpenskyPlanes: boolean) {
    this.showOpenskyPlanes = showOpenskyPlanes;

    if (this.showOpenskyPlanes) {
      // Aktualisiere Flugzeuge vom Server
      this.updatePlanesFromServer(
        this.selectedFeederUpdate,
        this.showIss,
        this.showOnlyMilitary
      );

      // Aktualisiere Daten des markierten Flugzeugs
      if (this.aircraft) {
        this.getAllAircraftData(this.aircraft);
      }
    } else {
      this.removeAllRemotePlanes();
    }
  }

  private showCustomRangeData(timesAsTimestamps: number[]) {
    this.datesCustomRangeData = timesAsTimestamps;
    this.updateRangeDataFromServer();
  }

  private toggleRangeData(toggleHideRangeData: boolean): void {
    this.rangeDataIsVisible = !toggleHideRangeData;
    this.hideRangeDataOverlay(toggleHideRangeData);
  }

  private toggleFilterRangeDataByHeight(toggleMarkRangeDataByHeight: boolean) {
    this.markRangeDataByHeight = toggleMarkRangeDataByHeight;
    this.showRangeDataByHeight();
  }

  private toggleFilterRangeDataByFeeder(toggleMarkRangeDataByFeeder: boolean) {
    this.markRangeDataByFeeder = toggleMarkRangeDataByFeeder;
    this.showRangeDataByFeeder();
  }

  private showErrorLogAndSnackBar(errorMessage: string) {
    console.error(errorMessage);
    this.openSnackbar(errorMessage, 2000);
  }
}
