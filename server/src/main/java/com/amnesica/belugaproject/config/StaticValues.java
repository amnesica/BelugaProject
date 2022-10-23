package com.amnesica.belugaproject.config;

/**
 * Konfigurationsdatei, um statische Variablen wie Scheduler-Zeiten zu
 * verwalten. Hinweis: Zeiten sind in Millisekunden außer Retention-Days
 *
 * @author amnesica
 */
public class StaticValues {
    // Lokale Feeder - Scheduler
    public static final int INTERVAL_UPDATE_LOCAL_FEEDER = 2000; // 2 Sekunden
    public static final int INTERVAL_LOCAL_PLANES_TO_HISTORY = 600000; // 10 Minuten
    public static final int INTERVAL_REMOVE_OLD_TRAILS_LOCAL = 600000; // 10 Minuten
    public static final long INTERVAL_REMOVE_OLD_DATA = 2592000000L; // 30 Tage
    public static final String INTERVAL_REMOVE_OLD_TRAILS_FROM_HISTORY = "0 0 2 * * ?"; // cron expression: every day at 02:00 a.m.
    public static final int RETENTION_DAYS_TRAILS_IN_HISTORY = 2; // 2 Tage
    public static final String INTERVAL_REMOVE_OLD_AIRCRAFT_FROM_HISTORY = "0 0 1 * * ?"; // cron expression: every day at 01:00 a.m.
    public static final int RETENTION_DAYS_AIRCRAFT_IN_HISTORY = 30; // 30 Tage

    // Opensky-Network - Scheduler
    public static final int INTERVAL_UPDATE_OPENSKY = 5000; // 5 Sekunden
    public static final int INTERVAL_REMOVE_OLD_PLANES_OPENSKY = 600000; // 10 Minuten

    // ISS - Scheduler
    public static final int INTERVAL_UPDATE_ISS = 2000; // 2 Sekunden
    public static final int INTERVAL_REMOVE_OLD_TRAILS_ISS = 600000; // 10 Minuten
}
