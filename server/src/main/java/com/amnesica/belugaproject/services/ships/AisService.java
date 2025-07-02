package com.amnesica.belugaproject.services.ships;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.entities.ships.Ship;
import com.amnesica.belugaproject.services.network.NetworkHandlerService;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class AisService {
  @Autowired
  private Configuration configuration;

  private final String aisStreamIoSocketUrl = "wss://stream.aisstream.io/v0/stream";
  private static final NetworkHandlerService networkHandler = new NetworkHandlerService();

  private final WebSocketClientFactory webSocketClientFactory;
  private AisStreamWebsocketClient client;

  private VesselFinderResponse response;

  public record VesselFinderResponse(String photoUrl) {
  }

  @Getter
  private final ConcurrentHashMap<Integer, Ship> aisShipsLongTermMap = new ConcurrentHashMap<>();
  private final int MAX_SIZE_SHIP_HASHMAP = 10000;

  @Autowired
  public AisService(Configuration configuration,
                    WebSocketClientFactory webSocketClientFactory) {
    this.configuration = configuration;
    this.webSocketClientFactory = webSocketClientFactory;
  }
  
  public Collection<Ship> getAisData(double lamin, double lomin, double lamax, double lomax, boolean enableAis) {
    if (!configuration.aisstreamApiKeyIsValid()) return null;

    if (!enableAis && client != null) {
      client.stopClient();
      aisShipsLongTermMap.putAll(client.getAisShips());
      client = null;
      return null;
    } else if (client != null) {
      // temp. save ships if client crashes
      aisShipsLongTermMap.putAll(client.getAisShips());
    }

    if (!enableAis) return null;

    if (client == null || !client.isConnected) {
      createClient(lamin, lomin, lamax, lomax);
    } else {
      updateClient(lamin, lomin, lamax, lomax);
    }

    return client.getAisShips().values();
  }

  private void createClient(double lamin, double lomin, double lamax, double lomax) {
    if (!configuration.aisstreamApiKeyIsValid()) return;

    try {
      client = new AisStreamWebsocketClient(
          webSocketClientFactory,
          aisStreamIoSocketUrl,
          configuration.getAisstreamApiKey(),
          lamin, lomin, lamax, lomax,
          aisShipsLongTermMap
      );
    } catch (Exception e) {
      log.error("Server - Error when starting websocket client: {}", e.getMessage());
    }
  }

  private void updateClient(double lamin, double lomin, double lamax, double lomax) {
    if (client == null) return;

    if (client.getAisShips().size() > MAX_SIZE_SHIP_HASHMAP) {
      client.clearAisShips();
    }

    // Lösche alte ships (älter als 2h)
    long time2hAgo = System.currentTimeMillis() - 7200000L;
    for (Ship ship : client.getAisShips().values()) {
      if (ship.getTimestamp() < time2hAgo) client.getAisShips().remove(ship.getUserId());
    }

    if (client.boundingBoxHasMoved(lamin, lomin, lamax, lomax)) client.updateBoundingBox(lamin, lomin, lamax, lomax);
  }

  public VesselFinderResponse getPhotoUrlFromVesselFinder(Integer mmsi) {
    if (mmsi == null || mmsi == 0) return null;

    final String query = "https://www.vesselfinder.com/vessels/details/" + mmsi;
    final String htmlContent = networkHandler.makeServiceCall(query);
    if (htmlContent == null || htmlContent.isEmpty()) return null;

    try {
      final String urlPattern = "https://static\\.vesselfinder\\.net/ship-photo/[^\"\\s]*";
      Pattern pattern = Pattern.compile(urlPattern);
      Matcher matcher = pattern.matcher(htmlContent);

      if (matcher.find()) {
        final String photoUrl = matcher.group();
        client.setPhotoUrl(mmsi, photoUrl);
        return new VesselFinderResponse(photoUrl);
      }
      return null;
    } catch (Exception e) {
      log.error("Server - Error consuming photo from www.vesselfinder.com. Query: {}", query);
    }
    return null;
  }
}
