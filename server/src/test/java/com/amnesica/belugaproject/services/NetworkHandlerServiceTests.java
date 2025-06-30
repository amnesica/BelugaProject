package com.amnesica.belugaproject.services;

import com.amnesica.belugaproject.services.network.NetworkHandlerService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;
import software.xdev.mockserver.client.MockServerClient;
import software.xdev.mockserver.model.Delay;
import software.xdev.mockserver.model.MediaType;
import software.xdev.mockserver.netty.MockServer;
import software.xdev.mockserver.verify.VerificationTimes;

import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static software.xdev.mockserver.model.HttpRequest.request;
import static software.xdev.mockserver.model.HttpResponse.response;

@ActiveProfiles("test")
@ExtendWith(MockitoExtension.class)
public class NetworkHandlerServiceTests {

  private static final int PORT = 1080;
  private static final String BASE_URL = "http://localhost:" + PORT;
  private static MockServer mockServer;
  private static MockServerClient mockServerClient;

  @InjectMocks
  private NetworkHandlerService networkHandlerService;

  @BeforeAll
  public static void startServer() {
    mockServer = new MockServer(1080);
    mockServerClient = new MockServerClient("localhost", PORT);
  }

  @AfterAll
  public static void stopMockServer() {
    mockServer.stop();
  }

  @BeforeEach
  public void resetServer() {
    mockServerClient.reset();
  }

  @Test
  public void testMakeServiceCall_Success() {
    // Setup
    String jsonResponse = "{\"message\": \"success\", \"data\": [1, 2, 3]}";
    mockServerClient.when(request().withMethod("GET").withPath("/api/data").withHeader("User-Agent", "The Beluga Project")).respond(response().withStatusCode(200).withContentType(MediaType.APPLICATION_JSON).withBody(jsonResponse));

    // Execute
    String result = networkHandlerService.makeServiceCall(BASE_URL + "/api/data");

    // Verify
    assertEquals(jsonResponse, result);
    mockServerClient.verify(request().withMethod("GET").withPath("/api/data").withHeader("User-Agent", "The Beluga Project"));
  }

  @Test
  public void testMakeServiceCall_ServerError() {
    // Setup
    mockServerClient.when(request().withMethod("GET").withPath("/api/error")).respond(response().withStatusCode(500));

    // Execute
    String result = networkHandlerService.makeServiceCall(BASE_URL + "/api/error");

    // Verify
    assertNull(result);
  }

  @Test
  public void testMakeOpenskyServiceCall_Success() {
    // Setup
    String jsonResponse = "{\"time\": 1622827310, \"states\": [[\"a1b2c3\", \"ABC123\", \"Germany\", 1622827310, 1622827310, 10.123, 50.456, 10000, false, 250.5, 90.0, 0.0, null, 10500, \"1000\", false, 0]]}";
    String username = "testUser";
    char[] password = "testPassword".toCharArray();

    mockServerClient.when(request().withMethod("GET").withPath("/api/states/all").withHeader("User-Agent", "The Beluga Project").withHeader("Authorization", "Basic dGVzdFVzZXI6dGVzdFBhc3N3b3Jk") // base64 encoded testUser:testPassword
    ).respond(response().withStatusCode(200).withContentType(MediaType.APPLICATION_JSON).withBody(jsonResponse));

    // Execute
    String result = networkHandlerService.makeOpenskyServiceCall(BASE_URL + "/api/states/all", username, password);

    // Verify
    assertEquals(jsonResponse, result);
    mockServerClient.verify(request().withMethod("GET").withPath("/api/states/all").withHeader("User-Agent", "The Beluga Project").withHeader("Authorization", "Basic dGVzdFVzZXI6dGVzdFBhc3N3b3Jk"));
  }

  @Test
  public void testMakeOpenskyServiceCall_InvalidCredentials() {
    // Test with null username
    String result1 = networkHandlerService.makeOpenskyServiceCall(BASE_URL + "/api/states/all", null, "password".toCharArray());
    assertNull(result1);

    // Test with empty username
    String result2 = networkHandlerService.makeOpenskyServiceCall(BASE_URL + "/api/states/all", "", "password".toCharArray());
    assertNull(result2);

    // Test with null password
    String result3 = networkHandlerService.makeOpenskyServiceCall(BASE_URL + "/api/states/all", "username", null);
    assertNull(result3);
  }

  @Test
  public void testMakeServiceCallLocalFeeder_Success() {
    // Setup
    String jsonResponse = "{\n" + "  \"now\": 1730026214.001,\n" + "  \"messages\": 194539149,\n" + "  \"aircraft\": [\n" + "    {\n" + "      \"hex\": \"3d4920\",\n" + "      \"flight\": \"DEZYE   \",\n" + "      \"alt_baro\": 1300,\n" + "      \"gs\": 148.7,\n" + "      \"track\": 169.1,\n" + "      \"lat\": 53.546898,\n" + "      \"lon\": 10.004021\n" + "    }\n" + "  ]\n" + "}";
    mockServerClient.when(request().withMethod("GET").withPath("/api/aircraft").withHeader("User-Agent", "The Beluga Project")).respond(response().withStatusCode(200).withContentType(MediaType.APPLICATION_JSON).withBody(jsonResponse));

    // Execute
    String result = networkHandlerService.makeServiceCallLocalFeeder(BASE_URL + "/api/aircraft");

    // Verify
    assertEquals(jsonResponse, result);
    mockServerClient.verify(request().withMethod("GET").withPath("/api/aircraft").withHeader("User-Agent", "The Beluga Project"));
  }

  @Test
  public void testMakeServiceCallLocalFeeder_WithNoneUrl() {
    // Execute test with "none" URL
    String result = networkHandlerService.makeServiceCallLocalFeeder("none");

    // Verify
    assertNull(result);

    // Verify no request was made
    mockServerClient.verifyZeroInteractions();
  }

