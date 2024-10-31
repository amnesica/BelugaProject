import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
} from '@angular/core';
import { Aircraft } from 'src/app/_classes/aircraft';
import * as Cesium from 'cesium';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { Globals } from 'src/app/_common/globals';
import { CesiumService } from 'src/app/_services/cesium-service/cesium-service.component';
import { MatSnackBar as MatSnackBar } from '@angular/material/snack-bar';
import { takeUntil } from 'rxjs/operators';
import { slideInOutBottom } from 'src/app/_common/animations';
import { Storage } from 'src/app/_classes/storage';
import { ThemeManager } from 'src/app/_services/theme-service/theme-manager.service';

@Component({
  selector: 'app-cesium',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cesium.component.html',
  styleUrls: ['./cesium.component.scss'],
  animations: [slideInOutBottom],
})
export class CesiumComponent implements OnInit {
  // Flugzeug, wofür die 3d-Komponente angezeigt wird (Eingabeparameter)
  @Input() aircraft: Aircraft | null = null;

  // Cesium Ion Default Access Token (Eingabeparameter)
  @Input() cesiumIonDefaultAccessToken: any;

  darkMode: boolean = false;

  themeManager = inject(ThemeManager);
  isDark$ = this.themeManager.isDark$;

  isDesktop: boolean | undefined;
  widthMap3d: string | undefined;
  heightMap3d: string | undefined;

  // Cesium
  viewer: Cesium.Viewer | undefined;
  scene: Cesium.Scene | undefined;
  camera: Cesium.Camera | undefined;

  // Settings
  displayOsmBuildings3d: boolean = false;
  osmBuildingsTileset: Cesium.Cesium3DTileset | undefined;
  displayGooglePhotorealistic3d: boolean = false;
  googlePhotorealisticTileset: any;
  displayCockpitView3d: boolean = false;
  display3dMapFullscreen: boolean = false;
  displayTerrain: boolean = false;
  enableHdr3dMap: boolean = false;
  enableDayNightMap: boolean = false;
  followPlane3d: boolean = false;
  earthAtNightLayer: Cesium.ImageryLayer | undefined;
  initViewOnAircraft: boolean = false;
  cameraFollowsPlaneInitial: any;
  enableClouds: boolean = false;

  aircraftPosition!: Cesium.Cartesian3;
  aircraftTrack!: number;
  aircraftPitch!: number;
  aircraftRoll: number = 0;

  elementRef: ElementRef<any>;

  // Entity
  EntityPositions: {
    [hex: string]: Cesium.SampledPositionProperty | undefined;
  } = {};
  pathPositions: Cesium.SampledPositionProperty[] | undefined;
  startTime: Cesium.JulianDate | undefined;
  endTime: Cesium.JulianDate | undefined;
  orientationProperty: Cesium.ConstantProperty | undefined;
  pathPositionsColor: Cesium.Color | undefined;
  lastPathPositionSample: any | undefined;
  entityGroupModel: Cesium.CustomDataSource | undefined;

  // Cockpit view stuff
  EntityCockpitPositions: {
    [hex: string]: Cesium.SampledPositionProperty | undefined;
  } = {};
  planeEntityCenter: Cesium.Cartesian3 | undefined;
  handler: Cesium.ScreenSpaceEventHandler | undefined;
  startMousePosition: Cesium.Cartesian3 | undefined;
  mousePosition: Cesium.Cartesian3 | undefined;
  flags = {
    looking: false,
  };
  initFirstPersonView = true;
  cockpitViewXDirection: number | undefined;
  cockpitViewYDirection: number | undefined;
  leftDownInputAction: any;
  mouseMoveInputAction: any;
  leftUpInputAction: any;
  zoomInputAction: any;
  zoomInputActionPinch: any;
  zoomAmountCockpitViewFov: number = 59.12719755119661;
  zoomAmountCockpitView: number = 0;
  movementFactor: number = 0.1;
  showCockpitViewEventListener: Cesium.Event.RemoveCallback | undefined;
  displayCockpitModel3d: boolean = false;

