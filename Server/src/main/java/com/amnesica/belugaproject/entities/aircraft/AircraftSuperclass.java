package com.amnesica.belugaproject.entities.aircraft;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.vladmihalcea.hibernate.type.array.ListArrayType;
import com.vladmihalcea.hibernate.type.array.StringArrayType;
import com.vladmihalcea.hibernate.type.json.JsonBinaryType;
import lombok.Data;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.TypeDef;
import org.hibernate.annotations.TypeDefs;

import javax.persistence.Column;
import javax.persistence.Id;
import javax.persistence.MappedSuperclass;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@MappedSuperclass
@TypeDefs({@TypeDef(name = "string-array", typeClass = StringArrayType.class),
        @TypeDef(name = "list-array", typeClass = ListArrayType.class),
        @TypeDef(name = "jsonb", typeClass = JsonBinaryType.class)})
public class AircraftSuperclass {
    @Id
    private String hex;
    private Double latitude;
    private Double longitude;
    private Integer altitude;
    private Integer track;
    private String type;
    private String registration;
    private Boolean onGround;
    private Integer speed;
    private String squawk;
    private String flightId;
    private Integer verticalRate;
    private Double rssi;
    private String category;
    private Integer temperature;
    private Integer windSpeed;
    private Integer windFromDirection;
    private String destination;
    private String origin;
    private Double distance;
    private Boolean autopilotEngaged;
    private Integer elipsoidalAltitude;
    private Double selectedQnh;
    private Integer selectedAltitude;
    private Integer selectedHeading;

    // Liste mit Feeder, welches Flugzeug zur Zeit empfangen
    @Type(type = "list-array")
    @Column(name = "feeder_list", columnDefinition = "text[]")
    private List<String> feederList;

    // Zuletzt gesehen
    private Integer lastSeen;

    // Quelle (ADS-B oder MLAT)
    @Type(type = "list-array")
    @Column(name = "source_list", columnDefinition = "text[]")
    private List<String> sourceList;

    // Source in der aktuellen Iteration eines Feeder (temporärer Wert)
    private String sourceCurrentFeeder;

    // Alter des Flugzeugs
    private Integer age;

    // Mehr Flugzeug-Information aus Datenbank-Tabelle AircraftData
    private String fullType; // manufacturerName + model
    private String serialNumber;
    private String lineNumber;
    private String operatorIcao;
    private String testReg;
    private String registered;
    private String regUntil;
    private String status;
    private String built;
    private String firstFlightDate;
    private String icaoAircraftType;
    private String engines;

    // Callsign des Operators
    private String operatorCallsign;

    // Name des Operators
    private String operatorName;

    // Land des Operators
    private String operatorCountry;

    // Flagge des Landes des Operators
    private String operatorCountryFlag;

    // IATA-Code des Operators
    private String operatorIata;

    // Registrierungs-Code "Regions-Bezeichnung"
    private String regCodeName;

    // Flagge des Registrierungs-Code
    private String regCodeNameFlag;

    // Boolean, ob Flugzeug aus der tempStorageAircraftList stammt
    private Boolean reenteredAircraft = false;

    // Zustand des Flugzeugs ("increasing, descending, onGround, flying")
    private String aircraftState;

    // Letztes Update des Flugzeugs von einem Feeder als timestamp
    private Long lastUpdate;

    // Photo-Url
    private String urlPhotoDirect;

    // Url zur Website, wo Photo ist
    private String urlPhotoWebsite;

    // Photograph des Bildes von urlPhotoDirect
    private String photoPhotographer;

    // Boolean, ob Flugzeug von Opensky ist
    private Boolean isFromOpensky = false;

    // Konstruktor
    public AircraftSuperclass(String hex, double latitude, double longitude) {
        this.hex = hex;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public AircraftSuperclass() {
        // Benötiger, leerer Konstruktor
    }

    /**
     * Hinweis: Nur in Copy-Konstrukt verwenden!
     *
     * @param feederList List<String>
     */
    public void setFeederList(List<String> feederList) {
        this.feederList = feederList;
    }

    /**
     * Fügt einen Feeder zur Liste an Feedern hinzu. Wenn feederList null ist, wird
     * eine neue Liste erzeugt
     *
     * @param feeder String
     */
    public void addFeederToFeederList(String feeder) {
        if (feederList == null) {
            feederList = new ArrayList<String>();
        }

        feederList.add(feeder);
    }

    /**
     * Entfernt alle Einträge aus der Liste
     */
    public void clearFeederList() {
        if (feederList != null) {
            feederList.clear();
        }
    }

    /**
     * Fügt ein Source-Element zu der Liste an Sources hinzu oder bearbeitet ein
     * vorhandenes Element, wenn der Feeder bereits in der Liste vorhanden ist
     *
     * @param feeder String
     */
    public void addSourceToSourceList(String feeder) {
        if (sourceList == null) {
            sourceList = new ArrayList<String>();
        }

        if (sourceCurrentFeeder != null && !sourceCurrentFeeder.isEmpty() && feeder != null && !feeder.isEmpty()) {
            String element = feeder + ":" + sourceCurrentFeeder;

            boolean elementExistsBefore = false;
            // Wenn der Feeder bereits ein Element in der Liste hat, bearbeite dies
            for (int i = 0; i < sourceList.size(); i++) {
                if (sourceList.get(i).startsWith(feeder)) {
                    elementExistsBefore = true;
                    sourceList.set(i, element);
                }
            }
            // Wenn der Feeder noch kein Element von dem Feeder hatte, füge es hinzu
            if (!elementExistsBefore) {
                sourceList.add(element);
            }
        }
    }

    /**
     * Entfernt alle Einträge aus der Liste
     */
    public void clearSourceList() {
        if (sourceList != null) {
            sourceList.clear();
        }
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((hex == null) ? 0 : hex.hashCode());
        return result;
    }

    /**
     * Equals-Methode, welche zwei Flugzeuge nur nach dem hex vergleicht
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        AircraftSuperclass other = (AircraftSuperclass) obj;
        if (hex == null) {
            return other.hex == null;
        } else return hex.equalsIgnoreCase(other.hex);
    }
}
