package com.amnesica.belugaproject;

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

import java.util.ArrayList;
import java.util.List;

import static org.hibernate.validator.internal.util.Contracts.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@SpringBootTest(classes = {AircraftTrailService.class})
@ExtendWith(MockitoExtension.class)
public class AircraftTrailServiceTests {

  @MockBean
  TrailHelperService trailHelperService;
  @MockBean
  Configuration configuration;
  @MockBean
  AircraftTrailRepository aircraftTrailRepository;

  @InjectMocks
  AircraftTrailService aircraftTrailService;

  private List<AircraftTrail> mockTrails;

  @BeforeEach
  public void setUp() {
    mockTrails = new ArrayList<>();

    // actual range outline
    AircraftTrail trailNorth = new AircraftTrail("hex1", 8.095836, 10.010123, 1000, false, 100000L, "feeder1", "adsb", 1, 0.0);
    trailNorth.setDistanceToSite(51.0);
    trailNorth.setAngleToSite(0);
    mockTrails.add(trailNorth);

    AircraftTrail trailWest = new AircraftTrail("hex2", 11.731005, 53.469085, 1000, false, 100000L, "feeder2", "adsb", 1, 0.0);
    trailWest.setDistanceToSite(62.0);
    trailWest.setAngleToSite(90);
    mockTrails.add(trailWest);

    AircraftTrail trailSouth = new AircraftTrail("hex3", 9.963191, 52.683709, 1000, false, 100000L, "feeder1", "adsb", 1, 0.0);
    trailSouth.setDistanceToSite(52.0);
    trailSouth.setAngleToSite(180);
    mockTrails.add(trailSouth);

    AircraftTrail trailEast = new AircraftTrail("hex3", 8.052483, 53.554015, 1000, false, 100000L, "feeder2", "adsb", 1, 0.0);
    trailEast.setDistanceToSite(69.0);
    trailEast.setAngleToSite(270);
    mockTrails.add(trailEast);

    for (AircraftTrail trail : mockTrails) {
      aircraftTrailService.addTrailToOutlineMapIfNecessary(trail, trail.getFeeder());
    }
  }

  @Test
  void addTrailToOutlineMapIfNecessaryBothFeederTest() {
    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1", "feeder2"));

    assertNotNull(actualOutline);
    assertEquals(4, actualOutline.size());
  }

  @Test
  void addTrailToOutlineMapIfNecessaryOneFeederTest() {
    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));

    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
  }

  @Test
  void actualRangeDataOutlineShouldAddTrailIfOutsideOfPolygonTest() {
    // trail outside of polygon -> should be added to outline
    AircraftTrail trailOutside = new AircraftTrail("hex3", 9.993732, 54.634054, 1000, false, 100000L, "feeder1", "adsb", 1, 0.0);
    trailOutside.setDistanceToSite(6.0);
    trailOutside.setAngleToSite(2); // important!
    aircraftTrailService.addTrailToOutlineMapIfNecessary(trailOutside, trailOutside.getFeeder());

    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));

    assertNotNull(actualOutline);
    assertEquals(3, actualOutline.size());
    assertEquals(trailOutside, actualOutline.get(1)); // trailInside has been added
  }

  @Test
  void actualRangeDataOutlineShouldReplaceTrailIfOutsideOfPolygonTest() {
    // trail outside of polygon -> should be added to outline
    AircraftTrail trailOutside = new AircraftTrail("hex3", 9.993732, 53.634054, 1000, false, 100000L, "feeder1", "adsb", 1, 0.0);
    trailOutside.setDistanceToSite(5.0);
    trailOutside.setAngleToSite(0); // important!
    aircraftTrailService.addTrailToOutlineMapIfNecessary(trailOutside, trailOutside.getFeeder());

    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));

    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
    assertEquals(trailOutside, actualOutline.get(0)); // trailInside has replaced old trail
  }

  @Test
  void actualRangeDataOutlineShouldNotAddTrailIfInsideOfPolygonTest() {
    // trail inside of polygon -> should not be added to outline
    AircraftTrail trailInside = new AircraftTrail("hex3", 9.993732, 53.634054, 1000, false, 100000L, "feeder1", "adsb", 1, 0.0);
    trailInside.setDistanceToSite(5.0);
    trailInside.setAngleToSite(0); // important!
    mockTrails.add(trailInside);
    List<AircraftTrail> actualOutline = aircraftTrailService.getActualOutlineFromLast24Hours(List.of("feeder1"));

    assertNotNull(actualOutline);
    assertEquals(2, actualOutline.size());
    assertNotEquals(trailInside, actualOutline.get(0));
  }
}
