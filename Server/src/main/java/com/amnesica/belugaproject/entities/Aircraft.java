package com.amnesica.belugaproject.entities;

import java.util.ArrayList;
import java.util.List;

public class Aircraft {
	private String hex;
	private double latitude;
	private double longitude;
	private int altitude;

	// Default-Wert bei Track zur
	// Unterscheidung von "0" auf "-1" gesetzt
	private int track = -1;
	private String type;
	private String registration;
	private boolean onGround;
	private int speed;
	private String squawk;
	private String flightId;

	// Default-Wert bei VerticalRate zur
	// Unterscheidung von "0" auf "-9999999" gesetzt
	private int verticalRate = -9999999;
	private double rssi;
	private String category;
	private int temperature;
	private int windSpeed;
	private int windFromDirection;
	private String destination;
	private String origin;
	private double distance;
	private boolean autopilotEngaged;
	private int elipsoidalAltitude;
	private double selectedQnh;
	private double selectedAltitude;
	private double selectedHeading;

	// Herkunft des Aircrafts
	private String feeder;

	// Zuletzt gesehen
	// (Default-Wert zur Unterscheidung von 0 gesetzt)
	private double lastSeen = -1;

	// Quelle (ADS-B oder MLAT)
	private String source;

	// Array mit Positionen des Flugzeugs für die Trail-Abbildung
	private List<double[]> trailPositions;

	// Boolean, ob Flugzeug die ISS ist
	private boolean aircraftIsISS = false;

	// Alter des Flugzeugs
	private int age;

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

	// IATA-Coder des Operators
	private String operatorIata;

	// Registrierungs-Code "Regions-Bezeichnung"
	private String regCodeName;

	// Flagge des Registrierungs-Code
	private String regCodeNameFlag;

	// Counter, wielange Flugzeug in temporärer Liste
	// zum Merken des Trails gehalten wird
	private int counter = 0;

	// Boolean, ob Flugzeug aus der tempStorageAircraftList stammt
	private Boolean reenteredAircraft = false;

	// Zustand des Flugzeugs ("increasing, descending, onGround, flying")
	private String aircraftState;

	// Konstruktor
	public Aircraft(String hex, double latitude, double longitude) {
		this.hex = hex;
		this.latitude = latitude;
		this.longitude = longitude;
	}

	public String getHex() {
		return hex;
	}

	public void setHex(String hex) {
		this.hex = hex;
	}

	public double getLatitude() {
		return latitude;
	}

	public void setLatitude(double latitude) {
		this.latitude = latitude;
	}

	public double getLongitude() {
		return longitude;
	}

	public void setLongitude(double longitude) {
		this.longitude = longitude;
	}

	public int getAltitude() {
		return altitude;
	}

