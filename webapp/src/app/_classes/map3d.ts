import OLCesium from 'olcs';
import * as Cesium from 'cesium';
import { Globals } from '../_common/globals';
import { Aircraft } from './aircraft';
import { MapComponent } from '../_components/map/map.component';
import { Markers } from './markers';

export class Map3d {
  olMap2d: any;
  ol3d: OLCesium | undefined;
  mapComponent: MapComponent | undefined;
  markedHex: string | undefined;
  initViewOnAircraft: boolean = true;
  pathPositions: Cesium.SampledPositionProperty[] | undefined;
  lastPathPositionSample: any | undefined;
  pathPositionsColor: Cesium.Color | undefined;

  markedPosition: any;
  markedOrientation: Cesium.Quaternion | undefined;
  initCameraPlaneFromBehind: boolean = true;
  //cameraBeforeFollowing: Cesium.Camera;

  constructor(OlMap2d, cesiumAccessToken, mapComponent) {
    this.olMap2d = OlMap2d;
    this.mapComponent = mapComponent;

    Cesium.Ion.defaultAccessToken = cesiumAccessToken;

    this.ol3d = new OLCesium({
      map: this.olMap2d,
    });

    const scene = this.ol3d.getCesiumScene();
    this.ol3d.setTargetFrameRate(Number.POSITIVE_INFINITY);
    this.ol3d.enableAutoRenderLoop();
    scene.requestRenderMode = true;
    scene.maximumRenderTimeChange = Infinity;
    this.ol3d.setRefresh2DAfterCameraMoveEndOnly(true);

    // Terrain
    //Cesium.createWorldTerrainAsync().then((tp) => (scene.terrainProvider = tp));
    //const globe = scene.globe;
    //globe.enableTerrain = true;

    this.ol3d?.setEnabled(true);
    this.createFeaturePicker();
    this.loadPlanesInCesium();
  }

  public createTrail(aircraft: Aircraft) {
    if (!aircraft || !aircraft.track3d) return;

    // Trail nur für markiertes Flugzeug
    if (aircraft.isMarked) {
      this.createTrailInCesium(aircraft.track3d);
    }
  }

  public updateTrail(aircraft: Aircraft) {
    if (!aircraft || !aircraft.track3d) return;

    // Update Trail
    const track3d = aircraft.track3d;
    const trailPointsLength = track3d.trailPoints.length;
    const lastTrailPoint = track3d.trailPoints[trailPointsLength - 1];
    this.addTrailPointToPositions(lastTrailPoint);
  }

  createTrailInCesium(track3d: any) {
    // Erstelle neuen Trail
    for (let i = 0; i < track3d.trailPoints.length - 1; i++) {
      const trailPoint = track3d.trailPoints[i];
      this.addTrailPointToPositions(trailPoint);
    }
  }

