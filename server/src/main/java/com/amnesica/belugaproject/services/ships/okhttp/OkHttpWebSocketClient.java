package com.amnesica.belugaproject.services.ships.okhttp;

import com.amnesica.belugaproject.services.ships.WebSocketClient;
import com.amnesica.belugaproject.services.ships.WebSocketListener;
import lombok.extern.slf4j.Slf4j;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.WebSocket;
import okio.ByteString;
import org.json.JSONException;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

@Slf4j
public class OkHttpWebSocketClient implements WebSocketClient {
  private static WebSocket webSocket;

  public OkHttpWebSocketClient(String serverUri, WebSocketListener listener) {
    OkHttpClient client = new OkHttpClient.Builder()
        .readTimeout(0, TimeUnit.MILLISECONDS)
        .build();
    Request request = new Request.Builder().url(serverUri).build();
    webSocket = client.newWebSocket(request, new OkHttpListenerAdapter(listener));
  }

  @Override
  public void sendMessage(String message) {
    webSocket.send(message);
  }

  @Override
  public void close(String reason) {
    webSocket.close(1000, reason);
  }

  private static class OkHttpListenerAdapter extends okhttp3.WebSocketListener {
    private final WebSocketListener listener;

    OkHttpListenerAdapter(WebSocketListener listener) {
      this.listener = listener;
    }

    @Override
    public void onOpen(WebSocket webSocket, Response response) {
      listener.onOpen();
    }

    @Override
    public void onMessage(WebSocket webSocket, ByteString bytes) {
      try {
        if (bytes == null) return;
        String text = bytes.string(StandardCharsets.UTF_8);
        listener.onMessage(text);
      } catch (JSONException e) {
        log.error("Server - Error on AIS stream onMessage : Exception = {}", String.valueOf(e));
      }
      super.onMessage(webSocket, bytes);
    }

    @Override
    public void onMessage(WebSocket webSocket, String text) {
      listener.onMessage(text);
    }

    @Override
    public void onClosed(WebSocket webSocket, int code, String reason) {
      listener.onClose(reason);
    }

    @Override
    public void onFailure(WebSocket webSocket, Throwable t, Response response) {
      listener.onError(t);
    }
  }
}
