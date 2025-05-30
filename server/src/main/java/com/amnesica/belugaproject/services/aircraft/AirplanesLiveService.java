package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.config.FeederMapping;
import com.amnesica.belugaproject.entities.aircraft.RemoteAircraft;
import com.amnesica.belugaproject.repositories.aircraft.RemoteAircraftRepository;
import com.amnesica.belugaproject.services.data.AircraftDataService;
import com.amnesica.belugaproject.services.helper.Request;
import com.amnesica.belugaproject.services.network.NetworkHandlerService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Slf4j
@Service
public class AirplanesLiveService {

  @Autowired
  private NetworkHandlerService networkHandler;
  @Autowired
  private Configuration configuration;
  @Autowired
  private AircraftService aircraftService;
  @Autowired
  private RemoteAircraftRepository remoteAircraftRepository;
  @Autowired
  private AircraftDataService aircraftDataService;

  private Feeder airplanesLiveFeeder;
  private static final String URL_AIRPLANES_LIVE_API = "https://api.airplanes.live/v2/point/";

  void fetchAircraftData(Request request) {
    JSONArray jsonArrayFromAirplanesLive = getDataFromAirplanesLive(request.getLomin(), request.getLamin(), request.getLomax(),
        request.getLamax());

    if (airplanesLiveFeeder == null) {
      airplanesLiveFeeder = createAirplanesLiveFeeder();
    }

    processAirplanesLiveJson(jsonArrayFromAirplanesLive);
  }

  private void processAirplanesLiveJson(JSONArray aircraftArray) {
    if (aircraftArray != null) {
      for (int i = 0; i < aircraftArray.length(); i++) {
        JSONObject element = aircraftArray.getJSONObject(i);

        // Prüfe, ob element alle Basis-Eigenschaften erfüllt (bspw. 'lat','lon' sind vorhanden)
        if (element != null && element.has("hex") && element.has("lat") && element.has("lon")
            && !element.isNull("lat") && !element.isNull("lon") && element.getDouble("lat") != 0
            && element.getDouble("lon") != 0) {

          RemoteAircraft aircraftNew = aircraftService.createNewRemoteAircraft(element, airplanesLiveFeeder);

          if (remoteAircraftRepository.existsById(aircraftNew.getHex())) {
            updateExistingAircraft(aircraftNew);
          } else {
            saveAircraftWithMoreDataInDb(aircraftNew);
          }
        }
      }
    }
  }

  private void saveAircraftWithMoreDataInDb(RemoteAircraft aircraftNew) {
    aircraftDataService.addAircraftData(aircraftNew);
    aircraftNew.setIsFromRemote("Airplanes-Live");
    aircraftNew.setLastUpdate(System.currentTimeMillis());

    try {
      // Schreibe Flugzeug in RemoteAircraft-Tabelle
      remoteAircraftRepository.save(aircraftNew);
    } catch (Exception e) {
      log.error("Server - DB error when writing new Airplanes-Live aircraftNew for hex "
          + aircraftNew.getHex() + ": Exception = " + e);
    }
  }

  private void updateExistingAircraft(RemoteAircraft aircraftNew) {
    RemoteAircraft aircraftInDb = remoteAircraftRepository.findByHex(aircraftNew.getHex());

    aircraftInDb.clearFeederList();
    aircraftInDb.clearSourceList();

    aircraftService.updateValuesOfAircraft(aircraftInDb, aircraftNew, airplanesLiveFeeder.getName(), false);

    try {
      remoteAircraftRepository.save(aircraftInDb);
    } catch (Exception e) {
      log.error("Server - DB error when writing Airplanes-Live aircraftNew for hex "
          + aircraftNew.getHex() + ": Exception = " + e);
    }
  }

  private Feeder createAirplanesLiveFeeder() {
    // Erstelle Feeder Airplanes-Live
    Feeder feeder = new Feeder("Airplanes-Live", null, "adsbx", "green");

    try {
      FeederMapping mapping = configuration.getMappingsFromConfig(feeder.getType());
      feeder.setMapping(mapping);
      return feeder;
    } catch (IOException e) {
      log.error(
          "Airplanes-Live: Feeder could not be created");
    }
    return null;
  }

  private JSONArray getDataFromAirplanesLive(Double lomin, Double lamin, Double lomax, Double lamax) {
    JSONArray jsonArrayAircraft = null;

    double centerLat = (lamin + lamax) / 2;
    double centerLon = (lomin + lomax) / 2;
    double radiusNm = 250;

    // Genriere URL mit Daten (lon/lat/radius)
    final String url = URL_AIRPLANES_LIVE_API + centerLat + "/" + centerLon + "/" + radiusNm;

    String jsonStr = networkHandler.makeServiceCall(url);

    try {
      if (jsonStr != null) {
        JSONObject jsonObject = new JSONObject(jsonStr);
        jsonArrayAircraft = jsonObject.getJSONArray("ac");
        if (jsonArrayAircraft == null || jsonArrayAircraft.isEmpty()) {
          throw new Exception();
        }
      }
    } catch (Exception e) {
      log.error(
          "Server: Data from Airplanes-Live-Network could not get fetched or there are no planes in this area. Url: "
              + url);
    }

    return jsonArrayAircraft;
  }
}
