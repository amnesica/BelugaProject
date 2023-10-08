import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { Aircraft } from 'src/app/_classes/aircraft';
import OLCesium from 'ol-cesium';
import * as Cesium from 'cesium';
import { fromLonLat } from 'ol/proj';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { Globals } from 'src/app/_common/globals';
import Collection from 'ol/Collection';
import { CesiumService } from 'src/app/_services/cesium-service/cesium-service.component';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { Maps } from 'src/app/_classes/maps';
import * as olInteraction from 'ol/interaction';

@Component({
  selector: 'app-cesium',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cesium.component.html',
  styleUrls: ['./cesium.component.css'],
})
export class CesiumComponent implements OnInit {
  // Flugzeug, wofür die 3d-Komponente angezeigt wird (Eingabeparameter)
  @Input() aircraft: Aircraft | null = null;

  // Cesium Ion Default Access Token (Eingabeparameter)
  @Input() cesiumIonDefaultAccessToken: any;

  // Cesium Google Maps API-Key (Eingabeparameter)
  @Input() cesiumGoogleMapsApiKey: any;

  OL3dMap: any;
  layers3d!: Collection<any>;
  ol3d: OLCesium;

  isDesktop: boolean | undefined;
  widthMap3d: string | undefined;
  heightMap3d: string | undefined;

  camera: any;
  osmLayer: any;

  // OSM 3d buildings
  display3dBuildings: boolean = false;
  osmBuildingsTileset: Cesium.Cesium3DTileset | undefined;

  // Google photorealisitc 3d map
  displayGooglePhotorealistic3D: boolean = false;
  googlePhotorealisticTileset: any;

  displayTrailLine3d: boolean = true; // default
  displayTrailBar3d: boolean = false;
  displayTrailBarLine3d: boolean = false;

  displayTrailLine3dOld: boolean = false;
  displayTrailBar3dOld: boolean = false;
  displayTrailBarLine3dOld: boolean = false;

  displayCockpitView3d: boolean = false;

  display3dMapFullscreen: boolean = false;

  enableHdr3dMap: boolean = false;
  enableMoonSunMap: boolean = false;
  enableShadowsMap: boolean = false;

  // Initialer Wert von Globals
  resolutionValue: number = Globals.resolution3dMapValue;

  // Aktuell ausgewählter Map-Stil
  currentSelectedMapStyle: any;

  // Subscriptions
  subscriptions: Subscription[] = [];

  constructor(
    public breakpointObserver: BreakpointObserver,
    private cesumService: CesiumService,
    private snackBar: MatSnackBar,
    private settingsService: SettingsService
  ) {}

  initSubscriptions() {
    let sub1 = this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe()
      .subscribe((state: BreakpointState) => {
        this.setDesktopOrMobile(state);
      });
    this.subscriptions.push(sub1);

    // Zeige neue Daten an, wenn Flugzeuge aktualisiert wurden
    let sub2 = this.cesumService.aircraftSource$
      .pipe()
      .subscribe((aircraft: Aircraft) => {
        this.aircraft = aircraft;
        this.addTrailToLayer();
      });
    this.subscriptions.push(sub2);

    // Passe Camera an, wenn sich Position des Flugzeugs geändert hat
    let sub3 = this.cesumService.aircraftChangedPositionSource$
      .pipe()
      .subscribe((aircraft: Aircraft) => {
        this.aircraft = aircraft;

        // Aktualisiere Cockpit-View, wenn benötigt
        if (this.displayCockpitView3d) {
          this.updateCockpitView();
        }
      });
    this.subscriptions.push(sub3);

    // Passe Resolution der 3d-Map an
    let sub4 = this.settingsService.cesiumResolutionValueSource$
      .pipe()
      .subscribe((resolutionValue: number) => {
        this.resolutionValue = resolutionValue;
        if (!this.ol3d) return;
        this.ol3d.setResolutionScale(this.resolutionValue);
      });
    this.subscriptions.push(sub4);

    // Callback für anderen Map-Stil
    let sub5 = this.settingsService.selectMapStyleSource$
      .pipe()
      .subscribe((selectedMapStyle) => {
        this.currentSelectedMapStyle = selectedMapStyle;
        this.createBaseLayer();
      });

    this.subscriptions.push(sub5);
  }

