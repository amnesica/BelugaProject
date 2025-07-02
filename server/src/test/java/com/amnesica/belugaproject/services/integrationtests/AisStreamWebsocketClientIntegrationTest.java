package com.amnesica.belugaproject.services.integrationtests;

import com.amnesica.belugaproject.entities.ships.Ship;
import com.amnesica.belugaproject.services.ships.AisStreamWebsocketClient;
import com.amnesica.belugaproject.services.ships.okhttp.OkHttpWebSocketClientFactory;
import com.amnesica.belugaproject.utils.TestNettyWebSocketServer;
import com.amnesica.belugaproject.utils.TestUtil;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@Slf4j
class AisStreamWebsocketClientIntegrationTest {

  private TestNettyWebSocketServer server;

  private final int PORT = 1070;
  private final String PATH = "/ais-stream";
  private final String TEST_API_KEY = "test-api-key";
  private final String TEST_SERVER_URI = "ws://localhost:" + PORT + PATH;

  private AisStreamWebsocketClient aisStreamWebsocketClient;
  private OkHttpWebSocketClientFactory webSocketClientFactory;
  private ConcurrentHashMap<Integer, Ship> initialShips;

  @BeforeEach
  void setUp() throws InterruptedException {
    System.out.println("################# Setting up test #################");

    server = new TestNettyWebSocketServer(PORT, PATH);
    server.start();
    System.out.println("WebSocket server started at ws://localhost:1070/ais-stream");

    webSocketClientFactory = new OkHttpWebSocketClientFactory();
    initialShips = new ConcurrentHashMap<>();

    connectToWebSocket();

    System.out.println("----------------- Set up completed -----------------");
    System.out.println("----------------- Starting test case -----------------");
  }

  private void connectToWebSocket() throws InterruptedException {
    // Create client and wait for connection
    createAisStreamWebSocketClient(50.0, 20.0, 50.0, 20.0);

    // Create connection by sending an initial bounding box update
    createOrUpdateConnection(50.0, 20.0, 50.0, 20.0);

    // Wait for the connection to be established
    waitSeconds(1);

    // Verify client is connected
    assertTrue(aisStreamWebsocketClient.isConnected());
    boolean clientConnected = isClientConnected();
    System.out.println("Websocket connection established: " + clientConnected);
    assertTrue(clientConnected);
  }

  @AfterEach
  void tearDown() throws InterruptedException {
    System.out.println("----------------- Completed test case -----------------");
    System.out.println("----------------- Tearing down test -----------------");
    if (aisStreamWebsocketClient != null) {
      System.out.println("Stopping AisStreamWebsocketClient...");
      aisStreamWebsocketClient.stopClient();
    }
    if (server != null) {
      System.out.println("Stopping WebSocket server...");
      server.stop();
    }
    System.out.println("----------------- Tear down completed -----------------");
  }

  private void createOrUpdateConnection(double minLat, double minLon, double maxLat, double maxLon) {
    aisStreamWebsocketClient.updateBoundingBox(minLat, minLon, maxLat, maxLon);
  }

  private void createAisStreamWebSocketClient(double minLat, double minLon, double maxLat, double maxLon) {
    aisStreamWebsocketClient = new AisStreamWebsocketClient(webSocketClientFactory, TEST_SERVER_URI, TEST_API_KEY, minLat, minLon, maxLat, maxLon, initialShips);
  }

  @Test
  void webSocketConnectionTest() {
    // Verify connection was established
    assertTrue(aisStreamWebsocketClient.isConnected(), "WebSocket should be connected");
  }

  @Test
  void receivePositionReportMessageTest() throws InterruptedException {
    // Send position report message to the client
    String positionReportMessage = TestUtil.getResource("ais_position_report_message.json");

    // Simulate server sending message to client
    sendWebSocketMessage(positionReportMessage);

    // Wait for the message to be processed
    waitSeconds(2);

    // Verify ship was added to the collection
    assertEquals(1, aisStreamWebsocketClient.getAisShips().size());

    Ship ship = aisStreamWebsocketClient.getAisShips().get(123456);
    assertNotNull(ship);
    assertEquals(53.5, ship.getLatitude());
    assertEquals(9.5, ship.getLongitude());
    assertEquals(123456, ship.getUserId());
    assertEquals("Test Ship", ship.getShipName());
    assertEquals(123456, ship.getMmsi());
  }

