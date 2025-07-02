package com.amnesica.belugaproject.services.ships;

// Common interface for WebSocket listeners to handle WebSocket events with custom logic
public interface WebSocketListener {
  void onOpen();

  void onMessage(String jsonMessage);

  void onClose(String reason);

  void onError(Throwable t);
}
