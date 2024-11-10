package com.amnesica.belugaproject.services;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.config.Feeder;
import com.amnesica.belugaproject.config.FeederMapping;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.repositories.aircraft.AircraftRepository;
import com.amnesica.belugaproject.services.aircraft.AircraftService;
import com.amnesica.belugaproject.services.aircraft.HistoryAircraftService;
import com.amnesica.belugaproject.services.aircraft.LocalFeederService;
import com.amnesica.belugaproject.services.data.*;
import com.amnesica.belugaproject.services.helper.NetworkHandlerService;
import com.amnesica.belugaproject.services.trails.AircraftTrailService;
import com.amnesica.belugaproject.utils.TestUtil;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.info.BuildProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@Slf4j
@ActiveProfiles("test")
@SpringBootTest(classes = {AircraftTrailService.class, AircraftService.class, Configuration.class})
@ContextConfiguration(classes = BuildProperties.class)
@ExtendWith(MockitoExtension.class)
public class LocalFeederServiceTests {

  @MockBean
  private NetworkHandlerService networkHandler;
  @MockBean
  private AircraftDataService aircraftDataService;
  @MockBean
  private HistoryAircraftService historyAircraftService;
  @MockBean
  private AircraftTrailService aircraftTrailService;
  @MockBean
  private AirportDataService airportDataService;
  @MockBean
  private AircraftRepository aircraftRepository;
  @MockBean
  private RegcodeDataService regcodeDataService;
  @MockBean
  private OperatorDataService operatorDataService;
  @MockBean
  private FlightrouteDataService flightrouteDataService;

  @Spy
  @Autowired
  private Configuration configuration;
  @Spy
  @InjectMocks
  private AircraftService aircraftService;
  @InjectMocks
  private LocalFeederService localFeederService;


  private static Stream<Arguments> getArguments() {
    // type feeder, filename aircraft json, expected #aircraft
    return Stream.of(
        Arguments.of("adsbx", "adsbx_aircraft.json", 25),
        Arguments.of("vrs", "vrs_aircraft.json", 6),
        Arguments.of("dump1090-fa", "dump1090-fa_aircraft.json", 21),
        Arguments.of("airsquitter", "airsquitter_aircraft.json", 21)
    );
  }

  @ParameterizedTest
  @MethodSource("getArguments")
  @SneakyThrows
  void processValidAircraftFromFeederTypeTest(String type, String fileNameJsonTestResource, int expectedNumberAircraft) {
    final List<Aircraft> savedAircraft = new ArrayList<>();
    final Feeder feeder = createFeederWithMapping(type);

    when(configuration.getListFeeder()).thenReturn(List.of(feeder));
    when(networkHandler.makeServiceCallLocalFeeder(anyString())).thenReturn(getJsonResource(fileNameJsonTestResource));
    when(aircraftRepository.existsById(anyString())).thenReturn(false);
    when(aircraftRepository.save(any(Aircraft.class))).thenAnswer(invocation -> addSavedAircraftToList(invocation, savedAircraft));

    localFeederService.getPlanesFromFeeder();

    assertEquals(expectedNumberAircraft, savedAircraft.size());
    savedAircraft.forEach(aircraft -> {
      assertNotNull(aircraft.getHex());
      assertNotNull(aircraft.getLatitude());
      assertNotNull(aircraft.getLongitude());
    });
  }

  @Test
  @SneakyThrows
  void processAdsbxMlatAircraftTest() {
    final String type = "adsbx";
    final String fileNameJsonTestResource = "adsbx_aircraft_mlat.json";
    final int expectedNumberAircraft = 4;

    final List<Aircraft> savedAircraft = new ArrayList<>();
    final Feeder feeder = createFeederWithMapping(type);

    when(configuration.getListFeeder()).thenReturn(List.of(feeder));
    when(networkHandler.makeServiceCallLocalFeeder(anyString())).thenReturn(getJsonResource(fileNameJsonTestResource));
    when(aircraftRepository.existsById(anyString())).thenReturn(false);
    when(aircraftRepository.save(any(Aircraft.class))).thenAnswer(invocation -> addSavedAircraftToList(invocation, savedAircraft));

    localFeederService.getPlanesFromFeeder();

    assertEquals(expectedNumberAircraft, savedAircraft.size());
    for (int i = 0; i < savedAircraft.size(); i++) {
      assertNotNull(savedAircraft.get(i).getHex());
      assertNotNull(savedAircraft.get(i).getLatitude());
      assertNotNull(savedAircraft.get(i).getLongitude());
      assertNotNull(savedAircraft.get(i).getSourceList());

      if (i == 2) {
        assertTrue(savedAircraft.get(i).getSourceList().contains("test:adsb_icao"));
      } else {
        assertTrue(savedAircraft.get(i).getSourceList().contains("test:mlat"));
      }
    }
  }

  @NotNull
  private Feeder createFeederWithMapping(String type) {
    Feeder feeder = new Feeder("test", "127.0.0.1", type, "color");
    addMappingToFeeder(feeder);
    return feeder;
  }

  private String getJsonResource(String filename) {
    return TestUtil.getResource(filename);
  }

  private void addMappingToFeeder(Feeder feeder) {
    try {
      FeederMapping mapping = configuration.getMappingsFromConfig(feeder.getType());
      feeder.setMapping(mapping);
    } catch (IOException e) {
      fail(String.format("Failed to get mapping configuration for feeder %s", feeder.getName()), e);
    }
  }

  private static Aircraft addSavedAircraftToList(InvocationOnMock invocation, List<Aircraft> savedAircraft) {
    Aircraft aircraft = invocation.getArgument(0);
    savedAircraft.add(aircraft);
    return aircraft;
  }
}
