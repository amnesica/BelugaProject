package com.amnesica.belugaproject.services.helper;


import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.entities.trails.SpacecraftTrail;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TrailHelperService {

  public List<AircraftTrail> checkAircraftTrailsFor180Border(List<AircraftTrail> trails) {
    if (trails == null) return null;

    List<AircraftTrail> trailsWith180Check = new ArrayList<>();

    // check for 180 cross
    for (int i = 0; i < trails.size(); i++) {
      trailsWith180Check.add(trails.get(i));
      if (i == trails.size() - 1) continue;

      var nextTrail = trails.get(i + 1);
      var currentTrail = trails.get(i);

      if (nextTrail == null || currentTrail == null) continue;

      if (Math.abs(currentTrail.getLongitude() - nextTrail.getLongitude()) > 180) {
        var midY = (nextTrail.getLatitude() + currentTrail.getLatitude()) / 2;

        var tempEndpoint = new AircraftTrail(currentTrail.getHex(), nextTrail.getLongitude(), midY, nextTrail.getAltitude(), true, 0L, null, null, currentTrail.getTrack(), currentTrail.getRoll());
        var tempStartpoint = new AircraftTrail(currentTrail.getHex(), nextTrail.getLongitude(), midY, nextTrail.getAltitude(), true, 0L, null, null, nextTrail.getTrack(), nextTrail.getRoll());

        if (currentTrail.getLongitude() > nextTrail.getLongitude()) {
          tempEndpoint.setLongitude(-180.0);
          tempStartpoint.setLongitude(180.0);
        } else {
          tempEndpoint.setLongitude(180.0);
          tempStartpoint.setLongitude(-180.0);
        }

        trailsWith180Check.add(tempStartpoint);
        trailsWith180Check.add(tempEndpoint);

      }
    }
    return trailsWith180Check;
  }

  public List<SpacecraftTrail> checkSpacecraftTrailsFor180Border(List<SpacecraftTrail> trails) {
    if (trails == null) return null;

    List<SpacecraftTrail> trailsWith180Check = new ArrayList<>();

    // check for 180 cross
    for (int i = 0; i < trails.size(); i++) {
      trailsWith180Check.add(trails.get(i));
      if (i == trails.size() - 1) continue;

      var nextTrail = trails.get(i + 1);
      var currentTrail = trails.get(i);

      if (nextTrail == null || currentTrail == null) continue;

      if (Math.abs(currentTrail.getLongitude() - nextTrail.getLongitude()) > 180) {
        var midY = (nextTrail.getLatitude() + currentTrail.getLatitude()) / 2;

        var tempEndpoint = new SpacecraftTrail(currentTrail.getHex(), nextTrail.getLongitude(), midY, nextTrail.getAltitude(), false, currentTrail.getTimestamp() + 1, null, null, currentTrail.getTrack(), currentTrail.getRoll());
        var tempStartpoint = new SpacecraftTrail(currentTrail.getHex(), nextTrail.getLongitude(), midY, nextTrail.getAltitude(), false, nextTrail.getTimestamp() - 1, null, null, nextTrail.getTrack(), nextTrail.getRoll());

        if (currentTrail.getLongitude() > nextTrail.getLongitude()) {
          tempEndpoint.setLongitude(-180.0);
          tempStartpoint.setLongitude(180.0);
        } else {
          tempEndpoint.setLongitude(180.0);
          tempStartpoint.setLongitude(-180.0);
        }

        trailsWith180Check.add(tempStartpoint);
        trailsWith180Check.add(tempEndpoint);

      }
    }
    return trailsWith180Check;
  }
}
