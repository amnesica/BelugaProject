package com.amnesica.belugaproject.services.ships;

import com.amnesica.belugaproject.entities.ships.Ship;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONException;
import org.json.JSONObject;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class AisStreamWebsocketClient {

  @Getter
  private final WebSocketClient webSocketClient;
  private final String apiKey;
  private BoundingBox boundingBox;
  private Instant lastSendSubscriptionMessage; // rate limit 1s
  @Setter
  @Getter
  boolean isConnected = false;

  @Getter
  private final ConcurrentHashMap<Integer, Ship> aisShips = new ConcurrentHashMap<>();

  private record BoundingBox(Double minLat, Double minLong, Double maxLat, Double maxLong) {
  }

  public AisStreamWebsocketClient(WebSocketClientFactory clientFactory, String serverUri, String apiKey, Double minLat, Double minLong, Double maxLat, Double maxLong, ConcurrentHashMap<Integer, Ship> initialAisShips) {
    this.apiKey = apiKey;
    this.boundingBox = new BoundingBox(minLat, minLong, maxLat, maxLong);
    this.aisShips.putAll(initialAisShips);
    this.webSocketClient = clientFactory.create(serverUri, new WebSocketListenerImpl());
  }

  public void updateBoundingBox(Double minLat, Double minLong, Double maxLat, Double maxLong) {
    this.boundingBox = new BoundingBox(minLat, minLong, maxLat, maxLong);
    if (sendOfSubscriptionMessageWillTriggerRateLimit()) return;
    sendSubscriptionMessage();
  }

  public void setPhotoUrl(Integer mmsi, String url) {
    if (url == null || mmsi == null) return;
    final Ship ship = aisShips.get(mmsi);
    if (ship != null) ship.setPhotoUrl(url);
  }

  public void clearAisShips() {
    aisShips.clear();
  }

  public void stopClient() {
    webSocketClient.close("Client closing connection");
  }

  public boolean boundingBoxHasMoved(Double minLatNew, Double minLongNew, Double maxLatNew, Double maxLongNew) {
    return !Objects.equals(boundingBox.minLat, minLatNew) || !Objects.equals(boundingBox.minLong, minLongNew) || !Objects.equals(boundingBox.maxLat, maxLatNew) || !Objects.equals(boundingBox.maxLong, maxLongNew);
  }

  private boolean sendOfSubscriptionMessageWillTriggerRateLimit() {
    return lastSendSubscriptionMessage != null && Duration.between(lastSendSubscriptionMessage, Instant.now()).toMillis() <= 1000;
  }

  private void sendSubscriptionMessage() {
    String subscriptionText = createSubscriptionMessage();
    try {
      webSocketClient.sendMessage(subscriptionText);
      lastSendSubscriptionMessage = Instant.now();
      isConnected = true;
    } catch (Exception e) {
      log.error("Failed to send subscription message. WebSocket might not be connected", e);
      isConnected = false;
      stopClient();
    }
  }

  private String createSubscriptionMessage() {
    return String.format("{\"APIkey\":\"%s\",\"BoundingBoxes\":[[%s,%s]], \"FilterMessageTypes\": [\"PositionReport\", \"ShipStaticData\"]}",
        apiKey,
        Arrays.toString(new Double[]{boundingBox.minLat, boundingBox.minLong}),
        Arrays.toString(new Double[]{boundingBox.maxLat, boundingBox.maxLong}));
  }

  public class WebSocketListenerImpl implements WebSocketListener {
    @Override
    public void onOpen() {
      sendSubscriptionMessage();
    }

    @Override
    public void onMessage(String jsonMessage) {
      handleIncomingMessage(jsonMessage);
    }

    @Override
    public void onClose(String reason) {
      isConnected = false;
    }

    @Override
    public void onError(Throwable t) {
      isConnected = false;
      log.error("WebSocket encountered an error: {}", t.getMessage());
    }

    private void handleIncomingMessage(String jsonMessage) {
      try {
        JSONObject jsonObject = new JSONObject(jsonMessage);
        if (messageTypeIsPositionReportWithMetadata(jsonObject)) {
          processPositionReportMessage(jsonObject);
        } else if (messageTypeIsShipStaticData(jsonObject)) {
          processShipStaticDataMessage(jsonObject);
        }
      } catch (JSONException e) {
        log.error("Error processing incoming WebSocket message: {}", e.getMessage());
      }
    }

    private boolean messageTypeIsShipStaticData(JSONObject jsonObject) {
      return jsonObject.has("MessageType") && "ShipStaticData".equals(jsonObject.getString("MessageType"));
    }

    private boolean messageTypeIsPositionReportWithMetadata(JSONObject jsonObject) {
      return jsonObject.has("MessageType") && "PositionReport".equals(jsonObject.getString("MessageType")) && jsonObject.has("MetaData");
    }

    private void processPositionReportMessage(JSONObject jsonObject) {
      final JSONObject aisMessage = jsonObject.getJSONObject("Message");
      final JSONObject positionReport = aisMessage.getJSONObject("PositionReport");
      final JSONObject metaData = jsonObject.getJSONObject("MetaData");

      final Ship ship = new Ship(positionReport.getDouble("Latitude"), positionReport.getDouble("Longitude"), positionReport.getInt("UserID"), metaData.getString("time_utc"), metaData.getInt("MMSI"), metaData.getString("ShipName").trim(), System.currentTimeMillis());

      if (aisShips.containsKey(positionReport.getInt("UserID"))) {
        updateShipData(positionReport, metaData);
      } else {
        aisShips.put(ship.getUserId(), ship);
      }
    }

    private void processShipStaticDataMessage(JSONObject jsonObject) {
      final JSONObject aisMessage = jsonObject.getJSONObject("Message");
      final JSONObject shipStaticData = aisMessage.getJSONObject("ShipStaticData");
      final JSONObject metaData = jsonObject.getJSONObject("MetaData");

      final Ship ship = aisShips.get(shipStaticData.getInt("UserID"));
      if (ship == null) return;

      setShipStaticData(ship, shipStaticData);
      setShipMetadata(ship, metaData);
    }

    private void updateShipData(JSONObject positionReport, JSONObject metaData) {
      final Ship ship = aisShips.get(positionReport.getInt("UserID"));
      if (ship == null) return;

      ship.setTimestamp(System.currentTimeMillis());
      setShipPositionReport(positionReport, ship);
      setShipMetadata(ship, metaData);
    }

    private static void setShipMetadata(Ship ship, JSONObject metaData) {
      ship.setTimeUTC(metaData.getString("time_utc"));
      ship.setMmsi(metaData.getInt("MMSI"));
      ship.setShipName(metaData.getString("ShipName").trim());
    }

    private void setShipStaticData(Ship ship, JSONObject shipStaticData) {
      ship.setCallSign(shipStaticData.getString("CallSign"));
      ship.setDestination(shipStaticData.getString("Destination").trim());
      ship.setImoNumber(shipStaticData.getInt("ImoNumber"));
      ship.setMaximumStaticDraught(shipStaticData.getDouble("MaximumStaticDraught"));
      final JSONObject dimensionJson = shipStaticData.getJSONObject("Dimension");
      ship.setDimension(new Ship.Dimension(dimensionJson.getInt("A"), dimensionJson.getInt("B"), dimensionJson.getInt("C"), dimensionJson.getInt("D")));
      ship.setName(shipStaticData.getString("Name").trim());
      ship.setType(shipStaticData.getInt("Type"));
      final JSONObject etaJson = shipStaticData.getJSONObject("Eta");
      ship.setEta(new Ship.ETA(etaJson.getInt("Month"), etaJson.getInt("Day"), etaJson.getInt("Hour"), etaJson.getInt("Minute")));
    }

    private static void setShipPositionReport(JSONObject positionReport, Ship ship) {
      ship.setLatitude(positionReport.getDouble("Latitude"));
      ship.setLongitude(positionReport.getDouble("Longitude"));
      ship.setCog(positionReport.getDouble("Cog"));
      ship.setNavigationalStatus(positionReport.getInt("NavigationalStatus"));
      ship.setRateOfTurn(positionReport.getInt("RateOfTurn"));
      ship.setSog(positionReport.getInt("Sog"));
      ship.setTrueHeading(positionReport.getInt("TrueHeading"));
    }
  }
}

