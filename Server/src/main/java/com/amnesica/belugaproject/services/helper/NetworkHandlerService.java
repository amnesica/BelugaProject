package com.amnesica.belugaproject.services.helper;

import lombok.extern.slf4j.Slf4j;
import okhttp3.Credentials;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;

/**
 * Helfer-Klasse für Netzwerk-Verbindungen
 */
@Slf4j
@Service
public class NetworkHandlerService {

    // Networkhandler (Standard-Timeout)
    private final OkHttpClient client = new OkHttpClient();

    // Networkhandler (geringes Connect-Timeout für lokale Feeder,
    // damit reentered-Aircraft-Zustand nicht falsch gesetzt wird,
    // da Timeout zu groß ist)
    private final OkHttpClient clientLocalFeeder = new OkHttpClient.Builder()
            .connectTimeout(1000, TimeUnit.MILLISECONDS)
            .build();

    private final String userAgentBelugaProject = "The Beluga Project";

    /**
     * Macht einen Get-Call zu einer Url und gibt die Antwort als String zurück
     *
     * @param url String
     * @return String
     */
    public String makeServiceCall(String url) {
        try {
            Request request = new Request.Builder()
                    .url(url)
                    .header("User-Agent", userAgentBelugaProject)
                    .build();

            try (Response response = client.newCall(request).execute()) {
                return response.body().string();
            }
        } catch (Exception e) {
            log.error("Server - Error when retrieving information from url " + url + ": Exception = " + e);
        }

        return null;
    }

    /**
     * Macht einen Get-Call zum Opensky-Network mit den Credentials aus
     * application.properties und gibt die Antwort als String zurück
     *
     * @param url      String
     * @param username Opensky-Network username as String
     * @param password Opensky-Network password as char[]
     * @return String
     */
    public String makeOpenskyServiceCall(String url, String username, char[] password) {
        try {
            // Breche ab, wenn url, username oder password invalide sind
            if (url == null || url.isBlank()) throw new Exception("Invalid url. Request aborted.");
            if ((username == null || username.isBlank()) || (password == null))
                throw new Exception("Invalid opensky-network credentials. Request aborted.");

            // Baue kodierten String aus Credentials
            String credential = Credentials.basic(username, String.valueOf(password), StandardCharsets.UTF_8);

            Request request = new Request.Builder()
                    .url(url)
                    .method("GET", null)
                    .header("User-Agent", userAgentBelugaProject)
                    .addHeader("Authorization", credential)
                    .build();
            try (Response response = client.newCall(request).execute()) {
                return response.body().string();
            }
        } catch (Exception e) {
            log.error("Server - Error when retrieving information from url " + url + ": Exception = " + e);
        }
        return null;
    }

    /**
     * Macht einen Get-Call zu einer Url und gibt die Antwort als String zurück.
     * Benutzt wird dabei der OkHttpClient mit reduziertem Connect-Timeout für
     * lokale Feeder, damit reentered-Aircraft-Zustand nicht falsch gesetzt wird,
     * da Timeout zu groß ist
     *
     * @param url String
     * @return String
     */
    public String makeServiceCallLocalFeeder(String url) {
        try {
            Request request = new Request.Builder()
                    .url(url)
                    .header("User-Agent", userAgentBelugaProject)
                    .build();

            try (Response response = clientLocalFeeder.newCall(request).execute()) {
                return response.body().string();
            }
        } catch (Exception e) {
            log.error("Server - Error when retrieving information from url " + url + ": Exception = " + e);
        }

        return null;
    }
}