package com.amnesica.belugaproject.services;

import com.amnesica.belugaproject.entities.ships.Ship;
import com.amnesica.belugaproject.services.ships.AisStreamWebsocketClient;
import com.amnesica.belugaproject.utils.TestUtil;
import lombok.extern.slf4j.Slf4j;
import okhttp3.WebSocket;
import okio.ByteString;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;
import software.xdev.mockserver.client.MockServerClient;
import software.xdev.mockserver.model.HttpRequest;
import software.xdev.mockserver.model.HttpResponse;
import software.xdev.mockserver.netty.MockServer;
import software.xdev.mockserver.verify.VerificationTimes;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@Slf4j
@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
class AisStreamWebsocketClientTests {

  private MockServer mockServer;
  private MockServerClient mockServerClient;
  private final int PORT = 1070;

  private ConcurrentHashMap<Integer, Ship> initialAisShips;
  private final String API_KEY = "test-api-key";
  private final Double MIN_LAT = 53.0;
  private final Double MIN_LONG = 9.0;
  private final Double MAX_LAT = 54.0;
  private final Double MAX_LONG = 10.0;

  @Mock
  private WebSocket webSocket;

  private AisStreamWebsocketClient aisStreamWebsocketClient;

  @BeforeEach
  void setUp() {
    mockServer = new MockServer(PORT);
    mockServerClient = new MockServerClient("localhost", PORT);
    setupAisWebsocketClient();

    // Reset any interactions that might have happened during setup
    Mockito.clearInvocations(webSocket);
  }

  private void setupAisWebsocketClient() {
    initialAisShips = new ConcurrentHashMap<>();

    // Handle WebSocket connections with MockServer
    mockServerClient
        .when(
            HttpRequest.request()
                .withPath("/")
        )
        .respond(
            HttpResponse.response()
                .withStatusCode(101) // Switching Protocols for WebSocket
                .withHeader("Upgrade", "websocket")
                .withHeader("Connection", "Upgrade")
        );

    // Create client with URI pointing to mock server
    URI serverUri = URI.create("ws://localhost:" + PORT);

    // Create a spy directly instead of creating a real client first
    aisStreamWebsocketClient = Mockito.spy(new AisStreamWebsocketClient(
        serverUri,
        API_KEY,
        MIN_LAT,
        MIN_LONG,
        MAX_LAT,
        MAX_LONG,
        initialAisShips
    ));

    // Set the mock WebSocket using the testing setter
    aisStreamWebsocketClient.setWebSocket(webSocket);
  }

  @AfterEach
  void tearDown() {
    aisStreamWebsocketClient.stopClient();
    mockServer.stop();
  }

  @Test
  void testOnOpen_SendsSubscriptionMessage() {
    // Call onOpen
    aisStreamWebsocketClient.onOpen(webSocket, null);

    // Capture the subscription message
    ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
    verify(webSocket, times(1)).send(messageCaptor.capture());

    // Verify the subscription message format and connection
    String subscriptionMessage = messageCaptor.getValue();
    assertTrue(subscriptionMessage.contains("\"APIkey\":\"" + API_KEY + "\""));
    assertTrue(subscriptionMessage.contains("\"BoundingBoxes\""));
    assertTrue(subscriptionMessage.contains("\"FilterMessageTypes\": [\"PositionReport\", \"ShipStaticData\"]"));
    assertTrue(aisStreamWebsocketClient.isConnected());
  }

  @Test
  void testUpdateBoundingBox() {
    // New bounding box
    Double newMinLat = 52.0;
    Double newMinLong = 8.0;
    Double newMaxLat = 55.0;
    Double newMaxLong = 11.0;

    // First initiate connection
    testOnOpen_SendsSubscriptionMessage();

    // Don't trigger rate limit
    try {
      TimeUnit.SECONDS.sleep(2);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }

    // Update bounding box
    aisStreamWebsocketClient.updateBoundingBox(newMinLat, newMinLong, newMaxLat, newMaxLong);

    // Verify new subscription message was sent
    verify(webSocket, times(2)).send(any(String.class));

    // Verify the bounding box is updated by testing the boundingBoxHasMoved method
    assertFalse(aisStreamWebsocketClient.boundingBoxHasMoved(newMinLat, newMinLong, newMaxLat, newMaxLong));
    assertTrue(aisStreamWebsocketClient.boundingBoxHasMoved(MIN_LAT, MIN_LONG, MAX_LAT, MAX_LONG));
  }

