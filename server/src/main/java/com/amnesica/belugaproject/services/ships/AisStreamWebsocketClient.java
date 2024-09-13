package com.amnesica.belugaproject.services.ships;

import com.amnesica.belugaproject.entities.ships.Ship;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.json.JSONException;
import org.json.JSONObject;

import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class AisStreamWebsocketClient extends WebSocketClient {
  private final String apiKey;
  private Double[] box1;
  private Double[] box2;
  private Instant lastSendSubscriptionMessage; // rate limit 1s

  private record BoundingBox(Double minLat, Double minLong, Double maxLat, Double maxLong) {
  }

  private BoundingBox boundingBox;

  @Getter
  private ConcurrentHashMap<Integer, Ship> aisShips = new ConcurrentHashMap<>();

  public AisStreamWebsocketClient(URI serverURI, final String apiKey, Double minLat, Double minLong, Double maxLat, Double maxLong) {
    super(serverURI);
    this.apiKey = apiKey;
    this.box1 = new Double[]{minLat, minLong};
    this.box2 = new Double[]{maxLat, maxLong};
    this.boundingBox = new BoundingBox(minLat, minLong, maxLat, maxLong);
  }

  public void updateBoundingBox(Double minLat, Double minLong, Double maxLat, Double maxLong) {
    this.box1 = new Double[]{minLat, minLong};
    this.box2 = new Double[]{maxLat, maxLong};
    this.boundingBox = new BoundingBox(minLat, minLong, maxLat, maxLong);

    if (sendOfSubscriptionMessageWillTriggerRateLimit()) return;
    sendSubscriptionMessage();
  }

  private boolean sendOfSubscriptionMessageWillTriggerRateLimit() {
    return this.lastSendSubscriptionMessage == null || Duration.between(this.lastSendSubscriptionMessage, Instant.now()).getSeconds() <= 1;
  }

  private void sendSubscriptionMessage() {
    final String subscriptionText = "{\"APIkey\":\"" + this.apiKey + "\",\"BoundingBoxes\":[[" + Arrays.toString(this.box1) + "," + Arrays.toString(this.box2) + "]], \"FilterMessageTypes\": [\"PositionReport\", \"ShipStaticData\"]}";
    try {
      send(subscriptionText);
      this.lastSendSubscriptionMessage = Instant.now();
    } catch (Exception e) {
      log.error("Server - Failed to send subscription message. WebSocket might not be connected", e);
      stopClient();
    }
  }

  @Override
  public void onOpen(ServerHandshake handshake) {
    sendSubscriptionMessage();
  }

  @Override
  public void onMessage(ByteBuffer message) {
    try {
      String jsonString = StandardCharsets.UTF_8.decode(message).toString();
      if (jsonString.isEmpty()) return;
      JSONObject jsonObject = new JSONObject(jsonString);

      if (messageTypeIsPositionReportWithMetadata(jsonObject)) {
        processPositionReportMessage(jsonObject);
      } else if (messageTypeIsShipStaticData(jsonObject)) {
        processShipStaticDataMessage(jsonObject);
      }
    } catch (JSONException e) {
      log.error("Server - Error on AIS stream onMessage : Exception = {}", String.valueOf(e));
    }
  }

  private boolean messageTypeIsShipStaticData(JSONObject jsonObject) {
    return jsonObject != null && jsonObject.getString("MessageType") != null &&
        jsonObject.getString("MessageType").equals("ShipStaticData");
  }

  private boolean messageTypeIsPositionReportWithMetadata(JSONObject jsonObject) {
    return jsonObject != null && jsonObject.getString("MessageType") != null &&
        jsonObject.getString("MessageType").equals("PositionReport") && !jsonObject.isNull("MetaData");
  }

  private void processPositionReportMessage(JSONObject jsonObject) {
    final JSONObject aisMessage = jsonObject.getJSONObject("Message");
    final JSONObject positionReport = aisMessage.getJSONObject("PositionReport");
    final JSONObject metaData = jsonObject.getJSONObject("MetaData");

    final Ship ship = new Ship(positionReport.getDouble("Latitude"),
        positionReport.getDouble("Longitude"),
        positionReport.getInt("UserID"),
        metaData.getString("time_utc"),
        metaData.getInt("MMSI"),
        metaData.getString("ShipName").trim());

    if (aisShips.containsKey(positionReport.getInt("UserID"))) {
      updateShipData(positionReport, metaData);
    } else {
      aisShips.put(ship.getUserId(), ship);
    }
  }

  private void updateShipData(JSONObject positionReport, JSONObject metaData) {
    final Ship ship = aisShips.get(positionReport.getInt("UserID"));
    if (ship == null) return;

    setShipPositionReport(positionReport, ship);
    setShipMetadata(ship, metaData);
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

  private void processShipStaticDataMessage(JSONObject jsonObject) {
    final JSONObject aisMessage = jsonObject.getJSONObject("Message");
    final JSONObject shipStaticData = aisMessage.getJSONObject("ShipStaticData");
    final JSONObject metaData = jsonObject.getJSONObject("MetaData");

    final Ship ship = aisShips.get(shipStaticData.getInt("UserID"));
    if (ship == null) return;

    setShipStaticData(ship, shipStaticData);
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
    ship.setDimension(new Ship.Dimension(dimensionJson.getInt("A"),
        dimensionJson.getInt("B"), dimensionJson.getInt("C"), dimensionJson.getInt("D")));
    ship.setName(shipStaticData.getString("Name").trim());
    ship.setType(shipStaticData.getInt("Type"));
    final JSONObject etaJson = shipStaticData.getJSONObject("Eta");
    ship.setEta(new Ship.ETA(etaJson.getInt("Month"),
        etaJson.getInt("Day"), etaJson.getInt("Hour"), etaJson.getInt("Minute")));
  }

  @Override
  public void onMessage(String message) {
    // unused as aisstream.io returns messages as byte buffers
  }

  @Override
  public void onClose(int code, String reason, boolean remote) {
    log.info("Server - AIS Connection closed by {} Code: {} Reason: {}", remote ? "remote peer" : "us", code, reason);
  }

  @Override
  public void onError(Exception e) {
    log.error("Server - Error on AIS stream websocket : Exception = {}", String.valueOf(e));
  }

  public boolean boundingBoxHasMoved(Double minLatNew, Double minLongNew, Double maxLatNew, Double maxLongNew) {
    if (!Objects.equals(boundingBox.minLat, minLatNew)) return true;
    if (!Objects.equals(boundingBox.minLong, minLongNew)) return true;
    if (!Objects.equals(boundingBox.maxLat, maxLatNew)) return true;
    return !Objects.equals(boundingBox.maxLong, maxLongNew);
  }

  public void setPhotoUrl(Integer mmsi, String url) {
    if (this.aisShips == null || url == null || mmsi == null) return;
    final Ship ship = aisShips.get(mmsi);
    if (ship != null) ship.setPhotoUrl(url);
  }

  public void clearAisShips() {
    this.aisShips.clear();
  }

  public void stopClient() {
    this.aisShips = new ConcurrentHashMap<>();
    this.close();
  }
}
