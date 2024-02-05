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
  enableHighQuality: boolean = false;
  enableDayNightMap: boolean = false;
  followPlane3d: boolean = false;
  earthAtNightLayer: Cesium.ImageryLayer | undefined;
  initViewOnAircraft: boolean = false;
  cameraFollowsPlaneInitial: any;

  aircraftPosition!: Cesium.Cartesian3;
  aircraftTrack!: number;
  aircraftPitch!: number;

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

  showCockpitViewEventListener: Cesium.Event.RemoveCallback | undefined;

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
    if (this.displayGooglePhotorealistic3D) {
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

    const lastIndex = aircraft.track3d.trailPoints.length - 1;
    let lastTrail3d = aircraft.track3d.trailPoints[lastIndex];

    const lastPosition: Cesium.Cartesian3 = this.create3dPosition(
      lastTrail3d.longitude,
      lastTrail3d.latitude,
      lastTrail3d.altitude,
      aircraft.onGround
    );

    const lastTrack = lastTrail3d.track ? lastTrail3d.track + 90 : 0;
    // Ändere Vorzeichen von roll-Wert, damit Winkel richtig dargestellt wird
    const lastRoll = lastTrail3d.roll ? lastTrail3d.roll * -1 : 0;

    const lastHeadingRad = Cesium.Math.toRadians(lastTrack);
    const lastPitchRad = Cesium.Math.toRadians(0);
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
    } else if (aircraft.lastSeen < 5 && this.EntityPositions[aircraft.hex]) {
      this.EntityPositions[aircraft.hex]!.forwardExtrapolationType =
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

    // Füge erstes Sample hinzu
    this.EntityPositions[aircraft.hex]!.addSample(this.startTime, lastPosition);

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
          scale: 2,
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
    this.osmBuildingsTileset = undefined;
    this.googlePhotorealisticTileset = undefined;

    this.aircraft = null;
  }

  destroyAllObjectsForMarkedPlane() {
    this.viewer?.dataSources.removeAll();
    this.viewer?.entities.removeAll();

    this.EntityPositions[this.aircraft!.hex] = undefined;
    this.pathPositions = undefined;
    this.pathPositionsColor = undefined;
    this.startTime = undefined;
    if (this.showCockpitViewEventListener)
      this.viewer?.clock.onTick.removeEventListener(
        this.showCockpitViewEventListener
      );
    this.endTime = undefined;
    this.orientationProperty = undefined;
    this.lastPathPositionSample = undefined;

    this.initViewOnAircraft = false;
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

      this.showClickedBehaviourOnButton(
        'show3dBuildings',
        this.display3dBuildings
      );
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

    this.showClickedBehaviourOnButton(
      'show3dBuildings',
      this.display3dBuildings
    );
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

      this.showClickedBehaviourOnButton(
        'showGooglePhotorealistic3D',
        this.displayGooglePhotorealistic3D
      );
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

    this.showClickedBehaviourOnButton(
      'showGooglePhotorealistic3D',
      this.displayGooglePhotorealistic3D
    );
  }

  showCockpitView3d() {
    if (!this.viewer) return;

    if (this.displayCockpitView3d) {
      this.displayCockpitView3d = false;

      let entity = this.entityGroupModel!.entities.getById(
        this.aircraft!.hex + '_model'
      );
      if (!entity) return;

      if (this.showCockpitViewEventListener)
        this.viewer.clock.onTick.removeEventListener(
          this.showCockpitViewEventListener
        );

      entity.show = true;
      this.viewer.trackedEntity = undefined;

      this.setCameraToAircraftPosition(this.aircraft!);
    } else {
      this.displayCockpitView3d = true;

      this.showCockpitViewEventListener =
        this.viewer.clock.onTick.addEventListener((clock) => {
          if (!this.viewer || !this.aircraft || !this.entityGroupModel) return;

          if (this.displayCockpitView3d) {
            let entity = this.entityGroupModel!.entities.getById(
              this.aircraft!.hex + '_model'
            );
            if (!entity) return;

            entity.show = false;
            let center = entity.position!.getValue(clock.currentTime);
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
        });
    }

    this.showClickedBehaviourOnButton(
      'showCockpitView3d',
      this.displayCockpitView3d
    );

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
    this.showClickedBehaviourOnButton(
      'show3dMapFullscreen',
      this.display3dMapFullscreen
    );

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

    this.showClickedBehaviourOnButton('enableHdr3dMap', this.enableHdr3dMap);

    this.scene.highDynamicRange = this.enableHdr3dMap;
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

  enableHighQualityOnMap() {
    if (!this.viewer || !this.scene) return;

    this.enableHighQuality = !this.enableHighQuality;

    this.showClickedBehaviourOnButton(
      'enableHighQualityMap',
      this.enableHighQuality
    );

    const globe = this.scene.globe;
    if (this.enableHighQuality) {
      this.viewer.shadows = true;
      this.viewer.terrainShadows = Cesium.ShadowMode.ENABLED;
      globe.enableLighting = true;
      globe.atmosphereLightIntensity = 20.0;
      globe.dynamicAtmosphereLighting = true;
      globe.dynamicAtmosphereLightingFromSun = true;
      this.scene.fog.enabled = true;
      this.scene.fog.minimumBrightness = 0.3;
      this.scene.fog.density = 2.0e-4 * 1.0;
      globe.depthTestAgainstTerrain = true;
      globe.showGroundAtmosphere = true;
      this.scene.msaaSamples = 8;
      this.scene.postProcessStages.fxaa.enabled = true;
    } else {
      this.viewer.shadows = false;
      this.viewer.terrainShadows = Cesium.ShadowMode.DISABLED;
      globe.enableLighting = false;
      globe.atmosphereLightIntensity = 10.0;
      globe.dynamicAtmosphereLighting = false;
      globe.dynamicAtmosphereLightingFromSun = false;
      this.scene.fog.enabled = false;
      globe.depthTestAgainstTerrain = false;
      globe.showGroundAtmosphere = false;
      this.scene.msaaSamples = 1;
      this.scene.postProcessStages.fxaa.enabled = false;
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

    this.showClickedBehaviourOnButton(
      'enableDayNightMap',
      this.enableDayNightMap
    );

    if (this.enableDayNightMap) {
      // Entferne terrain, da ansonsten Layer nicht richtig angezeigt werden
      this.viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();

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
      this.viewer.scene.setTerrain(
        Cesium.Terrain.fromWorldTerrain({
          requestVertexNormals: true,
          requestWaterMask: false,
        })
      );
    }
  }

  showClickedBehaviourOnButton(buttonId: string, isClicked: boolean) {
    const colorClicked = '#f9c534';
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
