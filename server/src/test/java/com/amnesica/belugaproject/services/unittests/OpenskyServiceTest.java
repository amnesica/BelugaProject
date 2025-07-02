package com.amnesica.belugaproject.services.unittests;

import com.amnesica.belugaproject.config.Configuration;
import com.amnesica.belugaproject.services.aircraft.OpenskyService;
import com.amnesica.belugaproject.services.network.NetworkHandlerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OpenskyServiceTest {

  @Mock
  private Configuration configuration;

  @Mock
  private NetworkHandlerService networkHandler;

  @InjectMocks
  private OpenskyService openskyService;

  private static final String MOCK_CLIENT_ID = "mock_client_id";
  private static final char[] MOCK_CLIENT_SECRET = "mock_client_secret".toCharArray();
  private static final String MOCK_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
  private static final String MOCK_ACCESS_TOKEN_STRING = "{\"access_token\": \"mock_access_token\"}";

  @BeforeEach
  public void setup() {
    // Reset mocks before each test
    reset(configuration, networkHandler);
  }

  @Test
  public void getOpenskyAccessTokenSuccessfulTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);
    when(networkHandler.makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)).thenReturn(MOCK_ACCESS_TOKEN_STRING);

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNotNull(accessToken);
    assertEquals("mock_access_token", accessToken);
    verify(configuration).getOpenskyClientId();
    verify(configuration).getOpenskyClientSecret();
    verify(networkHandler).makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET);
  }

  @Test
  public void getOpenskyAccessTokenNullClientIdTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(null);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNull(accessToken);
    verify(configuration).getOpenskyClientId();
    verify(configuration).getOpenskyClientSecret();
    verify(networkHandler, never()).makeOpenskyTokenCall(anyString(), anyString(), any());
  }

  @Test
  public void getOpenskyAccessTokenEmptyClientSecretTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(new char[]{});

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNull(accessToken);
    verify(configuration).getOpenskyClientId();
    verify(configuration).getOpenskyClientSecret();
    verify(networkHandler, never()).makeOpenskyTokenCall(anyString(), anyString(), any());
  }

  @Test
  public void getOpenskyAccessTokenInvalidJsonResponseTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);
    when(networkHandler.makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)).thenReturn("Invalid JSON");

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNull(accessToken);
    verify(configuration).getOpenskyClientId();
    verify(configuration).getOpenskyClientSecret();
    verify(networkHandler).makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET);
  }

  @Test
  public void networkCallTriggeredWhenLastTokenFetchTimeIsOldTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);
    when(networkHandler.makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)).thenReturn(MOCK_ACCESS_TOKEN_STRING);

    // Simulate last token fetch time more than 1800 seconds in the past
    openskyService.setLastTokenFetchTime(Instant.now().minusSeconds(1801));

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNotNull(accessToken);
    assertEquals("mock_access_token", accessToken);
    verify(networkHandler, times(1)).makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET);
  }

  @Test
  public void networkCallNotTriggeredWhenLastTokenFetchTimeIsRecentTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);

    // Simulate last token fetch time within 1800 seconds
    openskyService.setLastTokenFetchTime(Instant.now().minusSeconds(1700));

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNull(accessToken);
    verify(networkHandler, never()).makeOpenskyTokenCall(anyString(), anyString(), any());
  }

  @Test
  public void networkCallTriggeredWhenLastTokenFetchTimeIsNullTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);
    when(networkHandler.makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)).thenReturn(MOCK_ACCESS_TOKEN_STRING);

    // Simulate null value for lastTokenFetchTime
    openskyService.setLastTokenFetchTime(null);

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNotNull(accessToken);
    assertEquals("mock_access_token", accessToken);
    verify(networkHandler, times(1)).makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET);
  }

  @Test
  public void networkCallHandlesEdgeCaseOfExactly1800SecondsTest() {
    // Setup mocks
    when(configuration.getOpenskyClientId()).thenReturn(MOCK_CLIENT_ID);
    when(configuration.getOpenskyClientSecret()).thenReturn(MOCK_CLIENT_SECRET);
    when(networkHandler.makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)).thenReturn(MOCK_ACCESS_TOKEN_STRING);

    // Simulate last token fetch time exactly 1800 seconds ago
    openskyService.setLastTokenFetchTime(Instant.now().minusSeconds(1800));

    // Execute
    String accessToken = openskyService.getOpenskyAccessToken();

    // Verify
    assertNotNull(accessToken);
    assertEquals("mock_access_token", accessToken);
    verify(networkHandler, times(1)).makeOpenskyTokenCall(MOCK_URL, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET);
  }
}

