package com.amnesica.belugaproject.services.ships;

// Provides the method to create a WebSocketClient instance,
// abstracting the instantiation and configuration of WebSocket clients
public interface WebSocketClientFactory {
  WebSocketClient create(String serverUri, WebSocketListener listener);
}