  setDesktopOrMobile(state: BreakpointState) {
    if (state.matches) {
      // Setze Variable auf 'Mobile'
      this.isDesktop = false;

      // Setze Breite der Map
      if (this.isDesktop) {
        this.widthMap3d = '40rem';
      } else {
        this.widthMap3d = '100vw';
      }
    } else {
      // Setze Variable auf 'Desktop'
      this.isDesktop = true;

      // Setze Breite der Map
      if (this.isDesktop) {
        this.widthMap3d = '40rem';
      } else {
        this.widthMap3d = '100vw';
      }
    }
  }

  createBaseLayer() {
    this.currentSelectedMapStyle = this.getMapStyleFromLocalStorage();

    if (this.layers3d == undefined) {
      this.layers3d = new Collection();
    }

    if (this.layers3d.getLength() > 0) {
      // Entferne alten osmLayer um Performance zu verbessern, wenn Map ausgetauscht wird
      this.layers3d.removeAt(0);
    }

    this.osmLayer = new TileLayer({
      source: new OSM({
        url: this.currentSelectedMapStyle.url,
        attributions: this.currentSelectedMapStyle.attribution,
        imageSmoothing: false,
      }),
      preload: 0,
      useInterimTilesOnError: false,
    });

    this.layers3d.insertAt(0, this.osmLayer);
  }

  addTrailToLayer() {
    if (this.aircraftReadyFor3d()) {
      this.removePreviousTrailLayer();

      this.layers3d.push(this.aircraft!.layer3dLine);
      this.layers3d.push(this.aircraft!.layer3dBar);

      this.showTrailBarOrLine();
    }
  }

  aircraftReadyFor3d() {
    return (
      this.layers3d &&
      this.aircraft != null &&
      this.aircraft.layer3dBar != null &&
      this.aircraft.layer3dLine != null &&
      this.aircraft.trackLinePoints3dLine != null &&
      this.aircraft.trackLinePoints3dBar != null
    );
  }

  toRadians(degrees) {
    if (typeof degrees == undefined) return;
    return ((degrees * Math.PI) / 180.0) * -1;
  }

  removePreviousTrailLayer() {
    while (this.layers3d.getLength() > 1) {
      this.layers3d.removeAt(this.layers3d.getLength() - 1);
    }
  }

  create3dMap() {
    if (this.OL3dMap == null) {
      let interactions = olInteraction.defaults({
        altShiftDragRotate: true,
        pinchRotate: true,
        doubleClickZoom: true,
        dragPan: true,
        pinchZoom: true,
      });

      // Initialisiere OL Map
      this.OL3dMap = new Map({
        target: 'map_canvas_3d',
        interactions: interactions,
        layers: this.layers3d,
        view: new View({
          center: fromLonLat(this.aircraft!.position),
          zoom: this.aircraft?.hex == 'ISS' ? 7 : 11,
        }),
      });
    }
  }

  async createCesium3dMap() {
    // Erstelle OLCesium
    if (this.OL3dMap != null) {
      this.ol3d = new OLCesium({
        map: this.OL3dMap,
        target: 'cesium-map',
        scene3DOnly: true, // Lade nur 3D- und nicht 2D Karte zusätzlich
      });

      const scene = this.ol3d.getCesiumScene();

      // Performance improvements
      this.ol3d.setResolutionScale(this.resolutionValue);
      this.ol3d.setTargetFrameRate(Number.POSITIVE_INFINITY);
      this.ol3d.enableAutoRenderLoop();
      scene.requestRenderMode = true;
      scene.maximumRenderTimeChange = Infinity;

      // Terrain
      Cesium.createWorldTerrainAsync().then(
        (tp) => (scene.terrainProvider = tp)
      );
      const globe = scene.globe;
      globe.enableTerrain = true;

      // Setze Kamera-Winkel
      this.camera = this.ol3d.getCamera();
      this.camera.setTilt(Math.PI / 3);
      this.camera.setHeading(0);

      this.ol3d.setEnabled(true);
    }
  }

