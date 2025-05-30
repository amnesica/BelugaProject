package com.amnesica.belugaproject.services.network;

import lombok.extern.slf4j.Slf4j;
import okhttp3.Credentials;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

/**
 * Helper class for network connections
 */
@Slf4j
@Service
public class NetworkHandlerService {

  private static final int DEFAULT_TIMEOUT_MS = 30000;
  private static final String USER_AGENT = "The Beluga Project";
  private static final String NONE_URL = "none";

  private final OkHttpClient client = new OkHttpClient.Builder()
      .connectTimeout(DEFAULT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
      .readTimeout(DEFAULT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
      .writeTimeout(DEFAULT_TIMEOUT_MS, TimeUnit.MILLISECONDS)
      .build();

  /**
   * Makes a GET request to a URL and returns the response as a string
   *
   * @param url URL to make the request to
   * @return Response body as string, or null if the request failed
   */
  public String makeServiceCall(String url) {
    try {
      Request request = createDefaultRequest(url);
      return executeRequest(request);
    } catch (Exception e) {
      logRequestError(url, e);
      return null;
    }
  }

  /**
   * Makes a GET request to the Opensky Network API with credentials
   *
   * @param url      URL to make the request to
   * @param username Opensky Network username
   * @param password Opensky Network password
   * @return Response body as string, or null if the request failed
   */
  public String makeOpenskyServiceCall(String url, String username, char[] password) {
    try {
      validateOpenskyParameters(url, username, password);

      String credential = Credentials.basic(username, String.valueOf(password), StandardCharsets.UTF_8);
      Request request = createAuthenticatedRequest(url, credential);

      return executeRequest(request);
    } catch (Exception e) {
      logRequestError(url, e);
      return null;
    }
  }

  /**
   * Makes a GET request to a URL for local aircraft feeders
   *
   * @param url URL to make the request to
   * @return Response body as string, or null if the request failed
   */
  public String makeServiceCallLocalFeeder(String url) {
    if (url.equalsIgnoreCase(NONE_URL)) {
      return null;
    }

    try {
      Request request = createDefaultRequest(url);
      return executeRequest(request);
    } catch (Exception e) {
      logRequestError(url, e);
      return null;
    }
  }

  /**
   * Creates a default GET request with the User-Agent header
   *
   * @param url URL to make the request to
   * @return Configured Request object
   */
  private Request createDefaultRequest(String url) {
    return new Request.Builder()
        .url(url)
        .header("User-Agent", USER_AGENT)
        .build();
  }

  /**
   * Creates a GET request with authentication header and User-Agent
   *
   * @param url        URL to make the request to
   * @param credential Authentication credential string
   * @return Configured Request object
   */
  private Request createAuthenticatedRequest(String url, String credential) {
    return new Request.Builder()
        .url(url)
        .method("GET", null)
        .header("User-Agent", USER_AGENT)
        .addHeader("Authorization", credential)
        .build();
  }

  /**
   * Executes a request and returns the response body as a string
   *
   * @param request Request to execute
   * @return Response body as string
   * @throws Exception If the request execution fails
   */
  private String executeRequest(Request request) throws Exception {
    CallbackFuture future = new CallbackFuture();
    client.newCall(request).enqueue(future);
    Response response = future.get();

    try {
      checkResponseWasSuccessful(response);
      return response.body().string();
    } finally {
      // Ensure we always close the response to prevent resource leaks
      if (response.body() != null) {
        response.close();
      }
    }
  }

  /**
   * Validates parameters for Opensky Network API calls
   *
   * @param url      URL to check
   * @param username Username to check
   * @param password Password to check
   */
  private void validateOpenskyParameters(String url, String username, char[] password) {
    if (url == null || url.isBlank()) {
      throw new IllegalArgumentException("Invalid URL. Request aborted.");
    }
    if (username == null || username.isBlank() || password == null) {
      throw new IllegalArgumentException("Invalid Opensky Network credentials. Request aborted.");
    }
  }

  /**
   * Checks if a response has a successful status code (2xx)
   *
   * @param response Response to check
   * @throws IOException If the response has an error status code
   */
  private void checkResponseWasSuccessful(Response response) throws IOException {
    if (!response.isSuccessful()) {
      int code = response.code();
      String message = response.message();

      if (code >= 400 && code < 500) {
        throw new IOException("Client error: " + code + " " + message);
      } else if (code >= 500) {
        throw new IOException("Server error: " + code + " " + message);
      } else {
        throw new IOException("Unexpected error: " + code + " " + message);
      }
    }
  }

  /**
   * Logs an error that occurred during a request
   *
   * @param url URL that was being requested
   * @param e   Exception that occurred
   */
  private void logRequestError(String url, Exception e) {
    log.error("Server - Error when retrieving information from URL {}: Exception = {}", url, e.getMessage(), e);
  }
}