  @Test
  void receiveShipStaticDataMessageTest() throws InterruptedException {
    // First send position report to create the ship
    String positionReportMessage = TestUtil.getResource("ais_position_report_message.json");
    sendWebSocketMessage(positionReportMessage);

    // Wait for the message to be processed
    waitSeconds(2);

    // Then send ship static data
    String shipStaticDataMessage = TestUtil.getResource("ais_ship_static_data_message.json");
    sendWebSocketMessage(shipStaticDataMessage);

    // Wait for the message to be processed
    waitSeconds(2);

    // Verify ship static data was updated
    Ship ship = aisStreamWebsocketClient.getAisShips().get(123456);
    assertNotNull(ship);
    assertEquals("TEST123", ship.getCallSign());
    assertEquals("Hamburg", ship.getDestination().trim());
    assertEquals(9876543, ship.getImoNumber());
    assertEquals(10.5, ship.getMaximumStaticDraught());
    assertEquals("Test Ship Full Name", ship.getName().trim());
    assertEquals(70, ship.getType());

    // Verify dimension
    assertNotNull(ship.getDimension());
    assertEquals(100, ship.getDimension().to_bow());
    assertEquals(20, ship.getDimension().to_stern());
    assertEquals(10, ship.getDimension().to_port());
    assertEquals(10, ship.getDimension().to_starboard());

    // Verify ETA
    assertNotNull(ship.getEta());
    assertEquals(2, ship.getEta().month());
    assertEquals(15, ship.getEta().day());
    assertEquals(14, ship.getEta().hour());
    assertEquals(30, ship.getEta().minute());
  }

  @Test
  void boundingBoxUpdateSendsNewSubscriptionMessageTest() throws InterruptedException {
    // Update bounding box - should trigger new subscription message
    createOrUpdateConnection(52.0, 12.0, 53.0, 13.0);

    // Wait for rate limit to pass
    waitSeconds(2);

    // Update again to ensure it works after rate limit
    createOrUpdateConnection(54.0, 14.0, 55.0, 15.0);

    // Verify client is still connected
    assertTrue(aisStreamWebsocketClient.isConnected());
  }

  @Test
  void multiplePositionReportsUpdateSameShipTest() throws InterruptedException {
    // Send first position report
    String positionReport1 = TestUtil.getResource("ais_position_report_message.json");
    sendWebSocketMessage(positionReport1);

    // Wait for the message to be processed
    waitSeconds(2);

    // Verify ship was created
    assertEquals(1, aisStreamWebsocketClient.getAisShips().size());
    Ship ship = aisStreamWebsocketClient.getAisShips().get(123456);
    long firstTimestamp = ship.getTimestamp();

    // Send second position report (modified coordinates)
    String positionReport2 = positionReport1.replace("53.5", "53.6").replace("9.5", "9.6");
    sendWebSocketMessage(positionReport2);

    // Wait for the message to be processed
    waitSeconds(2);

    // Verify ship was updated, not duplicated
    assertEquals(1, aisStreamWebsocketClient.getAisShips().size());
    ship = aisStreamWebsocketClient.getAisShips().get(123456);
    assertEquals(53.6, ship.getLatitude());
    assertEquals(9.6, ship.getLongitude());
    assertTrue(ship.getTimestamp() > firstTimestamp, "Timestamp should be updated");
  }

  @Test
  void invalidJsonMessageHandlingTest() throws InterruptedException {
    // Send invalid JSON
    sendWebSocketMessage("invalid json");

    // Wait for the message to be processed
    waitSeconds(2);

    // Send valid message after invalid one
    String validMessage = TestUtil.getResource("ais_position_report_message.json");
    sendWebSocketMessage(validMessage);

    // Wait for the message to be processed
    waitSeconds(2);

    // Verify client is still connected and can process valid messages
    assertTrue(aisStreamWebsocketClient.isConnected());
    assertEquals(1, aisStreamWebsocketClient.getAisShips().size());
  }

  @Test
  void clientDisconnectionHandlingTest() throws InterruptedException {
    // Verify initial connection
    assertTrue(aisStreamWebsocketClient.isConnected());

    // Stop the client
    aisStreamWebsocketClient.stopClient();

    // Wait for disconnection to be processed
    waitSeconds(1);

    // Verify client is disconnected
    assertFalse(aisStreamWebsocketClient.isConnected());
  }

  private boolean isClientConnected() {
    try {
      return server.waitForClientConnected(2, TimeUnit.SECONDS);
    } catch (InterruptedException e) {
      fail("Server still does not have a connected client");
    }
    return false;
  }

  private void sendWebSocketMessage(String message) {
    if (server != null) {
      try {
        if (!server.waitForClientConnected(2, TimeUnit.SECONDS)) {
          fail("Server still does not have a connected client");
        }
        server.sendToWebSocket(message);
        System.out.println("Sent message to WebSocket client: " + message);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        fail("Interrupted while waiting for server connection");
      }
    } else {
      fail("WebSocket server is not initialized");
    }
  }

  private void waitSeconds(int seconds) throws InterruptedException {
    CountDownLatch latch = new CountDownLatch(1);
    latch.await(seconds, TimeUnit.SECONDS);
  }
}