	public void setAltitude(int altitude) {
		this.altitude = altitude;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getRegistration() {
		return registration;
	}

	public void setRegistration(String registration) {
		this.registration = registration;
	}

	public int getTrack() {
		return track;
	}

	public void setTrack(int track) {
		this.track = track;
	}

	public String getFeeder() {
		return feeder;
	}

	public void setFeeder(String feeder) {
		this.feeder = feeder;
	}

	public double getLastSeen() {
		return lastSeen;
	}

	public void setLastSeen(double lastSeen) {
		this.lastSeen = lastSeen;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public boolean isOnGround() {
		return onGround;
	}

	public void setOnGround(boolean onGround) {
		this.onGround = onGround;
	}

	public int getSpeed() {
		return speed;
	}

	public void setSpeed(int speed) {
		this.speed = speed;
	}

	public String getSource() {
		return source;
	}

	public void setSource(String source) {
		this.source = source;
	}

	public String getSquawk() {
		return squawk;
	}

	public void setSquawk(String squawk) {
		this.squawk = squawk;
	}

	public String getFlightId() {
		return flightId;
	}

	public void setFlightId(String flightId) {
		this.flightId = flightId;
	}

	public int getVerticalRate() {
		return verticalRate;
	}

	public void setVerticalRate(int verticalRate) {
		this.verticalRate = verticalRate;
	}

	public double getRssi() {
		return rssi;
	}

	public void setRssi(double rssi) {
		this.rssi = rssi;
	}

	public int getTemperature() {
		return temperature;
	}

	public void setTemperature(int temperature) {
		this.temperature = temperature;
	}

	public int getWindSpeed() {
		return windSpeed;
	}

	public void setWindSpeed(int windSpeed) {
		this.windSpeed = windSpeed;
	}

	public int getWindFromDirection() {
		return windFromDirection;
	}

	public void setWindFromDirection(int windFromDirection) {
		this.windFromDirection = windFromDirection;
	}

	public String getDestination() {
		return destination;
	}

	public void setDestination(String destination) {
		this.destination = destination;
	}

	public double getDistance() {
		return distance;
	}

	public void setDistance(double distance) {
		this.distance = distance;
	}

	public boolean isAutopilotEngaged() {
		return autopilotEngaged;
	}

	public void setAutopilotEngaged(boolean autopilotEngaged) {
		this.autopilotEngaged = autopilotEngaged;
	}

	public int getElipsoidalAltitude() {
		return elipsoidalAltitude;
	}

	public void setElipsoidalAltitude(int elipsoidalAltitude) {
		this.elipsoidalAltitude = elipsoidalAltitude;
	}

	public double getSelectedQnh() {
		return selectedQnh;
	}

	public void setSelectedQnh(double selectedQnh) {
		this.selectedQnh = selectedQnh;
	}

	public double getSelectedAltitude() {
		return selectedAltitude;
	}

	public void setSelectedAltitude(double selectedAltitude) {
		this.selectedAltitude = selectedAltitude;
	}

	public double getSelectedHeading() {
		return selectedHeading;
	}

	public void setSelectedHeading(double selectedHeading) {
		this.selectedHeading = selectedHeading;
	}

	public String getOperatorCallsign() {
		return operatorCallsign;
	}

	public void setOperatorCallsign(String operatorCallsign) {
		this.operatorCallsign = operatorCallsign;
	}

	public String getOperatorName() {
		return operatorName;
	}

	public void setOperatorName(String operatorName) {
		this.operatorName = operatorName;
	}

	public String getOperatorCountry() {
		return operatorCountry;
	}

	public void setOperatorCountry(String operatorCountry) {
		this.operatorCountry = operatorCountry;
	}

	public String getOperatorCountryFlag() {
		return operatorCountryFlag;
	}

	public void setOperatorCountryFlag(String operatorCountryFlag) {
		this.operatorCountryFlag = operatorCountryFlag;
	}

	public String getRegCodeName() {
		return regCodeName;
	}

	public void setRegCodeName(String regCodeName) {
		this.regCodeName = regCodeName;
	}

	public String getRegCodeNameFlag() {
		return regCodeNameFlag;
	}

	public void setRegCodeNameFlag(String regCodeNameFlag) {
		this.regCodeNameFlag = regCodeNameFlag;
	}

	public String getSerialNumber() {
		return serialNumber;
	}

	public void setSerialNumber(String serialNumber) {
		this.serialNumber = serialNumber;
	}

	public String getLineNumber() {
		return lineNumber;
	}

	public void setLineNumber(String lineNumber) {
		this.lineNumber = lineNumber;
	}

	public String getOperatorIcao() {
		return operatorIcao;
	}

	public void setOperatorIcao(String operatorIcao) {
		this.operatorIcao = operatorIcao;
	}

	public String getTestReg() {
		return testReg;
	}

	public void setTestReg(String testReg) {
		this.testReg = testReg;
	}

	public String getRegistered() {
		return registered;
	}

	public void setRegistered(String registered) {
		this.registered = registered;
	}

	public String getRegUntil() {
		return regUntil;
	}

	public void setRegUntil(String regUntil) {
		this.regUntil = regUntil;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getBuilt() {
		return built;
	}

	public void setBuilt(String built) {
		this.built = built;
	}

	public String getFirstFlightDate() {
		return firstFlightDate;
	}

	public void setFirstFlightDate(String firstFlightDate) {
		this.firstFlightDate = firstFlightDate;
	}

	public String getEngines() {
		return engines;
	}

	public void setEngines(String engines) {
		this.engines = engines;
	}

	public String getFullType() {
		return fullType;
	}

	public void setFullType(String fullType) {
		this.fullType = fullType;
	}

	public List<double[]> getTrailPositions() {
		return trailPositions;
	}

	public String getIcaoAircraftType() {
		return icaoAircraftType;
	}

	public void setIcaoAircraftType(String icaoAircraftType) {
		this.icaoAircraftType = icaoAircraftType;
	}

	/**
	 * Fügt eine trailPosition bestehend aus [double longitude, double latitude] zu
	 * den trailPositions hinzu
	 * 
	 * @param trailPosition
	 */
	public void addToTrailPositions(double[] trailPosition) {
		if (this.trailPositions == null) {
			this.trailPositions = new ArrayList<>();
		}

		if (this.trailPositions.size() == 0) {
			this.trailPositions.add(trailPosition);
			return;
		}

		// Prüfe, ob trailPosition nicht dieselbe ist wie die letzte
		// (verhindert, dass eine Linie zwischen zwei gleichen Punkten gebildet wird)
		if (this.trailPositions.size() > 0) {
			double[] prevTrailPosition = this.trailPositions.get(this.trailPositions.size() - 1);

			if (prevTrailPosition[0] != trailPosition[0] && prevTrailPosition[1] != trailPosition[1]) {
				this.trailPositions.add(trailPosition);
			}

			// Wenn Flugzeug die ISS ist, prüfe nach dem Hinzufügen des Wertes die Größe der
			// Liste und kürze ggf. die Liste, wenn diese mehr als 6000 Einträge enthält
			if (aircraftIsISS && this.trailPositions.size() > 6000 && this.trailPositions.get(0) != null) {
				this.trailPositions.remove(0);
			}
		}
	}

	public String getOrigin() {
		return origin;
	}

	public void setOrigin(String origin) {
		this.origin = origin;
	}

	public String getOperatorIata() {
		return operatorIata;
	}

	public void setOperatorIata(String operatorIata) {
		this.operatorIata = operatorIata;
	}

	public boolean isAircraftIsISS() {
		return aircraftIsISS;
	}

	public void setAircraftIsISS(boolean aircraftIsISS) {
		this.aircraftIsISS = aircraftIsISS;
	}

	public int getCounter() {
		return counter;
	}

	public void setCounter(int counter) {
		this.counter = counter;
	}

	public Boolean getReenteredAircraft() {
		return reenteredAircraft;
	}

	public void setReenteredAircraft(Boolean reenteredAircraft) {
		this.reenteredAircraft = reenteredAircraft;
	}

	public int getAge() {
		return age;
	}

	public void setAge(int age) {
		this.age = age;
	}

	public String getAircraftState() {
		return aircraftState;
	}

	public void setAircraftState(String aircraftState) {
		this.aircraftState = aircraftState;
	}

	@Override
	public String toString() {
		return "Aircraft [hex=" + hex + ", latitude=" + latitude + ", longitude=" + longitude + ", altitude=" + altitude
				+ ", track=" + track + ", type=" + type + ", registration=" + registration + ", onGround=" + onGround
				+ ", speed=" + speed + ", squawk=" + squawk + ", flightId=" + flightId + ", verticalRate="
				+ verticalRate + ", rssi=" + rssi + ", category=" + category + ", temperature=" + temperature
				+ ", windSpeed=" + windSpeed + ", windFromDirection=" + windFromDirection + ", destination="
				+ destination + ", origin=" + origin + ", distance=" + distance + ", autopilotEngaged="
				+ autopilotEngaged + ", elipsoidalAltitude=" + elipsoidalAltitude + ", selectedQnh=" + selectedQnh
				+ ", selectedAltitude=" + selectedAltitude + ", selectedHeading=" + selectedHeading + ", feeder="
				+ feeder + ", lastSeen=" + lastSeen + ", source=" + source + ", trailPositions=" + trailPositions
				+ ", aircraftIsISS=" + aircraftIsISS + ", age=" + age + ", fullType=" + fullType + ", serialNumber="
				+ serialNumber + ", lineNumber=" + lineNumber + ", operatorIcao=" + operatorIcao + ", testReg="
				+ testReg + ", registered=" + registered + ", regUntil=" + regUntil + ", status=" + status + ", built="
				+ built + ", firstFlightDate=" + firstFlightDate + ", icaoAircraftType=" + icaoAircraftType
				+ ", engines=" + engines + ", operatorCallsign=" + operatorCallsign + ", operatorName=" + operatorName
				+ ", operatorCountry=" + operatorCountry + ", operatorCountryFlag=" + operatorCountryFlag
				+ ", operatorIata=" + operatorIata + ", regCodeName=" + regCodeName + ", regCodeNameFlag="
				+ regCodeNameFlag + ", counter=" + counter + ", reenteredAircraft=" + reenteredAircraft
				+ ", aircraftState=" + aircraftState + "]";
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
		Aircraft other = (Aircraft) obj;
		if (hex == null) {
			if (other.hex != null)
				return false;
		} else if (!hex.toLowerCase().equals(other.hex.toLowerCase()))
			return false;
		return true;
	}
}
