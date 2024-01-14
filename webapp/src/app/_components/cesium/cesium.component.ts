import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
} from '@angular/core';
import { Aircraft } from 'src/app/_classes/aircraft';
import * as Cesium from 'cesium';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { Globals } from 'src/app/_common/globals';
import { CesiumService } from 'src/app/_services/cesium-service/cesium-service.component';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { SettingsService } from 'src/app/_services/settings-service/settings-service.service';
import { takeUntil } from 'rxjs/operators';

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

  isDesktop: boolean | undefined;
  widthMap3d: string | undefined;
  heightMap3d: string | undefined;

  // Cesium
  viewer: Cesium.Viewer | undefined;
  scene: Cesium.Scene | undefined;
  camera: Cesium.Camera | undefined;

  // Settings
  display3dBuildings: boolean = false;
  osmBuildingsTileset: Cesium.Cesium3DTileset | undefined;
  displayGooglePhotorealistic3D: boolean = false;
  googlePhotorealisticTileset: any;
  displayCockpitView3d: boolean = false;
  display3dMapFullscreen: boolean = false;
  displayTerrain: boolean = false;
  enableHdr3dMap: boolean = false;
  enableShadowsMap: boolean = false;
  enableDayNightMap: boolean = false;
  followPlane3d: boolean = false;

  earthAtNightLayer: Cesium.ImageryLayer | undefined;
  initViewOnAircraft: boolean = false;
  entityGroupModel: Cesium.CustomDataSource | undefined;

  cameraFollowsPlaneInitial: any;
  aircraftPosition!: Cesium.Cartesian3;
  aircraftTrack!: number;
  aircraftPitch!: number;

  elementRef: ElementRef<any>;

  // Subscriptions
  private ngUnsubscribe = new Subject();

  constructor(
    public breakpointObserver: BreakpointObserver,
    private cesumService: CesiumService,
    private snackBar: MatSnackBar,
    private el: ElementRef
  ) {
    this.elementRef = el;
  }

  async ngOnInit(): Promise<void> {
    if (!this.cesiumIonDefaultAccessToken) return;

    // Setze Cesium Ion Default Access Token
    Cesium.Ion.defaultAccessToken = this.cesiumIonDefaultAccessToken;

    this.createCesium3dMap(this.el);

    // Initiiere Abonnements
    this.initSubscriptions();

    if (!this.camera) return;

    // Setze Home-Position auf SitePosition (Antennen-Position)
    this.setHomeToSitePosition();

    // Setze aircraft trail
    this.addAircraftAndTrailTo3DMap();
  }

  ngOnDestroy() {
    this.destroy3dAssets();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  async createCesium3dMap(el: ElementRef) {
    if (el == undefined || el == null) return;

    this.createCesiumViewer();

    this.createAirplanePicking();

    this.enableMoonSunOnMap();

    this.setupMapProviders();

    // TODO debug
    if (this.viewer) this.viewer.scene.debugShowFramesPerSecond = true;
  }

  initSubscriptions() {
    this.breakpointObserver
      .observe(['(max-width: 599px)'])
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((state: BreakpointState) => {
        this.setDesktopOrMobile(state);
      });

    // Zeige neue Daten an, wenn Flugzeug aktualisiert wurde
    this.cesumService.updateAircraftSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(async (aircraft: Aircraft) => {
        this.aircraft = aircraft;
        this.addAircraftAndTrailTo3DMap();
      });

    // Löschen alle Entitäten des Flugzeugs, da diese nicht mehr markiert ist
    this.cesumService.unmarkAircraftSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.destroyPrimitiesAndEntities();
      });
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

  setupMapProviders() {
    if (!this.viewer || !this.scene) return;

    // Entferne "earth at night" and "blue marble" (index 12)
    this.removeDefaultImageryProvier(12);
    this.removeDefaultImageryProvier(12);

    // Entferne "sentinel 2" (index 11)
    this.removeDefaultImageryProvier(11);

    this.setOsmAsDefaultMapForCesium();
  }

  removeDefaultImageryProvier(index: number) {
    if (!this.viewer || !index) return;
    this.viewer.baseLayerPicker.viewModel.imageryProviderViewModels.splice(
      index,
      1
    );
  }

  createAirplanePicking() {
    if (!this.viewer) return;

    this.viewer.screenSpaceEventHandler.setInputAction((movement) => {
      if (!this.viewer) return;

      // Picken eines Features
      const pickedFeature = this.viewer?.scene.pick(movement.position);
      if (!Cesium.defined(pickedFeature)) {
        this.viewer?.screenSpaceEventHandler.getInputAction(
          Cesium.ScreenSpaceEventType.LEFT_CLICK
        );
        return;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  setOsmAsDefaultMapForCesium() {
    if (!this.viewer || !this.scene) return;

    // Setze Openstreetmap (OSM) als Default-Karte (index 6)
    let defaultProvider =
      this.viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
    this.viewer.baseLayerPicker.viewModel.selectedImagery = defaultProvider[6];
  }

  createCesiumViewer() {
    this.viewer = new Cesium.Viewer(this.el.nativeElement, {
      sceneMode: Cesium.SceneMode.SCENE3D,
      baseLayerPicker: true,
      scene3DOnly: true,
      shadows: false,
      terrainShadows: Cesium.ShadowMode.DISABLED,
      fullscreenButton: false,
      shouldAnimate: true,
      timeline: false,
      animation: false,
      terrain: Cesium.Terrain.fromWorldTerrain(),
    });
    this.scene = this.viewer.scene;
    this.camera = this.viewer.camera;
  }

  setHomeToSitePosition() {
    if (!this.camera || !this.aircraft) return;

    var extent = Cesium.Rectangle.fromDegrees(
      Globals.SitePosition[0] - 2,
      Globals.SitePosition[1] - 2,
      Globals.SitePosition[0] + 2,
      Globals.SitePosition[1] + 2
    );

    Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;
    Cesium.Camera.DEFAULT_VIEW_FACTOR = 0;
  }

  setCameraToAircraftPosition(aircraft: Aircraft) {
    if (!this.camera || !aircraft) return;

    let altitude = aircraft.altitude;
    if (altitude == 0 || altitude < 0) {
      altitude = this.getAltitudeWhenOnGround(
        aircraft.longitude,
        aircraft.latitude
      );
    }

    const startPosition = Cesium.Cartesian3.fromDegrees(
      aircraft.position[0],
      aircraft.position[1],
      altitude * 0.3048 * 20
    );

    this.camera.setView({ destination: startPosition });
  }

  addAircraftAndTrailTo3DMap() {
    return new Promise<any>(() => {
      if (!this.aircraftReadyFor3d() || !this.scene || !this.aircraft) return;

      this.createOrUpdateTrailAndAircraft(this.aircraft);

      // Für nicht markierte Flugzeug (nur Flugzeug)
      // for (var aircraft of Globals.PlanesOrdered) {
      //   if (!aircraft.isMarked) {
      //   this.loadAircraftModel(aircraft);
      //   }
      // }
    });
  }

  createOrUpdateTrailAndAircraft(aircraft: Aircraft) {
    if (!this.scene || !this.viewer || !aircraft) return;

    const track3dObjectAircraft = this.getTrack3dObjectAircraft(aircraft);
    if (!track3dObjectAircraft) return;

    const modelGroupName = aircraft.hex + '_model';
    const polylineGroupName = aircraft.hex + '_polyline';
    const wallGroupName = aircraft.hex + '_wall';

    this.entityGroupModel = this.getOrCreateEntityGroup(modelGroupName);
    var entityGroupPolyline = this.getOrCreateEntityGroup(polylineGroupName);
    var entityGroupWall = this.getOrCreateEntityGroup(wallGroupName);

    if (!this.entityGroupModel || !entityGroupPolyline || !entityGroupWall)
      return;

    if (this.initViewOnAircraft) {
      this.setCameraToAircraftPosition(aircraft);

      // Zurücksetzen des Booleans, damit View nicht nochmal initial gesetzt wird
      this.initViewOnAircraft = false;
    }

    this.createTrail(
      track3dObjectAircraft,
      entityGroupPolyline,
      entityGroupWall
    );

    this.loadAircraftModel(aircraft, this.entityGroupModel);
  }

  getOrCreateEntityGroup(
    entityGroupModelName: string
  ): Cesium.CustomDataSource | undefined {
    if (!entityGroupModelName || !this.viewer) return;

    var entityGroup =
      this.viewer.dataSources.getByName(entityGroupModelName)[0];
    if (!entityGroup) {
      this.initViewOnAircraft = true; // Flugzeug wurde neu markiert (wichtig für Setzen des initialen Views)
      entityGroup = new Cesium.CustomDataSource(entityGroupModelName);
      this.viewer.dataSources.add(entityGroup);
    }
    return entityGroup;
  }

  getTrack3dObjectAircraft(aircraft: Aircraft) {
    return aircraft?.track3d;
  }

  createTrail(
    track3dObjectAircraft: any,
    entityGroupPolyline: Cesium.CustomDataSource,
    entityGroupWall: Cesium.CustomDataSource
  ) {
    let wallSegmentPositions: any = [];
    let wallSegmentColor: Cesium.Color | undefined;
    const lastIndex = track3dObjectAircraft.trailPoints.length - 1;

    // Update existing trail
    if (
      entityGroupPolyline.entities.values.length > 0 ||
      entityGroupWall.entities.values.length > 0
    ) {
      const lastDrawnPosition: any =
        track3dObjectAircraft.trailPoints[lastIndex - 1];
      if (!lastDrawnPosition) return;
      const position: any = track3dObjectAircraft.trailPoints[lastIndex];
      const color: Cesium.Color = track3dObjectAircraft.colors[lastIndex];
      if (lastDrawnPosition == position) return;
      this.addPositionToWallPositions(wallSegmentPositions, lastDrawnPosition);
      this.addPositionToWallPositions(wallSegmentPositions, position);
      this.createPolylineAndWall(
        entityGroupPolyline,
        entityGroupWall,
        wallSegmentPositions,
        color
      );
      return;
    }

    // Create new trail
    for (let i = 0; i < track3dObjectAircraft.trailPoints.length; i++) {
      let position: any = track3dObjectAircraft.trailPoints[i];
      let color: Cesium.Color = track3dObjectAircraft.colors[i];
      let reentered = track3dObjectAircraft.isReentered[i];

      if (!wallSegmentColor) wallSegmentColor = color;
      if (!wallSegmentColor || !color) continue;

      if (!reentered)
        this.addPositionToWallPositions(wallSegmentPositions, position);

      if (!this.colorsAreEquals(wallSegmentColor, color) || i == lastIndex) {
        this.createPolylineAndWall(
          entityGroupPolyline,
          entityGroupWall,
          wallSegmentPositions,
          wallSegmentColor
        );
        wallSegmentPositions.length = 0;
        wallSegmentColor = color;

        if (!reentered)
          this.addPositionToWallPositions(wallSegmentPositions, position);
      }
    }
  }

  addPositionToWallPositions(wallSegmentPositions: any, position: any) {
    if (!wallSegmentPositions || !this.scene) return;

    wallSegmentPositions.push(position.longitude);
    wallSegmentPositions.push(position.latitude);

    let altitude = position.altitude;
    if (position.altitude == 0 || position.altitude < 0) {
      // Hole Höhe von Terrain (wichtig, wenn Wert "on ground" gesendet wird und keine altitude vorliegt!)
      altitude = this.getAltitudeWhenOnGround(
        position.longitude,
        position.latitude
      );
    }
    wallSegmentPositions.push(altitude);
  }

  getAltitudeWhenOnGround(lon, lat): number {
    const defaultHeightInMeters = 5;

    if (!this.scene) return defaultHeightInMeters;
    let altitude = this.scene.globe.getHeight(
      Cesium.Cartographic.fromDegrees(lon, lat)
    );

    if (altitude == undefined) {
      // default, wenn kein altitude-Wert gefunden wird (in Metern)
      altitude = defaultHeightInMeters;
    }

    // Google Photogrammetrie ist höher als normales OSM-Terrain
    if (this.displayGooglePhotorealistic3D) {
      altitude += 5;
    }

    return altitude;
  }

  createPolylineAndWall(
    entityGroupPolyline: Cesium.CustomDataSource,
    entityGroupWall: Cesium.CustomDataSource,
    positions,
    color
  ) {
    if (
      !this.viewer ||
      !positions ||
      !color ||
      !this.scene ||
      !entityGroupPolyline ||
      !entityGroupWall
    )
      return;

    this.createPolyline(entityGroupPolyline, positions, color);
    this.createWallSegment(entityGroupWall, positions, color);
  }

  private createWallSegment(
    entityGroupWall: Cesium.CustomDataSource,
    positions: any,
    color: any
  ) {
    entityGroupWall.entities.add({
      wall: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
        material: color.withAlpha(0.3),
      },
    });
  }

  private createPolyline(
    entityGroupPolyline: Cesium.CustomDataSource,
    positions: any,
    color: any
  ) {
    entityGroupPolyline.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
        material: color.withAlpha(0.9),
        width: 5,
        arcType: Cesium.ArcType.GEODESIC,
      },
    });
  }

  colorsAreEquals(color1, color2) {
    return (
      color1.red == color2.red &&
      color1.green == color2.green &&
      color1.blue == color2.blue
    );
  }

  async loadAircraftModel(
    aircraft: Aircraft | undefined,
    entityGroup: Cesium.CustomDataSource
  ) {
    if (!this.scene || !this.viewer || !aircraft) return;

    // Überspringe aircraft, wenn altitude nicht gesetzt ist
    if (aircraft.altitude == undefined || aircraft.altitude == null) return;

    const hex = aircraft.hex;
    const type = aircraft.type;
    const position: Cesium.Cartesian3 = this.create3dPosition(aircraft);

    const lastTrack = aircraft.track ? aircraft.track + 90 : 0;
    // Ändere Vorzeichen von roll-Wert, damit Winkel richtig dargestellt wird
    const lastRoll = aircraft.roll ? aircraft.roll * -1 : 0;

    const heading = Cesium.Math.toRadians(lastTrack);
    const pitch = Cesium.Math.toRadians(0);
    const roll = Cesium.Math.toRadians(lastRoll);
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr
    );

    // Wichtig für Follow-Plane-Feature
    this.aircraftPosition = position;
    this.aircraftTrack = lastTrack;
    this.aircraftPitch = pitch;

    const orientationProperty = new Cesium.ConstantProperty(orientation);

    let entity = entityGroup.entities.getById(hex + '_model');

    if (!entity) {
      entity = this.createNewAircraftEntity(
        entity,
        entityGroup,
        hex,
        position,
        orientationProperty,
        type,
        aircraft
      );
    } else {
      this.updateAircraftEntity(entity, position, orientationProperty);
    }

    if (this.displayCockpitView3d) {
      entity.show = false;
      this.updateCockpitView(type, lastTrack, pitch, roll * -1, position);
    } else {
      entity.show = true;
    }

    if (this.followPlane3d) {
      this.makeCameraFollowPlane(entity, lastTrack, pitch, true);
    }
  }

  private create3dPosition(aircraft: Aircraft) {
    if (!this.scene) return;

    let position: any;
    if (aircraft.onGround || aircraft.altitude == 0 || aircraft.altitude < 0) {
      // Hole Höhe von Terrain (wichtig, wenn Wert "on ground" gesendet wird und keine altitude vorliegt!)
      let altitude = this.getAltitudeWhenOnGround(
        aircraft.longitude,
        aircraft.latitude
      );

      position = Cesium.Cartesian3.fromDegrees(
        aircraft.position[0],
        aircraft.position[1],
        altitude
      );
    } else {
      position = Cesium.Cartesian3.fromDegrees(
        aircraft.position[0],
        aircraft.position[1],
        aircraft.altitude ? aircraft.altitude * 0.3048 : 0
      );
    }
    return position;
  }

  private updateCockpitView(
    type: string,
    lastTrack: number,
    pitch: number,
    roll: number,
    position: any
  ) {
    if (!this.viewer) return;

    if (type == 'ISS') pitch = Cesium.Math.toRadians(-25);

    const hprCockpit = new Cesium.HeadingPitchRoll(
      Cesium.Math.toRadians(lastTrack - 90),
      pitch,
      roll
    );
    this.viewer.scene.camera.setView({
      destination: position,
      orientation: hprCockpit,
    });
  }

  private updateAircraftEntity(
    entity: Cesium.Entity,
    position: any,
    orientationProperty: Cesium.ConstantProperty
  ) {
    entity.position = position;
    entity.orientation = orientationProperty;
  }

  private createNewAircraftEntity(
    entity: Cesium.Entity | undefined,
    entityGroup: Cesium.CustomDataSource,
    hex: string,
    position: any,
    orientationProperty: Cesium.ConstantProperty,
    type: string,
    aircraft: Aircraft
  ) {
    entity = entityGroup.entities.add({
      id: hex + '_model',
      name: hex,
      position: position,
      orientation: orientationProperty,
      model: {
        uri: this.createUriForModel(type),
        minimumPixelSize: 20,
        scale: 2,
      },
      label: {
        text: aircraft.flightId + '\n' + hex + '\n' + aircraft.type,
        verticalOrigin: Cesium.VerticalOrigin.TOP,
        horizontalOrigin: Cesium.HorizontalOrigin.RIGHT,
        font: 'bold 10px Roboto',
        fillColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL,
        pixelOffset: new Cesium.Cartesian2(20, -50),
        showBackground: true,
        backgroundColor: new Cesium.Color(0.2, 0.2, 0.2, 0.5),
      },
    });
    return entity;
  }

  createUriForModel(
    type: string
  ): string | Cesium.Property | Cesium.Resource | undefined {
    return Globals.urlGetModelFromServer + '?type=' + type;
  }

  aircraftReadyFor3d() {
    return this.aircraft != null && this.aircraft.track3d != null;
  }

  destroy3dAssets() {
    this.destroyPrimitiesAndEntities();
    this.camera = undefined;

    this.aircraft = null;

    this.removeOsm3dBuildings();
    this.removeGooglePhotorealistic3D();

    this.osmBuildingsTileset = undefined;
    this.googlePhotorealisticTileset = undefined;

    this.initViewOnAircraft = false;
  }

  destroyPrimitiesAndEntities() {
    this.viewer?.dataSources.removeAll();
    this.viewer?.entities.removeAll();
  }

  close3dMap() {
    Globals.display3dMap = false;
  }

  resetToNorth3dMap() {
    if (!this.camera) return;
    this.camera.setView({
      orientation: {
        heading: 0,
      },
    });
  }

  show3dBuildings() {
    if (!this.viewer) return;

    if (!this.display3dBuildings) {
      if (!this.osmBuildingsTileset) {
        this.createOsmBuildings();
      }
    } else {
      this.removeOsm3dBuildings();
    }
  }

  async createOsmBuildings() {
    if (!this.viewer) return;

    try {
      const scene = this.viewer?.scene;

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
    if (!this.viewer) return;
    const scene = this.viewer?.scene;
    if (this.osmBuildingsTileset)
      scene.primitives.remove(this.osmBuildingsTileset);
    this.osmBuildingsTileset = undefined;
    this.display3dBuildings = false;
  }

  showGooglePhotorealistic3D() {
    if (!this.viewer) return;

    if (!this.displayGooglePhotorealistic3D) {
      if (!this.googlePhotorealisticTileset) {
        this.createGooglePhotorealistic3D();
      }
    } else {
      this.removeGooglePhotorealistic3D();
    }
  }

  async createGooglePhotorealistic3D() {
    if (!this.viewer || !this.scene) return;

    // Füge Photorealistic 3D Tiles hinzu
    try {
      this.googlePhotorealisticTileset =
        await Cesium.Cesium3DTileset.fromIonAssetId(2275207, {
          preloadWhenHidden: true,
          dynamicScreenSpaceError: true,
          skipLevelOfDetail: true,
          immediatelyLoadDesiredLevelOfDetail: true,
          projectTo2D: false,
          loadSiblings: true,
        });
      this.scene.primitives.add(this.googlePhotorealisticTileset);
      this.displayGooglePhotorealistic3D = true;
      // Globe muss nicht angezeigt werden, da die Photorealistic 3D Tiles das Terrain beinhalten
      this.scene.globe.show = false;
    } catch (error) {
      this.openSnackBar(
        `Error loading Photorealistic 3D Tiles tileset. ${error}`,
        'OK'
      );
      this.removeGooglePhotorealistic3D();
    }
  }

  removeGooglePhotorealistic3D() {
    if (!this.viewer || !this.scene) return;

    if (this.googlePhotorealisticTileset)
      this.scene.primitives.remove(this.googlePhotorealisticTileset);
    this.scene.globe.show = true;
    this.googlePhotorealisticTileset = undefined;
    this.displayGooglePhotorealistic3D = false;
  }

  showCockpitView3d() {
    if (this.displayCockpitView3d) {
      this.displayCockpitView3d = false;
      this.setCameraToAircraftPosition(this.aircraft!);
    } else {
      this.displayCockpitView3d = true;
    }
    // Initiiere Update
    this.addAircraftAndTrailTo3DMap();
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }

  show3dMapFullscreen() {
    if (!this.viewer || !this.scene || !this.isDesktop) return;

    this.display3dMapFullscreen = this.display3dMapFullscreen ? false : true;
    let cesiumMap = document.getElementById('cesium-map');

    if (this.display3dMapFullscreen) {
      this.widthMap3d = '100vw';
      if (cesiumMap) cesiumMap.style.width = '100vw';
    } else {
      this.widthMap3d = '40rem';
      if (cesiumMap) cesiumMap.style.width = '40rem';
    }
  }

  enableHdr3dOnMap() {
    if (!this.viewer || !this.scene) return;
    this.enableHdr3dMap = !this.enableHdr3dMap;

    if (this.enableHdr3dMap) {
      this.scene.highDynamicRange = true;
      this.scene.msaaSamples = 8;
      this.scene.postProcessStages.fxaa.enabled = true;
    } else {
      this.scene.highDynamicRange = false;
      this.scene.msaaSamples = 1;
      this.scene.postProcessStages.fxaa.enabled = false;
    }
  }

  enableMoonSunOnMap() {
    if (!this.viewer || !this.scene) return;
    const sunLight = new Cesium.SunLight();
    this.scene.light = sunLight;
    this.scene.sun.glowFactor = 1.0;
    this.scene.sunBloom = true;
    this.scene.sun.show = true;
    this.scene.skyBox.show = true;
    this.scene.moon.show = true;
    this.scene.postProcessStages.add(
      Cesium.PostProcessStageLibrary.createLensFlareStage()
    );
  }

  enableShadowsOnMap() {
    if (!this.viewer || !this.scene) return;

    this.enableShadowsMap = !this.enableShadowsMap;
    const globe = this.scene.globe;
    if (this.enableShadowsMap) {
      this.viewer.shadows = true;
      this.viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
      globe.enableLighting = true;
      globe.atmosphereLightIntensity = 20.0;
      globe.dynamicAtmosphereLighting = true;
      globe.dynamicAtmosphereLightingFromSun = true;
    } else {
      this.viewer.shadows = false;
      this.viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
      globe.enableLighting = false;
      globe.atmosphereLightIntensity = 10.0;
      globe.dynamicAtmosphereLighting = false;
      globe.dynamicAtmosphereLightingFromSun = false;
    }
  }

  async enableDayNightOnMap() {
    if (!this.viewer || !this.scene) return;

    if (!this.earthAtNightLayer) {
      this.earthAtNightLayer = Cesium.ImageryLayer.fromProviderAsync(
        Cesium.IonImageryProvider.fromAssetId(3812, {}),
        {}
      );
    }

    if (!this.earthAtNightLayer) return;

    this.enableDayNightMap = !this.enableDayNightMap;

    if (this.enableDayNightMap) {
      if (this.displayTerrain) {
        this.displayTerrain = false;
        // Entferne terrain, da ansonsten Layer nicht richtig angezeigt werden
        this.viewer.scene.terrainProvider =
          new Cesium.EllipsoidTerrainProvider();
      }
      const imagerLayers = this.viewer.imageryLayers;
      if (imagerLayers.length > 1) {
        // Verstecke den Layer, wenn dieser bereits hinzugefügt wurde
        this.earthAtNightLayer.show = true;
        return;
      }

      this.addEarthAtNightLayerToLayers();
    } else {
      if (!this.earthAtNightLayer) return;
      this.earthAtNightLayer.show = false;
    }
  }

  addEarthAtNightLayerToLayers() {
    if (!this.viewer || !this.scene || !this.earthAtNightLayer) return;
    this.viewer.imageryLayers.add(this.earthAtNightLayer);
    let dynamicLighting = true;
    this.viewer.scene.globe.enableLighting = dynamicLighting;
    this.viewer.clock.shouldAnimate = dynamicLighting;
    this.earthAtNightLayer.dayAlpha = dynamicLighting ? 0.0 : 1.0;
  }

  followUnfollowPlane3d() {
    if (
      !this.viewer ||
      !this.scene ||
      !this.entityGroupModel ||
      this.aircraft == null
    )
      return;
    this.followPlane3d = !this.followPlane3d;

    if (this.followPlane3d) {
      let entity = this.entityGroupModel.entities.getById(
        this.aircraft.hex + '_model'
      );
      if (!entity) {
        this.followPlane3d = false;
        return;
      }

      this.makeCameraFollowPlane(
        entity,
        this.aircraftTrack,
        this.aircraftPitch,
        false
      );
      this.viewer.trackedEntity = entity;
    } else {
      this.viewer.trackedEntity = undefined;
      this.setCameraToAircraftPosition(this.aircraft);
      this.cameraFollowsPlaneInitial = false;
    }
  }

  makeCameraFollowPlane(entity, track, pitch, isPlaneUpdate) {
    if (!this.viewer || !this.scene || !entity) return;

    if (isPlaneUpdate) {
      if (!this.cameraFollowsPlaneInitial) {
        const hpRange = new Cesium.HeadingPitchRange();
        hpRange.heading = Cesium.Math.toRadians(track - 90);
        hpRange.pitch = pitch;
        hpRange.range = 150;

        this.viewer.camera.lookAt(this.aircraftPosition, hpRange);

        this.cameraFollowsPlaneInitial = true;
      }
    }

    this.viewer.trackedEntity = entity;
  }
}
