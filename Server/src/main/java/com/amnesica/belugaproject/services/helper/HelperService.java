package com.amnesica.belugaproject.services.helper;

import org.springframework.stereotype.Service;

import java.text.DecimalFormat;

@Service
public class HelperService {

    /**
     * Konvertiert einen Flaggen-Code aus UTF8 in HTML-verarbeitbaren String, damit
     * dieser richtig angezeigt wird
     *
     * @param flagCode UTF8
     * @return String
     */
    public static String convertFlagCodeToHTML(String flagCode) {
        flagCode = flagCode.replaceAll(" ", ";");
        flagCode = flagCode.replaceAll("U\\+", "&#x");
        return flagCode;
    }

    /**
     * Haversine-Formel um die great-circle distance zwischen zwei Punkten zu
     * berechnen Source: http://www.movable-type.co.uk/scripts/latlong.html
     *
     * @param lat1 latitude of point 1
     * @param lon1 longitude of point 1
     * @param lat2 latitude of point 2
     * @param lon2 longitude of point 2
     * @return distance
     */
    public static double getDistanceBetweenPositions(double lat1, double lon1, double lat2, double lon2) {
        final double EarthRadius = 6378137.0; // meters
        final double var_1 = (lat1 * Math.PI) / 180.0; // lat1 in radians
        final double var_2 = (lat2 * Math.PI) / 180.0; // lat2 in radians
        final double delta_lat = ((lat2 - lat1) * Math.PI) / 180.0; // delta in radians
        final double delta_lon = ((lon2 - lon1) * Math.PI) / 180.0; // delta in radians

        final double a = Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2)
                + Math.cos(var_1) * Math.cos(var_2) * Math.sin(delta_lon / 2) * Math.sin(delta_lon / 2);
        final double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        double d = (EarthRadius * c) / 1000; // distance

        DecimalFormat df = new DecimalFormat("#####.0");

        double distanceInKm = Double.parseDouble(df.format(d).replace(",", "."));

        return distanceInKm;
    }

    /**
     * Berechnet den angle zwischen zwei Punkten
     * Sources: Haversine Formula – Calculate geographic distance on earth
     * https://www.igismap.com/formula-to-find-bearing-or-heading-angle-between-two-points-latitude-longitude/ earth/ or
     * http://www.movable-type.co.uk/scripts/latlong.html
     *
     * @param lat1 Latitude of Point 1
     * @param lon1 Longitude of Point 1
     * @param lat2 Latitude of Point 2
     * @param lon2 Longitude of Point 2
     * @return angle in degrees
     */
    public static double getAngleBetweenPositions(double lat1, double lon1, double lat2, double lon2) {
        // convert Lat to radians
        final double lat1r = (lat1 * Math.PI) / 180.0; // lat1 in radians
        final double lat2r = (lat2 * Math.PI) / 180.0; // lat2 in radians
        final double delta_lon = ((lon2 - lon1) * Math.PI) / 180.0; // delta in radians

        // X = cos Lat2 * sin (Lon2 - Lon1)
        double x = Math.cos(lat2r) * Math.sin(delta_lon);

        // Y = cos Lat1 * sin Lat2 – sin Lat1 * cos Lat2 * cos (Lon2 - Lon1)
        double y = Math.cos(lat1r) * Math.sin(lat2r) - Math.sin(lat1r) * Math.cos(lat2r) * Math.cos(delta_lon);

        // Beta = atan2(X,Y)
        double br = Math.atan2(x, y); // Beta is in radians
        double b = br * 180 / Math.PI; // convert to deg
        if (b < 0) {
            b = b + 360;
        }
        DecimalFormat df = new DecimalFormat("#####.0");
        double angle = Double.parseDouble(df.format(b).replace(",", "."));

        return angle;
    }

    public static double convertKilometer2Nmile(double km) {
        double nm = km / 1.852;

        DecimalFormat df = new DecimalFormat("######.0");
        double nmiles = Double.parseDouble(df.format(nm).replace(",", "."));
        return nmiles;
    }

    public static double convertMeter2Foot(double m) {
        double ft = m / 0.3048;

        DecimalFormat df = new DecimalFormat("######.0");
        double foot = Double.parseDouble(df.format(ft).replace(",", "."));
        return foot;
    }

    public static double convertMeterPerSec2KilometersPerHour(double meterPerSec) {
        double kmph = (meterPerSec * 3600) / 1000;

        DecimalFormat df = new DecimalFormat("######");
        double kilometersPerHour = Double.parseDouble(df.format(kmph).replace(",", "."));
        return kilometersPerHour;
    }

    public static double convertMeterPerSec2FootPerMin(double meterPerSec) {
        double fpm = (meterPerSec * 3.281) * 60;

        DecimalFormat df = new DecimalFormat("######");
        double footPerMin = Double.parseDouble(df.format(fpm).replace(",", "."));
        return footPerMin;
    }
}