  @Test
  void testOnMessage_PositionReportMessage_ProcessesCorrectly() {
    // Prepare a position report message
    String positionReportMessage = TestUtil.getResource("ais_position_report_message.json");

    // Call onMessage with the test message
    ByteString bytes = ByteString.of(positionReportMessage.getBytes(StandardCharsets.UTF_8));
    aisStreamWebsocketClient.onMessage(webSocket, bytes);

    // Verify ship was added
    assertEquals(1, aisStreamWebsocketClient.getAisShips().size());

    // Verify ship details
    Ship ship = aisStreamWebsocketClient.getAisShips().get(123456);
    assertNotNull(ship);
    assertEquals(53.5, ship.getLatitude());
    assertEquals(9.5, ship.getLongitude());
    assertEquals(123456, ship.getUserId());
    assertEquals("Test Ship", ship.getShipName());
    assertEquals(123456, ship.getMmsi());
    assertEquals("2023-01-01T12:00:00Z", ship.getTimeUTC());
  }

  @Test
  void testOnMessage_ShipStaticDataMessage_ProcessesCorrectly() {
    // Clear any ships from previous tests
    aisStreamWebsocketClient.clearAisShips();

    // First add a ship to update
    Ship existingShip = new Ship(53.5, 9.5, 123456, "2023-01-01T12:00:00Z", 123456, "Test Ship", System.currentTimeMillis());
    aisStreamWebsocketClient.getAisShips().put(123456, existingShip);

    // Prepare a ship static data message
    String shipStaticDataMessage = TestUtil.getResource("ais_ship_static_data_message.json");

    // Call onMessage with the test message
    ByteString bytes = ByteString.of(shipStaticDataMessage.getBytes(StandardCharsets.UTF_8));
    aisStreamWebsocketClient.onMessage(webSocket, bytes);

    // Verify ship data
    assertEquals(1, aisStreamWebsocketClient.getAisShips().size());
    verifyShipStaticData();
  }

  private void verifyShipStaticData() {
    Ship ship = aisStreamWebsocketClient.getAisShips().get(123456);
    assertNotNull(ship);
    assertEquals("TEST123", ship.getCallSign());
    assertEquals("Hamburg", ship.getDestination());
    assertEquals(9876543, ship.getImoNumber());
    assertEquals(10.5, ship.getMaximumStaticDraught());

    assertNotNull(ship.getDimension());
    assertEquals(100, ship.getDimension().to_bow());
    assertEquals(20, ship.getDimension().to_stern());
    assertEquals(10, ship.getDimension().to_port());
    assertEquals(10, ship.getDimension().to_starboard());
    assertEquals("Test Ship Full Name", ship.getName());
    assertEquals(70, ship.getType());
    assertNotNull(ship.getEta());
    assertEquals(2, ship.getEta().month());
    assertEquals(15, ship.getEta().day());
    assertEquals(14, ship.getEta().hour());
    assertEquals(30, ship.getEta().minute());

    assertEquals("2023-01-01T13:00:00Z", ship.getTimeUTC());
    assertEquals("Updated Ship Name", ship.getShipName());
  }

  @Test
  void testRateLimit_PreventsTooFrequentUpdates() throws Exception {
    // Set lastSendSubscriptionMessage to current time to simulate recent update
    aisStreamWebsocketClient.setLastSendSubscriptionMessage(Instant.now());

    // Try to update bounding box within rate limit period
    aisStreamWebsocketClient.updateBoundingBox(52.0, 8.0, 55.0, 11.0);

    // Verify no message was sent due to rate limiting
    verify(webSocket, never()).send(any(String.class));

    // Set the last send time to be outside the rate limit period
    aisStreamWebsocketClient.setLastSendSubscriptionMessage(Instant.now().minus(2, ChronoUnit.SECONDS));

    // Clear any previous interactions
    Mockito.clearInvocations(webSocket);

    // Try again
    aisStreamWebsocketClient.updateBoundingBox(51.0, 7.0, 56.0, 12.0);

    // Verify the message was sent
    verify(webSocket).send(any(String.class));
  }