  @Test
  public void testMakeServiceCallLocalFeeder_ConnectionTimeout() {
    // Setup mock to delay response beyond timeout
    mockServerClient.when(request().withMethod("GET").withPath("/api/timeout")).respond(response().withStatusCode(200).withDelay(new Delay(TimeUnit.SECONDS, 35L)) // Delay longer than the 30s timeout
        .withBody("{\"message\": \"This response will timeout\"}"));

    // Execute
    String result = networkHandlerService.makeServiceCallLocalFeeder(BASE_URL + "/api/timeout");

    // Verify
    assertNull(result);
  }

  @Test
  public void testMakeServiceCall_WithComplexJsonResponse() {
    // Setup mock response with a more complex JSON
    String jsonResponse = "{\n" + "  \"now\": 1730026214.001,\n" + "  \"messages\": 194539149,\n" + "  \"aircraft\": [\n" + "    {\n" + "      \"hex\": \"3d4920\",\n" + "      \"flight\": \"DEZYE   \",\n" + "      \"alt_baro\": 1300,\n" + "      \"gs\": 148.7,\n" + "      \"track\": 169.1,\n" + "      \"baro_rate\": -1408,\n" + "      \"category\": \"A1\",\n" + "      \"lat\": 53.546898,\n" + "      \"lon\": 10.004021,\n" + "      \"nic\": 0,\n" + "      \"rc\": 0,\n" + "      \"seen_pos\": 15.3,\n" + "      \"version\": 0,\n" + "      \"nac_p\": 0,\n" + "      \"nac_v\": 0,\n" + "      \"sil\": 0,\n" + "      \"sil_type\": \"unknown\",\n" + "      \"mlat\": [\n" + "        \"gs\",\n" + "        \"track\",\n" + "        \"baro_rate\",\n" + "        \"lat\",\n" + "        \"lon\",\n" + "        \"nic\",\n" + "        \"rc\",\n" + "        \"nac_p\",\n" + "        \"nac_v\",\n" + "        \"sil\",\n" + "        \"sil_type\"\n" + "      ],\n" + "      \"tisb\": [],\n" + "      \"messages\": 3277,\n" + "      \"seen\": 9.4,\n" + "      \"rssi\": -16.1\n" + "    }\n" + "  ]\n" + "}";
    mockServerClient.when(request().withMethod("GET").withPath("/api/complex")).respond(response().withStatusCode(200).withContentType(MediaType.APPLICATION_JSON).withBody(jsonResponse));

    // Execute
    String result = networkHandlerService.makeServiceCall(BASE_URL + "/api/complex");

    // Verify
    assertEquals(jsonResponse, result);
  }

  @Test
  public void testMakeOpenskyTokenCall_Successful() {
    // Setup mock response
    String jsonResponse = "{\"access_token\": \"mock_access_token\"}";
    mockServerClient.when(request().withMethod("POST").withPath("/auth/realms/opensky-network/protocol/openid-connect/token").withHeader("Content-Type", "application/x-www-form-urlencoded").withBody("grant_type=client_credentials&client_id=mock_client_id&client_secret=mock_secret")).respond(response().withStatusCode(200).withContentType(MediaType.APPLICATION_JSON).withBody(jsonResponse));

    // Execute
    String url = "http://localhost:1080/auth/realms/opensky-network/protocol/openid-connect/token";
    String clientId = "mock_client_id";
    char[] clientSecret = "mock_secret".toCharArray();
    String result = networkHandlerService.makeOpenskyTokenCall(url, clientId, clientSecret);

    // Assert
    assertNotNull(result);
    assertEquals(jsonResponse, result);

    // Verify
    mockServerClient.verify(request().withMethod("POST").withPath("/auth/realms/opensky-network/protocol/openid-connect/token"), VerificationTimes.exactly(1));
  }

  @Test
  public void testMakeOpenskyTokenCall_InvalidCredentials() {
    // Setup mock response for invalid credentials
    mockServerClient.when(request().withMethod("POST").withPath("/auth/realms/opensky-network/protocol/openid-connect/token")).respond(response().withStatusCode(401).withBody("{\"error\": \"invalid_client\", \"error_description\": \"Invalid client credentials\"}").withContentType(MediaType.APPLICATION_JSON));

    // Execute the method
    String url = "http://localhost:1080/auth/realms/opensky-network/protocol/openid-connect/token";
    String clientId = "invalid_client_id";
    char[] clientSecret = "invalid_secret".toCharArray();
    String result = networkHandlerService.makeOpenskyTokenCall(url, clientId, clientSecret);

    // Assert
    assertNull(result);

    // Verify
    mockServerClient.verify(request().withMethod("POST").withPath("/auth/realms/opensky-network/protocol/openid-connect/token"), VerificationTimes.exactly(1));
  }

  @Test
  public void testMakeOpenskyTokenCall_ServerError() {
    // Setup mock response for server error
    mockServerClient.when(request().withMethod("POST").withPath("/auth/realms/opensky-network/protocol/openid-connect/token")).respond(response().withStatusCode(500).withBody("Internal Server Error"));

    // Execute the method
    String url = "http://localhost:1080/auth/realms/opensky-network/protocol/openid-connect/token";
    String clientId = "mock_client_id";
    char[] clientSecret = "mock_secret".toCharArray();
    String result = networkHandlerService.makeOpenskyTokenCall(url, clientId, clientSecret);

    // Assert
    assertNull(result);

    // Verify
    mockServerClient.verify(request().withMethod("POST").withPath("/auth/realms/opensky-network/protocol/openid-connect/token"), VerificationTimes.exactly(1));
  }
}


