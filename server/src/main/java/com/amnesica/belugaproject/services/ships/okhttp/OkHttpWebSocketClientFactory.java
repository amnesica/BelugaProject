package com.amnesica.belugaproject.services.ships.okhttp;

import com.amnesica.belugaproject.services.ships.WebSocketClient;
import com.amnesica.belugaproject.services.ships.WebSocketClientFactory;
import com.amnesica.belugaproject.services.ships.WebSocketListener;
import org.springframework.stereotype.Component;

@Component
public class OkHttpWebSocketClientFactory implements WebSocketClientFactory {

  @Override
  public WebSocketClient create(String serverUri, WebSocketListener listener) {
    return new OkHttpWebSocketClient(serverUri, listener);
  }
}
