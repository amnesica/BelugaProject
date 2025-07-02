package com.amnesica.belugaproject.services.ships;

// Defines the common contract for WebSocket operations, which the rest of the application depends on
public interface WebSocketClient {
  void sendMessage(String message); // send messages to different websocket implementations

  void close(String reason); // close websocket
}