  addTrailPointToPositions(trailPoint: any) {
    if (!trailPoint) return;

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

  getAltitudeWhenOnGround(longitude, latitude): number {
    const defaultHeightInMeters = 5;

    if (!this.ol3d?.getCesiumScene()) return defaultHeightInMeters;
    let altitude = this.ol3d
      ?.getCesiumScene()
      .globe.getHeight(Cesium.Cartographic.fromDegrees(longitude, latitude));

    if (altitude == undefined) {
      // default, wenn kein altitude-Wert gefunden wird (in Metern)
      altitude = defaultHeightInMeters;
    }

    return altitude;
  }

  addTrailPath(hex: string, trailPoint: any) {
    if (
      !this.pathPositions ||
      !this.pathPositions[this.pathPositions.length - 1]
    )
      return;

    let customDataSource: Cesium.CustomDataSource | undefined =
      this.ol3d?.getDataSourceDisplay().defaultDataSource;

    if (!customDataSource) return;

    const pathId = this.pathPositions.length - 1;
    customDataSource.entities.add({
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

  createFeaturePicker() {
    const scene = this.ol3d?.getCesiumScene();
    if (!scene) return;
    var screenSpaceEventHandler: Cesium.ScreenSpaceEventHandler =
      new Cesium.ScreenSpaceEventHandler(scene.canvas);
    screenSpaceEventHandler.setInputAction((movement) => {
      if (!this.ol3d) return;

      // Picken eines Features
      const pickedFeature = this.ol3d?.getCesiumScene().pick(movement.position);
      const pickedFeatureIsPlane: boolean =
        pickedFeature &&
        pickedFeature.id != undefined &&
        pickedFeature.id._name != undefined;

      // case 0: click in nowhere or on non plane feature -> unmark marked plane if necessary
      if (!Cesium.defined(pickedFeature) || !pickedFeatureIsPlane) {
        if (this.markedHex) this.markOrUnmarkPlaneIn2d(this.markedHex);
        this.unmarkPlaneIn3dIfNecessary();
        return;
      }

      const pickedFeatureHex: string = pickedFeature.id._name;
      if (!pickedFeatureHex) return;

      console.log(pickedFeature);

      if (!this.markedHex) {
        // case 1: click on not selected plane
        this.markedHex = pickedFeatureHex;
        this.markOrUnmarkPlaneIn2d(this.markedHex);
      } else if (this.markedHex && this.markedHex == pickedFeatureHex) {
        // case 2: click on marked plane
        this.markOrUnmarkPlaneIn2d(this.markedHex);
        this.unmarkPlaneIn3dIfNecessary();
      } else if (this.markedHex && this.markedHex != pickedFeatureHex) {
        // case 3: click on other plane
        this.markOrUnmarkPlaneIn2d(this.markedHex);
        this.unmarkPlaneIn3dIfNecessary();

        this.markedHex = pickedFeatureHex;
        this.markOrUnmarkPlaneIn2d(this.markedHex);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  }

  private markOrUnmarkPlaneIn2d(hex: string) {
    this.mapComponent?.markOrUnmarkAircraft(hex, false);
  }

  private unmarkPlaneIn3dIfNecessary() {
    if (!this.markedHex || !this.ol3d) return;

    let customDataSource: Cesium.CustomDataSource | undefined =
      this.ol3d?.getDataSourceDisplay().defaultDataSource;

    if (!customDataSource || !this.pathPositions) return;

    for (let i = 0; i < this.pathPositions.length; i++) {
      const path_id = this.markedHex + '_path_' + i;
      customDataSource.entities.removeById(path_id);
    }

    // TODO reset camera
    this.initCameraPlaneFromBehind = false; // reset when click to nothing
    this.markedOrientation = undefined;
    this.markedPosition = false;

    this.markedHex = undefined;
    this.pathPositions = [];
    this.lastPathPositionSample = undefined;
    this.pathPositionsColor = undefined;
    this.initViewOnAircraft = false;
  }

  public followPlane(aircraft: Aircraft) {
    if (!aircraft || !aircraft.isMarked || !this.ol3d) return;

    const entityName = aircraft.hex + '_model';
    let customDataSource: Cesium.CustomDataSource | undefined =
      this.ol3d?.getDataSourceDisplay().defaultDataSource;

    if (!customDataSource) return;
    let entity = customDataSource.entities.getById(entityName);
    if (!entity) return;

    this.showThirdPersonView(aircraft);
  }

  showThirdPersonView(aircraft: Aircraft) {
    if (!this.markedPosition || !this.markedOrientation) return;

    const camera = this.ol3d?.getCesiumScene().camera;
    if (!camera) return;

    if (this.initCameraPlaneFromBehind) {
      //this.cameraBeforeFollowing = camera;
      this.initCameraPlaneFromBehind = false;

      camera.position = new Cesium.Cartesian3(0, 0, 0);
      camera.direction = new Cesium.Cartesian3(0.0, 1.0, 0.0);
      camera.up = new Cesium.Cartesian3(0.0, 0.0, 1.0);
      camera.right = new Cesium.Cartesian3(1.0, 0.0, 0.0);

      const transform = Cesium.Matrix4.fromRotationTranslation(
        Cesium.Matrix3.fromQuaternion(this.markedOrientation),
        this.markedPosition
      );

      const hpRange = new Cesium.HeadingPitchRange();
      hpRange.heading = aircraft.track;
      hpRange.pitch = 0;
      hpRange.range = 80;

      camera.lookAtTransform(transform, hpRange);
    } else {
      var transform = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
        this.markedPosition,
        this.markedOrientation,
        Cesium.Cartesian3.ONE,
        new Cesium.Matrix4()
      );

      var cameraPos = Cesium.Cartesian3.clone(camera.position);
      camera.lookAtTransform(transform, cameraPos);
    }
  }

  public loadPlanesInCesium() {
    for (var aircraft of Globals.PlanesOrdered) {
      this.createOrUpdatePlaneInCesium(aircraft);
      if (aircraft.isMarked && !this.markedHex) {
        this.markedHex = aircraft.hex;
        this.createTrail(aircraft);
      }
    }
  }

  createOrUpdatePlaneInCesium(aircraft: Aircraft) {
    if (!aircraft) return;

    const entityName = aircraft.hex + '_model';
    let customDataSource: Cesium.CustomDataSource | undefined =
      this.ol3d?.getDataSourceDisplay().defaultDataSource;

    if (!customDataSource) return;

    const hex = aircraft.hex;
    const type = aircraft.type;
    const position: any = Cesium.Cartesian3.fromDegrees(
      aircraft.position[0],
      aircraft.position[1],
      aircraft.altitude ? aircraft.altitude * 0.3048 : 0
    );
    // Adiere 90 Grad, damit Track richtig angezeigt wird
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

    const orientationProperty = new Cesium.ConstantProperty(orientation);

    let entity = customDataSource.entities.getById(entityName);

    if (!entity) {
      entity = this.createNewAircraftEntity(
        entity,
        customDataSource,
        hex,
        position,
        orientationProperty,
        type,
        aircraft
      );
    } else {
      this.updateAircraftEntity(
        entity,
        position,
        orientationProperty,
        aircraft
      );
    }

    if (aircraft.isMarked) {
      this.markedPosition = position;
      this.markedOrientation = orientation;
      this.showThirdPersonView(aircraft);
    }
  }

  private updateAircraftEntity(
    entity: Cesium.Entity,
    position: any,
    orientationProperty: Cesium.ConstantProperty,
    aircraft: Aircraft
  ) {
    entity.position = position;
    entity.orientation = orientationProperty;
    entity.label = this.createLabelForEntity(aircraft);
  }

  private createNewAircraftEntity(
    entity: Cesium.Entity | undefined,
    customDataSource: Cesium.CustomDataSource,
    hex: string,
    position: any,
    orientationProperty: Cesium.ConstantProperty,
    type: string,
    aircraft: Aircraft
  ) {
    entity = customDataSource.entities.add({
      id: hex + '_model',
      name: hex,
      position: position,
      orientation: orientationProperty,
      model: {
        uri: this.createUriForModel(type),
        minimumPixelSize: 20,
      },
      label: this.createLabelForEntity(aircraft),
    });
    return entity;
  }

  private createLabelForEntity(aircraft: Aircraft): any {
    return {
      text:
        aircraft.flightId +
        '\n' +
        aircraft.hex +
        '\n' +
        aircraft.type +
        '\n' +
        aircraft.altitude +
        ' ft',
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
      font: 'bold 10px Roboto',
      fillColor: Cesium.Color.WHITE,
      outlineWidth: 0,
      style: Cesium.LabelStyle.FILL,
      pixelOffset: new Cesium.Cartesian2(10, -10),
      showBackground: true,
      backgroundColor: Markers.getColorFromAltitude(
        aircraft.altitude,
        aircraft.onGround,
        false,
        false,
        true,
        false,
        true
      ), //new Cesium.Color(0.2, 0.2, 0.2, 0.4),
      disableDepthTestDistance: 0,
      scaleByDistance: undefined,
      backgroundPadding: new Cesium.Cartesian2(5, 0),
      distanceDisplayCondition: new Cesium.DistanceDisplayCondition(
        50,
        Infinity
      ),
    };
  }

  private createUriForModel(
    type: string
  ): string | Cesium.Property | Cesium.Resource | undefined {
    return Globals.urlGetModelFromServer + '?type=' + type;
  }

  public destroy() {
    this.ol3d?.setEnabled(false);
    this.ol3d?.destroy();
    this.ol3d = undefined;
  }

  public removeAircraft(hex: string) {
    const idToRemove = hex + '_model';

    const customDataSource: Cesium.CustomDataSource | undefined =
      this.ol3d?.getDataSourceDisplay().defaultDataSource;
    if (!customDataSource) return;

    customDataSource.entities.removeById(idToRemove);
  }
}