  @Test
  void testOnClosed_SetsConnectionStatusToFalse() {
    // Initially connection is not established
    assertFalse(aisStreamWebsocketClient.isConnected());

    // Simulate a connection being established
    aisStreamWebsocketClient.setConnected(true);

    // Verify connection is now established
    assertTrue(aisStreamWebsocketClient.isConnected());

    // Simulate connection closing
    aisStreamWebsocketClient.onClosed(webSocket, 1000, "Normal closure");

    // Verify connection is marked as closed
    assertFalse(aisStreamWebsocketClient.isConnected());
  }

  @Test
  void testOnFailure_SetsConnectionStatusToFalse() {
    // Simulate a connection being established
    aisStreamWebsocketClient.setConnected(true);

    // Verify connection is established
    assertTrue(aisStreamWebsocketClient.isConnected());

    // Simulate connection failure
    aisStreamWebsocketClient.onFailure(webSocket, new Exception("Connection failed"), null);

    // Verify connection is marked as closed
    assertFalse(aisStreamWebsocketClient.isConnected());
  }

  @Test
  void testSetPhotoUrl() {
    // Clear any ships from previous tests
    aisStreamWebsocketClient.clearAisShips();

    // Add a ship
    Ship ship = new Ship(53.5, 9.5, 123456, "2023-01-01T12:00:00Z", 123456, "Test Ship", System.currentTimeMillis());
    aisStreamWebsocketClient.getAisShips().put(123456, ship);

    // Set photo URL
    String photoUrl = "https://example.com/ship-photo.jpg";
    aisStreamWebsocketClient.setPhotoUrl(123456, photoUrl);

    // Verify photo URL was set
    assertEquals(photoUrl, ship.getPhotoUrl());

    // Test with null URL
    aisStreamWebsocketClient.setPhotoUrl(123456, null);

    // URL should remain unchanged
    assertEquals(photoUrl, ship.getPhotoUrl());

    // Test with invalid MMSI (key) should not throw an exception
    aisStreamWebsocketClient.setPhotoUrl(999999, "https://example.com/another-photo.jpg");
  }

  @Test
  void testClearAisShips() {
    // Clear any state from previous tests
    aisStreamWebsocketClient.clearAisShips();

    // Add a few ships
    Ship ship1 = new Ship(53.5, 9.5, 123456, "2023-01-01T12:00:00Z", 123456, "Test Ship 1", System.currentTimeMillis());
    Ship ship2 = new Ship(54.0, 10.0, 654321, "2023-01-01T13:00:00Z", 654321, "Test Ship 2", System.currentTimeMillis());
    aisStreamWebsocketClient.getAisShips().put(123456, ship1);
    aisStreamWebsocketClient.getAisShips().put(654321, ship2);

    // Verify ships were added
    assertEquals(2, aisStreamWebsocketClient.getAisShips().size());

    // Clear ships
    aisStreamWebsocketClient.clearAisShips();

    // Verify ships were cleared
    assertEquals(0, aisStreamWebsocketClient.getAisShips().size());
  }

  @Test
  void testStopClient() {
    // Stop client
    aisStreamWebsocketClient.stopClient();

    // Verify webSocket was closed
    verify(webSocket).close(eq(1000), eq("Client closing connection"));

    // Verify webSocket reference was cleared
    assertNull(aisStreamWebsocketClient.getWebSocket());
  }

  @Test
  void testWebSocketConnection_WithMockServer() {
    // Give the client some time to connect
    try {
      TimeUnit.MILLISECONDS.sleep(500);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
    }

    // Verify that a WebSocket upgrade request was sent to the mock server
    mockServerClient.verify(
        HttpRequest.request()
            .withMethod("GET")
            .withPath("/"),
        VerificationTimes.atLeast(1)
    );
  }
}
