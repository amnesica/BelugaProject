package com.amnesica.belugaproject.services;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.entities.trails.AircraftTrail;
import com.amnesica.belugaproject.repositories.trails.AircraftTrailRepository;
import com.amnesica.belugaproject.services.helper.TrailHelperService;
import com.amnesica.belugaproject.services.trails.AircraftTrailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ActiveProfiles("test")
@SpringBootTest(classes = {AircraftTrailService.class})
@ExtendWith(MockitoExtension.class)
public class AircraftTrailServiceTests {

  @MockBean
  private TrailHelperService trailHelperService;
  @MockBean
  private Configuration configuration;
  @MockBean
  private AircraftTrailRepository aircraftTrailRepository;

  @InjectMocks
  private AircraftTrailService aircraftTrailService;

  private List<AircraftTrail> mockTrails;

  @BeforeEach
  public void setUp() {
    mockTrails = createMockTrails();
    addMockTrailsToService();
  }

  private List<AircraftTrail> createMockTrails() {
    List<AircraftTrail> trails = new ArrayList<>();
    trails.add(createTrail("hex1", 8.095836, 10.010123, 51.0, 0, "feeder1"));
    trails.add(createTrail("hex2", 11.731005, 53.469085, 62.0, 90, "feeder2"));
    trails.add(createTrail("hex3", 9.963191, 52.683709, 52.0, 180, "feeder1"));
    trails.add(createTrail("hex3", 8.052483, 53.554015, 69.0, 270, "feeder2"));
    return trails;
  }

  private AircraftTrail createTrail(String hex, double latitude, double longitude, double distance, int angle, String feeder) {
    AircraftTrail trail = new AircraftTrail(hex, latitude, longitude, 1000, false, 100000L, feeder, "adsb", 1, 0.0);
    trail.setDistanceToSite(distance);
    trail.setAngleToSite(angle);
    return trail;
  }

  private void addMockTrailsToService() {
    mockTrails.forEach(trail ->
        aircraftTrailService.addTrailToOutlineMapIfNecessary(trail, trail.getFeeder()));
  }

  @Test
  public void addTrailToOutlineMapForBothFeedersTest() {
    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1", "feeder2"));
    assertNotNull(actualOutline);
    assertEquals(4, actualOutline.size());
  }

  @Test
  public void addTrailToOutlineMapForSingleFeederTest() {
    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));
    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
  }

  @Test
  public void addTrailOutsidePolygonTest() {
    AircraftTrail trailOutside = createTrail("hex", 9.993732, 54.634054, 6.0, 2, "feeder1");
    aircraftTrailService.addTrailToOutlineMapIfNecessary(trailOutside, trailOutside.getFeeder());

    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));
    assertNotNull(actualOutline);
    assertEquals(3, actualOutline.size());
    assertTrue(actualOutline.contains(trailOutside));  // trailOutside has been added
  }

  @Test
  public void replaceTrailWithSameAngleIfNewTrailIsOutsideOfPolygonTest() {
    AircraftTrail trailOutside = createTrail("hex", 9.993732, 53.634054, 100.0, 0, "feeder1");
    aircraftTrailService.addTrailToOutlineMapIfNecessary(trailOutside, trailOutside.getFeeder());

    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));
    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
    assertEquals(trailOutside, actualOutline.get(0));
  }

  @Test
  public void doNotAddTrailInsidePolygonTest() {
    AircraftTrail trailInside = createTrail("hex", 9.993732, 53.634054, 5.0, 0, "feeder1");
    mockTrails.add(trailInside);

    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));
    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
    assertFalse(actualOutline.contains(trailInside));
  }

  @Test
  public void doNotAddTrailOutsidePolygonOverMaxRangeTest() {
    AircraftTrail trailOutside = createTrail("hex", 9.993732, 53.634054, 670.0, 0, "feeder1");
    aircraftTrailService.addTrailToOutlineMapIfNecessary(trailOutside, trailOutside.getFeeder());

    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));
    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
    assertFalse(actualOutline.contains(trailOutside));
  }
}
