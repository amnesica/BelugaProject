package com.amnesica.belugaproject.entities.aircraft;

import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "history_aircraft")
public class HistoryAircraft extends AircraftSuperclass {

    public HistoryAircraft() {
        // Benötiger, leerer Konstruktor
    }

    public HistoryAircraft(String hex, Double latitude, Double longitude) {
        super(hex, latitude, longitude);
    }

    /**
     * Erstellt eine Kopie des Flugzeugs, welches als Parameter hereingegeben wird
     *
     * @param that Zu kopierendes Flugzeug (Aircraft)
     * @return AircraftSuperclass
     */
    public static HistoryAircraft makeCopy(Aircraft that) {
        HistoryAircraft copy = new HistoryAircraft(that.getHex(), that.getLatitude(), that.getLongitude());
        copy.setAltitude(that.getAltitude());
        copy.setTrack(that.getTrack());
        copy.setType(that.getType());
        copy.setRegistration(that.getRegistration());
        copy.setOnGround(that.getOnGround());
        copy.setSpeed(that.getSpeed());
        copy.setSquawk(that.getSquawk());
        copy.setFlightId(that.getFlightId());
        copy.setVerticalRate(that.getVerticalRate());
        copy.setRssi(that.getRssi());
        copy.setCategory(that.getCategory());
        copy.setTemperature(that.getTemperature());
        copy.setWindSpeed(that.getWindSpeed());
        copy.setWindFromDirection(that.getWindFromDirection());
        copy.setDestination(that.getDestination());
        copy.setOrigin(that.getOrigin());
        copy.setDistance(that.getDistance());
        copy.setAutopilotEngaged(that.getAutopilotEngaged());
        copy.setElipsoidalAltitude(that.getElipsoidalAltitude());
        copy.setSelectedQnh(that.getSelectedQnh());
        copy.setSelectedAltitude(that.getSelectedAltitude());
        copy.setSelectedHeading(that.getSelectedHeading());
        copy.setFeederList(that.getFeederList());
        copy.setLastSeen(that.getLastSeen());
        copy.setSourceList(that.getSourceList());
        copy.setAge(that.getAge());
        copy.setFullType(that.getFullType());
        copy.setSerialNumber(that.getSerialNumber());
        copy.setLineNumber(that.getLineNumber());
        copy.setOperatorIcao(that.getOperatorIcao());
        copy.setTestReg(that.getTestReg());
        copy.setRegistered(that.getRegistered());
        copy.setRegUntil(that.getRegUntil());
        copy.setStatus(that.getStatus());
        copy.setBuilt(that.getBuilt());
        copy.setFirstFlightDate(that.getFirstFlightDate());
        copy.setIcaoAircraftType(that.getIcaoAircraftType());
        copy.setEngines(that.getEngines());
        copy.setOperatorCallsign(that.getOperatorCallsign());
        copy.setOperatorName(that.getOperatorName());
        copy.setOperatorCountry(that.getOperatorCountry());
        copy.setOperatorCountryFlag(that.getOperatorCountryFlag());
        copy.setOperatorIata(that.getOperatorIata());
        copy.setRegCodeName(that.getRegCodeName());
        copy.setRegCodeNameFlag(that.getRegCodeNameFlag());
        copy.setReenteredAircraft(that.getReenteredAircraft());
        copy.setAircraftState(that.getAircraftState());
        copy.setLastUpdate(that.getLastUpdate());
        return copy;
    }
}