  displaySettings: boolean = false;
  enableShadows3dMap: boolean = false;
  enableTerrainShadows3dMap: boolean = false;
  enableLighting3dMap: boolean = false;
  enableMsaa3dMap: boolean = false;
  enableFxaa3dMap: boolean = false;
  enableAmbientOcclusion3dMap: boolean = false;
  enableAthmosphereLight3dMap: boolean = false;
  enableFog3dMap: boolean = false;
  enableDebugInfo3dMap: boolean = false;
  sliderMsaa3dValue: any;
  enableDefaultResolution3dMap: boolean = true;

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
    this.ngUnsubscribe.next(void 0);
    this.ngUnsubscribe.complete();
  }

  async createCesium3dMap(el: ElementRef) {
    if (el == undefined || el == null) return;

    this.createCesiumViewer();

    this.removeEntityPicking();

    this.enableMoonSunOnMap();

    this.setupMapProviders();

    this.enableCollisionDetection();

    this.removeInstructionHintAtStart();

    this.enableDefaultQualitySettings();
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

    // Löschen alle Entitäten und Objekte des bisherigen Flugzeugs,
    // da dieses nicht mehr markiert ist
    this.cesumService.unmarkAircraftSource$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.destroyAllObjectsForMarkedPlane();
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

  removeEntityPicking() {
    if (!this.viewer) return;

    this.viewer.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    this.viewer.screenSpaceEventHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
  }

  setOsmAsDefaultMapForCesium() {
    if (!this.viewer || !this.scene) return;

    // Setze Openstreetmap (OSM) als Default-Karte (index 6)
    let defaultProvider =
      this.viewer.baseLayerPicker.viewModel.imageryProviderViewModels;
    this.viewer.baseLayerPicker.viewModel.selectedImagery = defaultProvider[6];
  }

  enableCollisionDetection() {
    if (!this.viewer) return;
    this.viewer.scene.screenSpaceCameraController.enableCollisionDetection =
      true;
  }

  removeInstructionHintAtStart() {
    if (!this.viewer) return;
    this.viewer.navigationHelpButton.viewModel.showInstructions = false;
  }

  enableDefaultQualitySettings() {
    if (!this.scene) return;
    this.scene.globe.depthTestAgainstTerrain = true;
    this.setQualitySettingsFromLocalStorage();
  }

  setQualitySettingsFromLocalStorage() {
    if (!this.viewer || !this.scene) return;

    this.toggleHdrOnMap(
      Storage.getPropertyFromLocalStorage('showHdr3d', false)
    );
    this.toggleShadowsOnMap(
      Storage.getPropertyFromLocalStorage('showShadows3d', false)
    );
    this.toggleTerrainShadowsOnMap(
      Storage.getPropertyFromLocalStorage('showTerrainShadows3d', false)
    );
    this.toggleLightingOnMap(
      Storage.getPropertyFromLocalStorage('showLighting3d', false)
    );
    this.toggleMsaaOnMap(
      Storage.getPropertyFromLocalStorage('showMsaa3d', false)
    );
    this.toggleFxaaOnMap(
      Storage.getPropertyFromLocalStorage('showFxaa3d', false)
    );
    this.toggleAmbientOcclusionOnMap(
      Storage.getPropertyFromLocalStorage('showAmbientOcclusion3d', false)
    );
    this.sliderMsaa3dValue = Storage.getPropertyFromLocalStorage(
      'sliderMsaa3d',
      0
    );
    this.scene.msaaSamples = this.sliderMsaa3dValue;
    this.toggleAthmosphereLightOnMap(
      Storage.getPropertyFromLocalStorage('showAthmosphereLight3d', false)
    );
    this.toggleFogOnMap(
      Storage.getPropertyFromLocalStorage('showFog3d', false)
    );
    this.toggleDebugInfoOnMap(
      Storage.getPropertyFromLocalStorage('showDebugInfo3d', false)
    );
    this.toggleDefaultResolutionOnMap(
      Storage.getPropertyFromLocalStorage('showDefaultResolution3d', true)
    );
    this.toggleOsmBuildingsOnMap(
      Storage.getPropertyFromLocalStorage('showOsmBuildings3d', false)
    );
    this.toggleGooglePhotogrammatryOnMap(
      Storage.getPropertyFromLocalStorage('showGooglePhotorealistic3d', false)
    );
    this.toggleCloudsOnMap(
      Storage.getPropertyFromLocalStorage('showClouds3d', false)
    );
    this.toggleDayNightLayerOnMap(
      Storage.getPropertyFromLocalStorage('showDayNightLayer3d', false)
    );
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
      terrain: Cesium.Terrain.fromWorldTerrain({
        requestVertexNormals: true,
        requestWaterMask: false,
      }),
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
    if (!this.camera || !aircraft || !this.viewer) return;

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

    // Resette Camera
    this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

    this.camera.setView({
      destination: startPosition,
    });
  }

  addAircraftAndTrailTo3DMap() {
    return new Promise<any>(() => {
      if (!this.aircraftReadyFor3d() || !this.scene || !this.aircraft) return;
      this.createOrUpdateTrailAndAircraft(this.aircraft);
    });
  }

  createOrUpdateTrailAndAircraft(aircraft: Aircraft) {
    if (!this.scene || !this.viewer || !aircraft) return;

    const track3dObject = aircraft.track3d;
    if (!track3dObject) {
      console.log('no track3d for ' + aircraft.hex);
      return;
    }

    const modelGroupName = aircraft.hex + '_model';
    this.entityGroupModel = this.getOrCreateEntityGroup(modelGroupName, true);
    if (!this.entityGroupModel) return;

    if (this.initViewOnAircraft) {
      this.setCameraToAircraftPosition(aircraft);

      // Zurücksetzen des Booleans, damit View nicht noch einmal initial gesetzt wird
      this.initViewOnAircraft = false;
    }

    // Trail nur für markiertes Flugzeug
    if (aircraft.isMarked) {
      this.createTrail(aircraft.track3d);
    }

    this.loadAircraftModel(aircraft, this.entityGroupModel);
  }

  getOrCreateEntityGroup(
    entityGroupModelName: string,
    isMarked: boolean
  ): Cesium.CustomDataSource | undefined {
    if (!entityGroupModelName || !this.viewer) return;

    var entityGroup =
      this.viewer.dataSources.getByName(entityGroupModelName)[0];
    if (!entityGroup) {
      // Flugzeug wurde neu markiert (wichtig für Setzen des initialen Views)
      if (isMarked) this.initViewOnAircraft = true;
      entityGroup = new Cesium.CustomDataSource(entityGroupModelName);
      this.viewer.dataSources.add(entityGroup);
    }
    return entityGroup;
  }

  createTrail(track3d: any) {
    if (!this.viewer || this.pathPositions) return;

    // Erstelle neuen Trail
    for (let i = 0; i < track3d.trailPoints.length - 1; i++) {
      const trailPoint = track3d.trailPoints[i];
      this.addTrailPointToPositions(trailPoint);
    }
  }

  addTrailPointToPositions(trailPoint: any) {
    if (!trailPoint || !this.viewer) return;

    const time = Cesium.JulianDate.fromDate(new Date(trailPoint.timestamp));

    let altitude = trailPoint.altitude;
    if (altitude == 0 || altitude < 0) {
      // Hole Höhe von Terrain (wichtig, wenn Wert "on ground" gesendet wird und keine altitude vorliegt!)
      altitude = this.getAltitudeWhenOnGround(
        trailPoint.longitude,
        trailPoint.latitude
      );
    }

    const position = Cesium.Cartesian3.fromDegrees(
      trailPoint.longitude,
      trailPoint.latitude,
      altitude
    );

    if (!this.pathPositions) {
      // Initiiere path
      this.pathPositions = [];
      this.addNewTrailPathSegment();
      this.addTrailPath(trailPoint.hex, trailPoint);
      this.pathPositionsColor = trailPoint.color;
    } else if (
      this.pathPositions &&
      !this.pathPositionsColor?.equals(trailPoint.color)
    ) {
      // Füge neues Segment hinzu, wenn Farbe sich geändert hat
      this.addNewTrailPathSegment();
      this.addTrailPath(trailPoint.hex, trailPoint);
      this.pathPositionsColor = trailPoint.color;
    }

    if (!this.pathPositions) return;

    // Füge Position zum aktuellen Path-Position-Element hinzu im Array
    this.pathPositions[this.pathPositions.length - 1].addSample(time, position);

    // Speichere aktuelles Sample ab
    this.lastPathPositionSample = { time: time, position: position };
  }

  addNewTrailPathSegment() {
    if (!this.pathPositions) return;

    this.pathPositions.push(new Cesium.SampledPositionProperty());

    if (this.lastPathPositionSample) {
      this.pathPositions[this.pathPositions.length - 1].addSample(
        this.lastPathPositionSample.time,
        this.lastPathPositionSample.position
      );
    }
  }

  addTrailPath(hex: string, trailPoint: any) {
    if (!this.viewer) return;

    if (
      !this.pathPositions ||
      !this.pathPositions[this.pathPositions.length - 1]
    )
      return;

    const pathId = this.pathPositions.length - 1;
    this.viewer.entities.add({
      id: hex + '_path_' + pathId,
      position: this.pathPositions[this.pathPositions.length - 1],
      name: hex + '_path_' + pathId,
      path: {
        show: true,
        leadTime: -1,
        trailTime: Infinity,
        width: 5,
        resolution: 1,
        material: new Cesium.ColorMaterialProperty(trailPoint.color),
      },
    });
  }

  getAltitudeWhenOnGround(longitude, latitude): number {
    const defaultHeightInMeters = 5;

    if (!this.scene) return defaultHeightInMeters;
    let altitude = this.scene.globe.getHeight(
      Cesium.Cartographic.fromDegrees(longitude, latitude)
    );

    if (altitude == undefined) {
      // default, wenn kein altitude-Wert gefunden wird (in Metern)
      altitude = defaultHeightInMeters;
    }

    // Google Photogrammetrie ist höher als normales OSM-Terrain
    if (this.displayGooglePhotorealistic3d) {
      altitude += 5;
    }

    return altitude;
  }

  async loadAircraftModel(
    aircraft: Aircraft | undefined,
    entityGroup: Cesium.CustomDataSource
  ) {
    if (!this.scene || !this.viewer || !aircraft) return;

    // Überspringe aircraft, wenn altitude nicht gesetzt ist
    if (aircraft.altitude == undefined || aircraft.altitude == null) return;

    if (aircraft.track3d.trailPoints.length <= 1) {
      aircraft.addTrack3D(
        aircraft.longitude,
        aircraft.latitude,
        aircraft.altitude,
        new Date().getTime(),
        aircraft.track,
        aircraft.roll,
        false
      );
    }

    const lastIndex = aircraft.track3d.trailPoints.length - 1;
    let lastTrail3d = aircraft.track3d.trailPoints[lastIndex];

    const lastPosition: Cesium.Cartesian3 = this.create3dPosition(
      lastTrail3d.longitude,
      lastTrail3d.latitude,
      lastTrail3d.altitude,
      aircraft.onGround
    );

    if (lastTrail3d.track == 0) {
      lastTrail3d.track = 1;
    }
    const lastTrack = lastTrail3d.track ? lastTrail3d.track + 90 : 0;
    // Ändere Vorzeichen von roll-Wert, damit Winkel richtig dargestellt wird
    const lastRoll = lastTrail3d.roll ? lastTrail3d.roll * -1 : 0;

    const lastHeadingRad = Cesium.Math.toRadians(lastTrack);
    const lastPitchRad = Cesium.Math.toRadians(aircraft.hex == 'ISS' ? 20 : 0);
    const lastRollRad = Cesium.Math.toRadians(lastRoll);
    const hpr = new Cesium.HeadingPitchRoll(
      lastHeadingRad,
      lastPitchRad,
      lastRollRad
    );
    const lastOrientation = Cesium.Transforms.headingPitchRollQuaternion(
      lastPosition,
      hpr
    );

    // Wichtig für Follow-Plane-Feature
    this.aircraftPosition = lastPosition;
    this.aircraftTrack = lastTrack;
    this.aircraftPitch = lastPitchRad;
    this.aircraftRoll = lastRollRad;

    this.orientationProperty = new Cesium.ConstantProperty(lastOrientation);

    if (!this.EntityPositions[aircraft.hex]) {
      // Initiiere 3d-Movement (erster Aufruf)
      this.initPlaneModelMovement(
        lastTrail3d,
        lastPosition,
        entityGroup,
        aircraft
      );
    } else {
      this.updatePlaneModelMovement(
        lastTrail3d,
        lastPosition,
        entityGroup,
        aircraft.hex
      );
    }

    // Stoppe Extrapolation, wenn 5 Sekunden kein Update des Flugzeugs kommt
    if (aircraft.lastSeen >= 5 && this.EntityPositions[aircraft.hex]) {
      this.EntityPositions[aircraft.hex]!.forwardExtrapolationType =
        Cesium.ExtrapolationType.HOLD;
      this.EntityCockpitPositions[aircraft.hex]!.forwardExtrapolationType =
        Cesium.ExtrapolationType.HOLD;
    } else if (aircraft.lastSeen < 5 && this.EntityPositions[aircraft.hex]) {
      this.EntityPositions[aircraft.hex]!.forwardExtrapolationType =
        Cesium.ExtrapolationType.EXTRAPOLATE;
      this.EntityCockpitPositions[aircraft.hex]!.forwardExtrapolationType =
        Cesium.ExtrapolationType.EXTRAPOLATE;
    }

    let entity = entityGroup.entities.getById(aircraft.hex + '_model');
    if (!entity) return;

    if (!this.displayCockpitView3d) {
      entity.show = true;
    }

    if (this.followPlane3d) {
      this.makeCameraFollowPlane(entity, lastTrack, lastPitchRad, true);
    }
  }

  updatePlaneModelMovement(
    lastTrack3d: any,
    lastPosition: Cesium.Cartesian3,
    entityGroup: Cesium.CustomDataSource,
    hex: string
  ) {
    if (!this.EntityPositions[hex] || !this.viewer) return;

    const sampleTime = Cesium.JulianDate.fromDate(
      new Date(lastTrack3d.timestamp)
    );

    // Füge lastPosition zum 3d-Movement hinzu (nach erstem Aufruf)
    this.EntityPositions[hex]?.addSample(sampleTime, lastPosition);

    // Füge lastPosition zum 3d-Movement für das Cockpit hinzu (nach erstem Aufruf)
    let lastPositionCockpit = lastPosition.clone();
    lastPositionCockpit.z += 6;
    this.EntityCockpitPositions[hex]!.addSample(
      sampleTime,
      lastPositionCockpit
    );

    let entity = entityGroup.entities.getById(hex + '_model');
    if (entity) entity.orientation = this.orientationProperty;

    this.addTrailPointToPositions(lastTrack3d);
  }

  initPlaneModelMovement(
    lastTrack3d: any,
    lastPosition: Cesium.Cartesian3,
    entityGroup: any,
    aircraft: Aircraft
  ) {
    if (!this.viewer) return;

    this.startTime = Cesium.JulianDate.fromDate(
      new Date(lastTrack3d.timestamp)
    );
    // Setze Zeit in Cesium auf letzten Trail-Point
    this.viewer.clock.currentTime = this.startTime;
    this.viewer.clock.multiplier = 1;

    // Setze Optionen für Extra-/Interpolation
    if (!this.EntityPositions[aircraft.hex])
      this.EntityPositions[aircraft.hex] = new Cesium.SampledPositionProperty();
    this.EntityPositions[aircraft.hex]!.setInterpolationOptions({
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LinearApproximation,
    });
    this.EntityPositions[aircraft.hex]!.forwardExtrapolationType =
      Cesium.ExtrapolationType.EXTRAPOLATE;

    // Initiiere entity cockpit positions (um Höhe des Cockpits zu verändern)
    this.EntityCockpitPositions[aircraft.hex] =
      new Cesium.SampledPositionProperty();
    this.EntityCockpitPositions[aircraft.hex]!.setInterpolationOptions({
      interpolationDegree: 5,
      interpolationAlgorithm: Cesium.LinearApproximation,
    });
    this.EntityCockpitPositions[aircraft.hex]!.forwardExtrapolationType =
      Cesium.ExtrapolationType.EXTRAPOLATE;

    // Füge erstes Sample hinzu
    this.EntityPositions[aircraft.hex]!.addSample(this.startTime, lastPosition);

    // Füge erstes Sample für Cockpit Positions hinzu
    let lastPositionCockpit = lastPosition.clone();
    lastPositionCockpit.z += 6;
    this.EntityCockpitPositions[aircraft.hex]!.addSample(
      this.startTime,
      lastPositionCockpit
    );

    // EndTime (1 Jahr => Infinity)
    let endTimeDate = Cesium.JulianDate.toDate(this.startTime);
    endTimeDate.setFullYear(endTimeDate.getFullYear() + 1);
    this.endTime = Cesium.JulianDate.fromDate(endTimeDate);

    let entity = entityGroup.entities.getById(aircraft.hex + '_model');
    if (!entity) {
      entity = entityGroup.entities.add({
        id: aircraft.hex + '_model',
        name: aircraft.hex,
        position: this.EntityPositions[aircraft.hex],
        orientation: this.orientationProperty,
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: this.startTime,
            stop: this.endTime,
          }),
        ]),
        model: {
          uri: this.createUriForModel(aircraft.type),
          minimumPixelSize: 20,
          scale: 1,
        },
        label: {
          text: aircraft.flightId + '\n' + aircraft.hex + '\n' + aircraft.type,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
          font: 'bold 10px Roboto',
          fillColor: Cesium.Color.WHITE,
          outlineWidth: 0,
          style: Cesium.LabelStyle.FILL,
          pixelOffset: new Cesium.Cartesian2(10, -10),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.2, 0.2, 0.2, 0.4),
          disableDepthTestDistance: 0,
          scaleByDistance: undefined,
          backgroundPadding: new Cesium.Cartesian2(5, 0),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            3000,
            Infinity
          ),
        },
      });
    }
  }

  private create3dPosition(
    longitude: any,
    latitude: any,
    altitude: any,
    onGround: any
  ): Cesium.Cartesian3 {
    let position: any;
    if (onGround || altitude == 0 || altitude < 0) {
      // Hole Höhe von Terrain (wichtig, wenn Wert "on ground" gesendet wird und keine altitude vorliegt!)
      let altitude = this.getAltitudeWhenOnGround(longitude, latitude);

      position = Cesium.Cartesian3.fromDegrees(longitude, latitude, altitude);
    } else {
      position = Cesium.Cartesian3.fromDegrees(
        longitude,
        latitude,
        altitude ? altitude : 0
      );
    }
    return position;
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
    this.destroyAllObjectsForMarkedPlane();
    this.camera = undefined;

    this.removeOsm3dBuildings();
    this.removeGooglePhotorealistic3D();
    this.removeDayNightLayerOnMap();
    this.osmBuildingsTileset = undefined;
    this.googlePhotorealisticTileset = undefined;
    this.earthAtNightLayer = undefined;

    this.aircraft = null;
  }

  destroyAllObjectsForMarkedPlane() {
    this.viewer?.dataSources.removeAll();
    this.viewer?.entities.removeAll();

    this.EntityPositions[this.aircraft!.hex] = undefined;
    this.pathPositions = undefined;
    this.pathPositionsColor = undefined;
    this.startTime = undefined;
    this.endTime = undefined;
    this.orientationProperty = undefined;
    this.lastPathPositionSample = undefined;
    this.initViewOnAircraft = false;

    if (this.showCockpitViewEventListener != undefined)
      this.showCockpitViewEventListener();

    this.EntityCockpitPositions[this.aircraft!.hex] = undefined;
    this.planeEntityCenter = undefined;
    this.startMousePosition = undefined;
    this.mousePosition = undefined;
    this.flags = {
      looking: false,
    };
    this.initFirstPersonView = true;
    this.cockpitViewXDirection = undefined;
    this.cockpitViewYDirection = undefined;
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

  async createOsmBuildings() {
    if (!this.viewer) return;

    try {
      const scene = this.viewer?.scene;

      if (!this.osmBuildingsTileset) {
        // Füge OSM Buildings Tileset hinzu
        await Cesium.createOsmBuildingsAsync().then((osmBuildingsTileset) => {
          this.osmBuildingsTileset = osmBuildingsTileset;
          scene.primitives.add(this.osmBuildingsTileset);
        });
      }
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
  }

  async createGooglePhotorealistic3D() {
    if (!this.viewer || !this.scene) return;

    // Füge Photorealistic 3D Tiles hinzu
    try {
      if (!this.googlePhotorealisticTileset) {
        this.googlePhotorealisticTileset =
          await Cesium.Cesium3DTileset.fromIonAssetId(2275207, {});
        this.scene.primitives.add(this.googlePhotorealisticTileset);
      }

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
  }

  showCockpitView3d() {
    if (!this.viewer) return;

    // Resette Camera
    this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

    if (this.displayCockpitView3d) {
      this.displayCockpitView3d = false;
      this.resetCockpitView3d();
    } else {
      this.displayCockpitView3d = true;
      this.setCockpitView3d();
    }

    this.showClickedBehaviourOnButton(
      'showCockpitView3d',
      this.displayCockpitView3d
    );

    // Initiiere Update
    this.addAircraftAndTrailTo3DMap();
  }

  showCockpitModel3d() {
    if (!this.viewer || !this.displayCockpitView3d) return;

    this.displayCockpitModel3d = !this.displayCockpitModel3d;

    if (!this.displayCockpitModel3d) {
      this.removeCockpitModelEntity();
    }

    // Resette Camera
    this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

    this.showClickedBehaviourOnButton(
      'showCockpitModel3d',
      this.displayCockpitModel3d
    );
  }

  setCockpitView3d() {
    if (!this.viewer) return;

    if (this.showCockpitViewEventListener != undefined) return;

    this.showCockpitViewEventListener =
      this.viewer.clock.onTick.addEventListener((clock) => {
        this.setCockpitViewEventListener(clock);
      });
  }

  setCockpitViewEventListener(clock: any) {
    if (!this.viewer || !this.aircraft || !this.entityGroupModel) return;

    if (!this.displayCockpitModel3d) {
      this.showCockpitViewWithoutCockpitModel(clock);
    } else {
      this.showCockpitViewWithCockpitModel(clock);
    }
  }

  removeCockpitModelEntity() {
    if (!this.viewer || !this.aircraft || !this.entityGroupModel) return;

    const cockpitEntityId = this.aircraft.hex + '_cockpit';
    this.entityGroupModel.entities.removeById(cockpitEntityId);

    this.displayCockpitModel3d = false;
    this.showClickedBehaviourOnButton(
      'showCockpitModel3d',
      this.displayCockpitModel3d
    );
  }

  showCockpitViewWithoutCockpitModel(clock) {
    if (!this.viewer) return;

    let entity = this.entityGroupModel!.entities.getById(
      this.aircraft!.hex + '_model'
    );
    if (!entity) return;

    entity.show = false;
    let center = entity.position!.getValue(clock.currentTime);
    if (!center) return;
    center!.z = center!.z + 6;
    let orientation = entity.orientation!.getValue(clock.currentTime);

    if (!center || !orientation) return;

    let transform = Cesium.Matrix4.fromRotationTranslation(
      Cesium.Matrix3.fromQuaternion(orientation),
      center
    );

    this.viewer.camera.lookAtTransform(
      transform,
      new Cesium.Cartesian3(0.1, 0, 0)
    );
  }

  showCockpitViewWithCockpitModel(clock: any) {
    if (!this.viewer || !this.aircraft || !this.displayCockpitModel3d) return;

    let entityCockpit = this.createCockpitEntity(
      this.entityGroupModel,
      this.aircraft
    );

    if (this.displayCockpitView3d) {
      if (this.initFirstPersonView) {
        this.initHandlerFirstPersonView();
      }

      let entityPlane = this.entityGroupModel!.entities.getById(
        this.aircraft!.hex + '_model'
      );
      if (!entityPlane || !entityCockpit) return;

      if (entityCockpit) entityCockpit.orientation = this.orientationProperty;

      entityPlane.show = false;
      entityCockpit.show = true;

      this.planeEntityCenter = entityPlane.position!.getValue(
        clock.currentTime
      );

      // Setze Cockpit höher als Flugzeug-Center-Punkt, damit Cockpit nicht im Boden versinkt
      let cockpitCenter = this.planeEntityCenter?.clone();
      if (!cockpitCenter) return;
      cockpitCenter!.z = cockpitCenter!.z + 6;

      if (!this.planeEntityCenter) return;

      if (this.flags.looking) {
        if (!this.mousePosition || !this.startMousePosition) return;

        const width = this.viewer.canvas.clientWidth;
        const height = this.viewer.canvas.clientHeight;

        this.cockpitViewXDirection = this.calculateCockpitXDirection(width);
        this.cockpitViewYDirection = this.calculateCockpitYDirection(height);
      }

      this.setFirstPersonCockpitView(cockpitCenter);
    } else {
      this.resetFirstPersonCockpitView(entityCockpit);
    }
  }

  resetCockpitView3d() {
    if (!this.viewer) return;

    this.removeCockpitModelEntity();

    const planeEntityId = this.aircraft!.hex + '_model';
    let planeEntity = this.entityGroupModel!.entities.getById(planeEntityId);
    if (!planeEntity) return;

    planeEntity.show = true;
    this.viewer.trackedEntity = undefined;

    if (this.showCockpitViewEventListener != undefined) {
      this.showCockpitViewEventListener();
      this.showCockpitViewEventListener = undefined;
    }

    this.setCameraToAircraftPosition(this.aircraft!);
  }

  setFirstPersonCockpitView(center: Cesium.Cartesian3 | undefined) {
    if (!this.viewer) return;

    const camera = this.viewer!.scene.camera;
    camera.setView({
      destination: center,
      orientation: {
        heading: this.cockpitViewXDirection
          ? this.cockpitViewXDirection
          : Cesium.Math.toRadians(this.aircraftTrack - 90),
        pitch: this.cockpitViewYDirection ? this.cockpitViewYDirection : 0,
        roll: -this.aircraftRoll,
      },
    });

    camera.zoomIn(this.zoomAmountCockpitView);
  }

  resetFirstPersonCockpitView(entityCockpit) {
    if (this.handler) {
      if (this.leftDownInputAction)
        this.handler.removeInputAction(this.leftDownInputAction);
      if (this.mouseMoveInputAction)
        this.handler.removeInputAction(this.mouseMoveInputAction);
      if (this.leftUpInputAction)
        this.handler.removeInputAction(this.leftUpInputAction);
      if (this.zoomInputAction)
        this.handler.removeInputAction(this.zoomInputAction);
      if (this.zoomInputActionPinch)
        this.handler.removeInputAction(this.zoomInputActionPinch);
      entityCockpit.show = false;
      this.initFirstPersonView = true;
    }
  }

  calculateCockpitYDirection(height: number): number | undefined {
    if (!this.mousePosition || !this.startMousePosition || !this.movementFactor)
      return;
    return this.cockpitViewYDirection
      ? this.cockpitViewYDirection +
          (-(this.mousePosition.y - this.startMousePosition.y) / height) *
            this.movementFactor
      : (-(this.mousePosition.y - this.startMousePosition.y) / height) *
          this.movementFactor;
  }

  calculateCockpitXDirection(width): number | undefined {
    if (!this.mousePosition || !this.startMousePosition || !this.movementFactor)
      return;
    return this.cockpitViewXDirection
      ? this.cockpitViewXDirection +
          ((this.mousePosition.x - this.startMousePosition.x) / width) *
            this.movementFactor
      : Cesium.Math.toRadians(this.aircraftTrack - 90);
  }

  initHandlerFirstPersonView() {
    if (!this.viewer) return;
    this.initFirstPersonView = false;

    this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

    this.leftDownInputAction = this.handler.setInputAction((movement) => {
      this.flags.looking = true;
      this.mousePosition = this.startMousePosition = Cesium.Cartesian3.clone(
        movement.position
      );
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    this.mouseMoveInputAction = this.handler.setInputAction((movement) => {
      this.mousePosition = movement.endPosition;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    this.leftUpInputAction = this.handler.setInputAction((position) => {
      this.flags.looking = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    this.zoomInputAction = this.handler.setInputAction((zoomScalar) => {
      if (!this.viewer) return;
      this.changeCameraZoomFov(zoomScalar);
      this.changeCameraZoom(zoomScalar);
    }, Cesium.ScreenSpaceEventType.WHEEL);

    this.zoomInputActionPinch = this.handler.setInputAction((zoomScalar) => {
      if (!this.viewer) return;
      this.changeCameraZoomFov(zoomScalar);
      this.changeCameraZoom(zoomScalar);
    }, Cesium.ScreenSpaceEventType.PINCH_START);
  }

  changeCameraZoom(initialZoomScalar: number) {
    const maxZoom = 0.6;
    const minZoom = -0.2;
    const sensitivityFactor = 0.0001;
    const zoomScalar = initialZoomScalar * sensitivityFactor;

    let zoomAmountNow = this.zoomAmountCockpitView;
    const nextZoomAmount = (zoomAmountNow += zoomScalar);

    if (nextZoomAmount <= maxZoom && nextZoomAmount >= minZoom) {
      this.zoomAmountCockpitView += zoomScalar;
    }
  }

  changeCameraZoomFov(initialZoomScalar: number) {
    if (!this.viewer) return;

    const sensitivityFactorFov = 0.01;
    let zoomAmountFovNow = this.zoomAmountCockpitViewFov;
    const zoomScalar = initialZoomScalar * sensitivityFactorFov;
    const nextZoomAmountFov = (zoomAmountFovNow -= zoomScalar);
    const nextZoomAmountRadians = Cesium.Math.toRadians(nextZoomAmountFov);

    if (
      nextZoomAmountRadians >= 0.3 &&
      nextZoomAmountRadians <= Cesium.Math.PI_OVER_THREE
    ) {
      this.zoomAmountCockpitViewFov = nextZoomAmountFov;
      const currentFrustum = this.viewer.scene.camera.frustum;
      this.viewer.scene.camera.frustum = new Cesium.PerspectiveFrustum({
        fov: Cesium.Math.toRadians(this.zoomAmountCockpitViewFov),
        aspectRatio:
          this.viewer.canvas.clientWidth / this.viewer.canvas.clientHeight,
        near: currentFrustum.near,
        far: currentFrustum.far,
      });
    }
  }

  createCockpitEntity(entityGroup: any, aircraft: Aircraft) {
    if (aircraft.hex == 'ISS') return undefined;

    let entity = entityGroup.entities.getById(aircraft.hex + '_cockpit');
    if (!entity) {
      entity = entityGroup.entities.add({
        id: aircraft.hex + '_cockpit',
        name: aircraft.hex + '_cockpit',
        position: this.EntityCockpitPositions[aircraft.hex],
        orientation: this.orientationProperty,
        availability: new Cesium.TimeIntervalCollection([
          new Cesium.TimeInterval({
            start: this.startTime,
            stop: this.endTime,
          }),
        ]),
        model: {
          uri: this.createUriForModel(aircraft.type + '_cockpit'),
          minimumPixelSize: 20,
          scale: 1,
        },
      });
    }
    return entity;
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 3000,
    });
  }

  show3dMapFullscreen() {
    if (!this.viewer || !this.scene || !this.isDesktop) return;

    this.display3dMapFullscreen = this.display3dMapFullscreen ? false : true;
    this.showClickedBehaviourOnButton(
      'show3dMapFullscreen',
      this.display3dMapFullscreen
    );

    let cesiumMap = document.getElementById('cesium-map');

    if (this.display3dMapFullscreen) {
      this.widthMap3d = '100vw';
      if (cesiumMap) {
        cesiumMap.style.width = '100vw';
        cesiumMap.style.marginBottom = '0rem';
        cesiumMap.style.marginLeft = '0rem';
        cesiumMap.style.marginRight = '0rem';
        cesiumMap.style.marginTop = '3.5rem';
        cesiumMap.style.borderRadius = '0px';
      }
    } else {
      this.widthMap3d = '40rem';
      if (cesiumMap) {
        cesiumMap.style.width = '40rem';
        cesiumMap.style.marginBottom = '0.3rem';
        cesiumMap.style.marginLeft = '0.3rem';
        cesiumMap.style.marginRight = '0.3rem';
        cesiumMap.style.marginTop = '3.8rem';
        cesiumMap.style.borderRadius = '15px';
      }
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

  toggleDayNightLayerOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;

    this.enableDayNightMap = checked;

    Storage.savePropertyInLocalStorage(
      'showDayNightLayer3d',
      this.enableDayNightMap
    );

    if (this.enableDayNightMap) {
      this.enableDayNightLayerOnMap();
    } else {
      this.removeDayNightLayerOnMap();
    }
  }

  async enableDayNightLayerOnMap() {
    if (!this.viewer || !this.scene) return;

    if (!Storage.getPropertyFromLocalStorage('showLighting3d', false)) {
      this.toggleLightingOnMap(true);
    }

    if (!this.earthAtNightLayer) {
      this.earthAtNightLayer = Cesium.ImageryLayer.fromProviderAsync(
        Cesium.IonImageryProvider.fromAssetId(3812, {}),
        {}
      );
    }

    if (!this.earthAtNightLayer) return;

    // Entferne terrain, da ansonsten Layer nicht richtig angezeigt werden
    this.viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();

    const imagerLayers = this.viewer.imageryLayers;
    if (imagerLayers.length > 1) {
      // Verstecke den Layer, wenn dieser bereits hinzugefügt wurde
      this.earthAtNightLayer.show = true;
      return;
    }

    this.addEarthAtNightLayerToLayers();
  }

  removeDayNightLayerOnMap() {
    if (!this.viewer || !this.scene) return;

    if (!this.earthAtNightLayer) return;
    this.earthAtNightLayer.show = false;
    this.viewer.scene.globe.enableLighting =
      Storage.getPropertyFromLocalStorage('showLighting3d', false);
    this.viewer.scene.setTerrain(
      Cesium.Terrain.fromWorldTerrain({
        requestVertexNormals: true,
        requestWaterMask: false,
      })
    );
  }

  showClickedBehaviourOnButton(buttonId: string, isClicked: boolean) {
    const colorClicked = '#ffab40';
    const colorNotClicked = '#000';
    document.getElementById(buttonId)!.style.background = isClicked
      ? colorClicked
      : colorNotClicked;
  }

  addEarthAtNightLayerToLayers() {
    if (!this.viewer || !this.scene || !this.earthAtNightLayer) return;
    this.viewer.imageryLayers.add(this.earthAtNightLayer);
    this.viewer.scene.globe.enableLighting = true;
    this.earthAtNightLayer.dayAlpha = 0.0;
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

    this.showClickedBehaviourOnButton('followPlane3d', this.followPlane3d);

    // Resette Camera
    this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);

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

      // Erlaube nur Rotation/Zoom um Entity
      this.viewer.scene.screenSpaceCameraController.enableTilt = false;
      this.viewer.scene.screenSpaceCameraController.enableRotate = true;
      this.viewer.scene.screenSpaceCameraController.enableZoom = true;
      this.viewer.scene.screenSpaceCameraController.enableTranslate = false;
      this.viewer.scene.screenSpaceCameraController.enableLook = false;
    } else {
      this.viewer.trackedEntity = undefined;
      this.setCameraToAircraftPosition(this.aircraft);
      this.cameraFollowsPlaneInitial = false;
      this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
  }

  makeCameraFollowPlane(entity, track, pitch, isPlaneUpdate) {
    if (!this.viewer || !this.scene || !entity) return;

    if (isPlaneUpdate) {
      if (!this.cameraFollowsPlaneInitial && this.aircraft?.hex != 'ISS') {
        const hpRange = new Cesium.HeadingPitchRange();
        hpRange.heading = Cesium.Math.toRadians(track - 90);
        hpRange.pitch = pitch;
        hpRange.range = 80;

        this.viewer.camera.lookAt(this.aircraftPosition, hpRange);

        this.cameraFollowsPlaneInitial = true;
      }
    }

    this.viewer.trackedEntity = entity;
  }

  computeCloudOrientation(): any {
    if (!this.viewer) return;

    const position = Cesium.Cartesian3.ZERO;
    const timestamp = Cesium.JulianDate.toDate(
      this.viewer.clock.currentTime
    ).getTime();
    const heading = Cesium.Math.toRadians(timestamp / 1000);
    const pitch = Cesium.Math.toRadians(0);
    const roll = 0;
    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
    const orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      hpr
    );
    return orientation;
  }

  showSettingsOnMap() {
    this.displaySettings = !this.displaySettings;
    this.showClickedBehaviourOnButton('showSettings', this.displaySettings);
  }

  closeSettings3d() {
    this.displaySettings = false;
    this.showClickedBehaviourOnButton('showSettings', this.displaySettings);
  }

  toggleOsmBuildingsOnMap(checked: boolean) {
    if (!this.viewer) return;

    this.displayOsmBuildings3d = checked;

    Storage.savePropertyInLocalStorage(
      'showOsmBuildings3d',
      this.displayOsmBuildings3d
    );

    if (this.displayOsmBuildings3d) {
      this.createOsmBuildings();
    } else {
      this.removeOsm3dBuildings();
    }
  }

  toggleGooglePhotogrammatryOnMap(checked: boolean) {
    if (!this.viewer) return;

    this.displayGooglePhotorealistic3d = checked;

    Storage.savePropertyInLocalStorage(
      'showGooglePhotorealistic3d',
      this.displayGooglePhotorealistic3d
    );

    if (this.displayGooglePhotorealistic3d) {
      this.createGooglePhotorealistic3D();
    } else {
      this.removeGooglePhotorealistic3D();
    }
  }

  toggleCloudsOnMap(checked: boolean) {
    if (!this.viewer) return;

    this.enableClouds = checked;

    Storage.savePropertyInLocalStorage('showClouds3d', this.enableClouds);

    if (this.enableClouds) {
      const equatorialRadius = 6378137.0;
      const polarRadius = 6356752.3142;
      const cloudAltitude = 11000;

      this.viewer.entities.add({
        id: 'clouds',
        position: Cesium.Cartesian3.ZERO,
        orientation: this.computeCloudOrientation(),
        ellipsoid: {
          radii: new Cesium.Cartesian3(
            equatorialRadius + cloudAltitude,
            equatorialRadius + cloudAltitude,
            polarRadius + cloudAltitude
          ),
          material: new Cesium.ImageMaterialProperty({
            image: '../../../assets/clouds.png',
            transparent: true,
          }),
          slicePartitions: 128,
          stackPartitions: 128,
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
            0.0,
            Infinity
          ),
        },
      });
    } else {
      this.viewer.entities.removeById('clouds');
    }
  }

  toggleHdrOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableHdr3dMap = checked;

    Storage.savePropertyInLocalStorage('showHdr3d', this.enableHdr3dMap);

    this.scene.highDynamicRange = this.enableHdr3dMap;
  }

  toggleShadowsOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableShadows3dMap = checked;

    Storage.savePropertyInLocalStorage(
      'showShadows3d',
      this.enableShadows3dMap
    );

    this.viewer.shadows = this.enableShadows3dMap;
  }

  toggleTerrainShadowsOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableTerrainShadows3dMap = checked;

    Storage.savePropertyInLocalStorage(
      'showTerrainShadows3d',
      this.enableTerrainShadows3dMap
    );

    if (this.enableTerrainShadows3dMap) {
      this.viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
    } else {
      this.viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
    }
  }

  toggleLightingOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableLighting3dMap = checked;

    Storage.savePropertyInLocalStorage(
      'showLighting3d',
      this.enableLighting3dMap
    );

    this.scene.globe.enableLighting = this.enableLighting3dMap;
  }

  toggleMsaaOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableMsaa3dMap = checked;

    Storage.savePropertyInLocalStorage('showMsaa3d', this.enableMsaa3dMap);

    if (this.enableMsaa3dMap) {
      this.scene.msaaSamples = 4;
    } else {
      this.scene.msaaSamples = 1;
    }
  }

  toggleFxaaOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableFxaa3dMap = checked;

    Storage.savePropertyInLocalStorage('showFxaa3d', this.enableFxaa3dMap);

    this.scene.postProcessStages.fxaa.enabled = this.enableFxaa3dMap;
  }

  toggleAmbientOcclusionOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableAmbientOcclusion3dMap = checked;

    Storage.savePropertyInLocalStorage(
      'showAmbientOcclusion3d',
      this.enableAmbientOcclusion3dMap
    );

    this.scene.postProcessStages.ambientOcclusion.enabled =
      this.enableAmbientOcclusion3dMap;
  }

  toggleAthmosphereLightOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableAthmosphereLight3dMap = checked;

    Storage.savePropertyInLocalStorage(
      'showAthmosphereLight3d',
      this.enableAthmosphereLight3dMap
    );

    this.scene.globe.atmosphereLightIntensity = 20.0;
    this.scene.globe.dynamicAtmosphereLighting =
      this.enableAthmosphereLight3dMap;
    this.scene.globe.dynamicAtmosphereLightingFromSun =
      this.enableAthmosphereLight3dMap;
    this.scene.globe.showGroundAtmosphere = this.enableAthmosphereLight3dMap;
  }

  toggleFogOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableFog3dMap = checked;

    Storage.savePropertyInLocalStorage('showFog3d', this.enableFog3dMap);

    this.scene.fog.enabled = this.enableFog3dMap;
    this.scene.fog.minimumBrightness = 0.3;
    this.scene.fog.density = 2.0e-4 * 1.0;
  }

  onInputChangeMsaa3dSize(event: any) {
    if (!this.viewer || !this.scene) return;

    this.sliderMsaa3dValue = event.target.valueAsNumber;

    Storage.savePropertyInLocalStorage('sliderMsaa3d', this.sliderMsaa3dValue);

    this.scene.msaaSamples = this.sliderMsaa3dValue;
  }

  toggleDefaultResolutionOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableDefaultResolution3dMap = checked;
    Storage.savePropertyInLocalStorage(
      'showDefaultResolution3d',
      this.enableDefaultResolution3dMap
    );
    if (this.enableDefaultResolution3dMap) {
      this.viewer.resolutionScale = window.devicePixelRatio;
      this.viewer.useBrowserRecommendedResolution = true;
    } else {
      this.viewer.resolutionScale = 0.9;
      this.viewer.useBrowserRecommendedResolution = false;
    }
  }

  toggleDebugInfoOnMap(checked: boolean) {
    if (!this.viewer || !this.scene) return;
    this.enableDebugInfo3dMap = checked;

    Storage.savePropertyInLocalStorage(
      'showDebugInfo3d',
      this.enableDebugInfo3dMap
    );

    this.viewer.scene.debugShowFramesPerSecond = this.enableDebugInfo3dMap;
  }

  showLowGraphicSettings() {
    if (!this.viewer || !this.scene) return;
    this.toggleHdrOnMap(false);
    this.toggleShadowsOnMap(false);
    this.toggleTerrainShadowsOnMap(false);
    this.toggleLightingOnMap(false);
    this.toggleMsaaOnMap(false);
    this.toggleFxaaOnMap(false);
    this.toggleAmbientOcclusionOnMap(false);
    this.scene.msaaSamples = this.sliderMsaa3dValue = 0;
    this.toggleAthmosphereLightOnMap(false);
    this.toggleFogOnMap(false);
  }

  showMediumGraphicSettings() {
    if (!this.viewer || !this.scene) return;
    this.toggleHdrOnMap(false);
    this.toggleShadowsOnMap(true);
    this.toggleTerrainShadowsOnMap(false);
    this.toggleLightingOnMap(true);
    this.toggleMsaaOnMap(false);
    this.toggleFxaaOnMap(true);
    this.toggleAmbientOcclusionOnMap(false);
    this.scene.msaaSamples = this.sliderMsaa3dValue = 0;
    this.toggleAthmosphereLightOnMap(true);
    this.toggleFogOnMap(true);
  }

  showHighGraphicSettings() {
    if (!this.viewer || !this.scene) return;
    this.toggleHdrOnMap(true);
    this.toggleShadowsOnMap(true);
    this.toggleTerrainShadowsOnMap(true);
    this.toggleLightingOnMap(true);
    this.toggleMsaaOnMap(true);
    this.toggleFxaaOnMap(true);
    this.toggleAmbientOcclusionOnMap(true);
    this.scene.msaaSamples = this.sliderMsaa3dValue = 8;
    this.toggleAthmosphereLightOnMap(true);
    this.toggleFogOnMap(true);
  }
}