  async ngOnInit(): Promise<void> {
    if (!this.cesiumIonDefaultAccessToken) return;

    // Setze Cesium Ion Default Access Token
    Cesium.Ion.defaultAccessToken = this.cesiumIonDefaultAccessToken;

    // Initiiere Abonnements
    this.initSubscriptions();

    if (this.aircraft == null || this.aircraft == undefined) {
      console.log('Ol-Cesium Error: aircraft is null!');
      return;
    }

    this.createBaseLayer();

    this.create3dMap();

    this.addTrailToLayer();

    this.createCesium3dMap();
  }

  destroy3dAssets() {
    this.removeOsm3dBuildings();
    this.removeGooglePhotorealistic3D();
    this.layers3d.clear;
    this.OL3dMap = undefined;
    this.ol3d = undefined;
    this.camera = undefined;
    this.osmBuildingsTileset = undefined;
    this.googlePhotorealisticTileset = undefined;
  }

  ngOnDestroy() {
    this.destroy3dAssets();
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  close3dMap() {
    Globals.display3dMap = false;
  }

  resetToNorth3dMap() {
    if (this.OL3dMap == null || !this.ol3d || !this.camera) return;
    this.camera.setTilt(0);
    this.camera.setHeading(0);
  }

  tiltLessOnGlobe3dMap() {
    if (this.OL3dMap == null || !this.ol3d || !this.camera) return;
    if (this.camera.getTilt() > -1.5) {
      this.camera.setTilt(this.camera.getTilt() - 0.05);
    }
  }

  tiltMoreOnGlobe3dMap() {
    if (this.OL3dMap == null || !this.ol3d || !this.camera) return;
    if (this.camera.getTilt() < 1.5) {
      this.camera.setTilt(this.camera.getTilt() + 0.05);
    }
  }

  rotateMapLeft3dMap() {
    if (this.OL3dMap == null || !this.ol3d || !this.camera) return;
    this.camera.setHeading(this.camera.getHeading() + 0.1);
  }

  rotateMapRight3dMap() {
    if (this.OL3dMap == null || !this.ol3d || !this.camera) return;
    this.camera.setHeading(this.camera.getHeading() - 0.1);
  }

  show3dBuildings() {
    if (!this.ol3d) return;

    if (!this.display3dBuildings) {
      if (!this.osmBuildingsTileset) {
        this.createOsmBuildings();
      }
    } else {
      this.removeOsm3dBuildings();
    }
  }

  async createOsmBuildings() {
    try {
      const scene = this.ol3d.getCesiumScene();

      // Füge OSM Buildings Tileset hinzu
      await Cesium.createOsmBuildingsAsync().then((osmBuildingsTileset) => {
        this.osmBuildingsTileset = osmBuildingsTileset;
        scene.primitives.add(this.osmBuildingsTileset);
        this.display3dBuildings = true;
      });
    } catch (error) {
      this.openSnackBar(
        `Error loading OSM 3D Building Tiles tileset. ${error}`,
        'OK'
      );
      this.removeOsm3dBuildings();
    }
  }

  removeOsm3dBuildings() {
    const scene = this.ol3d.getCesiumScene();
    if (this.osmBuildingsTileset)
      scene.primitives.remove(this.osmBuildingsTileset);
    this.osmBuildingsTileset = undefined;
    this.display3dBuildings = false;
  }

  showGooglePhotorealistic3D() {
    if (!this.ol3d) return;

    if (!this.displayGooglePhotorealistic3D) {
      if (!this.googlePhotorealisticTileset) {
        this.createGooglePhotorealistic3D();
      }
    } else {
      this.removeGooglePhotorealistic3D();
    }
  }

  async createGooglePhotorealistic3D() {
    if (!this.cesiumGoogleMapsApiKey) {
      this.openSnackBar(
        `Cesium Google Maps API-key is not available. Photogrammetry feature cannot be used!`,
        'OK'
      );
      return;
    }

    const scene = this.ol3d.getCesiumScene();
    // Globe muss nicht angezeigt werden, da die Photorealistic 3D Tiles das Terrain beinhalten
    scene.globe.show = false;

    Cesium.GoogleMaps.defaultApiKey = this.cesiumGoogleMapsApiKey;

    // Füge Photorealistic 3D Tiles hinzu
    try {
      await Cesium.createGooglePhotorealistic3DTileset().then((tileset) => {
        this.googlePhotorealisticTileset = tileset;
        scene.primitives.add(tileset);
        this.displayGooglePhotorealistic3D = true;
      });
    } catch (error) {
      this.openSnackBar(
        `Error loading Photorealistic 3D Tiles tileset. ${error}`,
        'OK'
      );
      this.removeGooglePhotorealistic3D();
    }
  }

  removeGooglePhotorealistic3D() {
    const scene = this.ol3d.getCesiumScene();
    if (this.googlePhotorealisticTileset)
      scene.primitives.remove(this.googlePhotorealisticTileset);
    this.googlePhotorealisticTileset = undefined;
    this.displayGooglePhotorealistic3D = false;
    scene.globe.show = true;
  }

  showTrailLine3d() {
    if (!this.OL3dMap) return;

    this.displayTrailLine3d = this.displayTrailLine3d ? false : true;
    this.displayTrailBar3d = false;
    this.displayTrailBarLine3d = false;

    this.showTrailBarOrLine();
  }

  showTrailBar3d() {
    if (!this.OL3dMap) return;

    this.displayTrailLine3d = false;
    this.displayTrailBar3d = this.displayTrailBar3d ? false : true;
    this.displayTrailBarLine3d = false;

    this.showTrailBarOrLine();
  }

  showTrailBarLine3d() {
    if (!this.OL3dMap) return;

    this.displayTrailLine3d = false;
    this.displayTrailBar3d = false;
    this.displayTrailBarLine3d = this.displayTrailBarLine3d ? false : true;

    this.showTrailBarOrLine();
  }

  showTrailBarOrLine() {
    if (!this.OL3dMap || !this.aircraft) return;

    const showLine =
      this.displayTrailLine3d &&
      !this.displayTrailBar3d &&
      !this.displayTrailBarLine3d;
    const showBar =
      !this.displayTrailLine3d &&
      this.displayTrailBar3d &&
      !this.displayTrailBarLine3d;
    const showBarLine =
      !this.displayTrailLine3d &&
      !this.displayTrailBar3d &&
      this.displayTrailBarLine3d;
    const showCockpitView = this.displayCockpitView3d;

    if (!this.displayCockpitView3d && !showLine && !showBar && !showBarLine) {
      this.aircraft!.setTrailVisibility3dBar(false);
      this.aircraft!.setTrailVisibility3dLine(false);
      this.openSnackBar('No trail is shown on the 3d map', 'OK');
    }

    if (!showCockpitView && showLine) {
      this.aircraft!.setTrailVisibility3dBar(false);
      this.aircraft!.setTrailVisibility3dLine(true);
    } else if (!showCockpitView && showBar) {
      this.aircraft!.setTrailVisibility3dBar(true);
      this.aircraft!.setTrailVisibility3dLine(false);
    } else if (!showCockpitView && showBarLine) {
      this.aircraft!.setTrailVisibility3dBar(true);
      this.aircraft!.setTrailVisibility3dLine(true);
    } else if (showCockpitView) {
      this.aircraft!.setTrailVisibility3dBar(false);
      this.aircraft!.setTrailVisibility3dLine(false);
    }
  }

  showCockpitView3d() {
    this.setCockpitPerspective();
  }

  async setCockpitPerspective() {
    if (!this.OL3dMap) return;

    if (!this.displayCockpitView3d) {
      this.updateCockpitView();

      // Speichere alte Anzeige-Attribute
      this.displayTrailLine3dOld = this.displayTrailLine3d;
      this.displayTrailBar3dOld = this.displayTrailBar3d;
      this.displayTrailBarLine3dOld = this.displayTrailBarLine3d;

      this.displayCockpitView3d = true;

      // Verstecke Trails
      this.showTrailBarOrLine();
    } else if (this.displayCockpitView3d) {
      // Reset Kamera-Winkel
      this.camera = this.ol3d.getCamera();
      this.camera.setTilt(Math.PI / 3);
      this.camera.setHeading(0);

      this.displayCockpitView3d = false;

      // Setze View auf alte Anzeige-Attribute zurück
      this.displayTrailLine3d = this.displayTrailLine3dOld;
      this.displayTrailBar3d = this.displayTrailBar3dOld;
      this.displayTrailBarLine3d = this.displayTrailBarLine3dOld;

      // Zeige Trails
      this.showTrailBarOrLine();
    }
  }

  updateCockpitView() {
    const lastIndex = this.aircraft!.trackLinePoints3dLine.length - 1;

    // Setze View-Attribute
    this.OL3dMap.getView().setCenter(
      this.aircraft!.trackLinePoints3dLine[lastIndex].coordinate
    );
    this.OL3dMap.getView().setZoom(20);

    // Setze Camera-Attribute
    this.camera.setTilt(1.5);
    this.camera.setHeading(this.toRadians(this.aircraft!.track));
    this.camera.setAltitude(
      this.aircraft!.trackLinePoints3dLine[lastIndex].altitude
    );
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }

  show3dMapFullscreen() {
    if (!this.ol3d || !this.isDesktop) return;

    this.display3dMapFullscreen = this.display3dMapFullscreen ? false : true;

    if (this.display3dMapFullscreen) {
      this.widthMap3d = '100vw';
    } else {
      this.widthMap3d = '40rem';
    }
  }

  /**
   * Hole gewünschte Karte aus LocalStorage, ansonsten nehme default
   * @returns object mit MapStyle
   */
  getMapStyleFromLocalStorage() {
    let mapStyle = localStorage.getItem('mapStyle');
    return mapStyle !== null
      ? JSON.parse(mapStyle)[0] // ist object in array
      : Maps.listAvailableFreeMaps[0];
  }

  enableHdr3dOnMap() {
    if (!this.OL3dMap) return;
    this.enableHdr3dMap = !this.enableHdr3dMap;

    const scene = this.ol3d.getCesiumScene();

    if (this.enableHdr3dMap) {
      scene.highDynamicRange = true;
      scene.allowTextureFilterAnisotropic = true;
      scene.msaaSamples = 8;
    } else {
      scene.highDynamicRange = false;
      scene.allowTextureFilterAnisotropic = false;
      scene.msaaSamples = 1;
    }
  }

  enableMoonSunOnMap() {
    if (!this.OL3dMap) return;
    this.enableMoonSunMap = !this.enableMoonSunMap;

    const scene = this.ol3d.getCesiumScene();

    if (this.enableMoonSunMap) {
      scene.sun = new Cesium.Sun();
      scene.skyBox = new Cesium.SkyBox({
        sources: {
          positiveX: '../../../assets/skybox_px.jpg',
          negativeX: '../../../assets/skybox_mx.jpg',
          positiveY: '../../../assets/skybox_py.jpg',
          negativeY: '../../../assets/skybox_my.jpg',
          positiveZ: '../../../assets/skybox_pz.jpg',
          negativeZ: '../../../assets/skybox_mz.jpg',
        },
        show: true,
      });
      scene.moon = new Cesium.Moon();
    } else {
      scene.sun = undefined;
      scene.skyBox = undefined;
      scene.moon = undefined;
    }
  }

  enableShadowsOnMap() {
    if (!this.OL3dMap) return;
    this.enableShadowsMap = !this.enableShadowsMap;

    const scene = this.ol3d.getCesiumScene();
    const globe = scene.globe;

    if (this.enableShadowsMap) {
      scene.shadows = true;
      globe.enableLighting = true;
      globe.atmosphereLightIntensity = 20.0;
      globe.dynamicAtmosphereLighting = true;
      globe.dynamicAtmosphereLightingFromSun = true;
    } else {
      scene.shadows = false;
      globe.enableLighting = false;
      globe.atmosphereLightIntensity = 10.0;
      globe.dynamicAtmosphereLighting = false;
      globe.dynamicAtmosphereLightingFromSun = false;
    }
  }
}
