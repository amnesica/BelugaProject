package com.amnesica.belugaproject.services.unittests;

import com.amnesica.belugaproject.entities.ships.Ship;
import com.amnesica.belugaproject.services.ships.AisStreamWebsocketClient;
import com.amnesica.belugaproject.services.ships.WebSocketClient;
import com.amnesica.belugaproject.services.ships.WebSocketClientFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AisStreamWebsocketClientTest {

  @Mock
  private WebSocketClientFactory webSocketClientFactory;

  @Mock
  private WebSocketClient webSocketClient;

  private AisStreamWebsocketClient aisStreamWebsocketClient;
  private final ConcurrentHashMap<Integer, Ship> initialShips = new ConcurrentHashMap<>();

  private final String TEST_API_KEY = "test-api-key";
  private final String TEST_SERVER_URI = "wss://test.websocket.server";

  @BeforeEach
  void setUp() {
    when(webSocketClientFactory.create(anyString(), any())).thenReturn(webSocketClient);
    aisStreamWebsocketClient = new AisStreamWebsocketClient(
        webSocketClientFactory,
        TEST_SERVER_URI,
        TEST_API_KEY,
        50.0,
        10.0,
        51.0,
        11.0,
        initialShips
    );
  }

  @Test
  void createSubscriptionMessageTest() {
    // Create expected JSON message
    final String expectedMessage = "{\"APIkey\":\"" + TEST_API_KEY + "\",\"BoundingBoxes\":[[[50.0, 10.0],[51.0, 11.0]]], \"FilterMessageTypes\": [\"PositionReport\", \"ShipStaticData\"]}";

    // Setup bounding box
    aisStreamWebsocketClient.updateBoundingBox(50.0, 10.0, 51.0, 11.0);

    // Verify subscription message
    ArgumentCaptor<String> messageCaptor = ArgumentCaptor.forClass(String.class);
    verify(webSocketClient, times(1)).sendMessage(messageCaptor.capture());

    String sentMessage = messageCaptor.getValue();
    assertEquals(expectedMessage, sentMessage);
  }

  @Test
  void updateBoundingBoxDoesNotSendIfRateLimitedTest() {
    // Simulate first bounding box update
    aisStreamWebsocketClient.updateBoundingBox(50.0, 10.0, 51.0, 11.0);

    // Simulate rate limiting
    aisStreamWebsocketClient.updateBoundingBox(52.0, 12.0, 53.0, 13.0);

    // Verify only one message was sent due to rate limit
    verify(webSocketClient, times(1)).sendMessage(any());
  }

  @Test
  void updateBoundingBoxTriggersMessageIfNotRateLimitedTest() throws InterruptedException {
    // Simulate first bounding box update
    aisStreamWebsocketClient.updateBoundingBox(50.0, 10.0, 51.0, 11.0);

    // Simulate sleep longer than rate limit
    Thread.sleep(1100);

    // Simulate second bounding box update
    aisStreamWebsocketClient.updateBoundingBox(52.0, 12.0, 53.0, 13.0);

    // Verify two messages were sent
    verify(webSocketClient, times(2)).sendMessage(any());
  }

  @Test
  void boundingBoxHasMovedTest() {
    assertTrue(aisStreamWebsocketClient.boundingBoxHasMoved(52.0, 12.0, 53.0, 13.0));
    assertFalse(aisStreamWebsocketClient.boundingBoxHasMoved(50.0, 10.0, 51.0, 11.0));
  }

  @Test
  void setPhotoUrlSetsPhotoForExistingShipTest() {
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
  void setPhotoUrlIgnoresNonExistentShipTest() {
    // Set photo URL for a ship that doesn't exist
    aisStreamWebsocketClient.setPhotoUrl(99999, "https://example.com/photo.jpg");

    // Verify no exception and nothing was set
    assertNull(initialShips.get(99999));
  }

  @Test
  void clearAisShipsTest() {
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
  void stopClientClosesWebSocketTest() {
    // Stop the client
    aisStreamWebsocketClient.stopClient();

    // Verify WebSocketClient close method was called
    verify(webSocketClient, times(1)).close("Client closing connection");
  }
}

