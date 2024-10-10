package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
public class LocationFinderService {

  @Autowired
  private NetworkHandlerService networkHandlerService;

  public List<Double> getCoordinatesFromPlace(String inputPlace) {
    if (inputPlace == null || inputPlace.isEmpty()) return null;

    // Special case EDDH
    if (inputPlace.equals("EDDH")) {
      // EDDH referenziert auf Fiji, der place muss ausgeschlossen werden
      inputPlace = "EDDH&exclude_place_ids=28192335,27900465";
    }

    final String query = "https://nominatim.openstreetmap.org/search?q=" + inputPlace + "&format=jsonv2";
    System.out.println(query);
    final String htmlContent = networkHandlerService.makeServiceCall(query);
    if (htmlContent == null || htmlContent.isEmpty()) return null;

    try {
      final JSONArray jsonArray = new JSONArray(htmlContent);
      final JSONObject jsonObject = jsonArray.getJSONObject(0);
      final Double latitude = jsonObject.getDouble("lat");
      final Double longitude = jsonObject.getDouble("lon");
      if (latitude == null || longitude == null) return null;

      return Arrays.asList(latitude, longitude);
    } catch (Exception e) {
      log.error("Server - Error fetching place from nominatim.openstreetmap.org. Query: {}", query);
    }

    return null;
  }
}
