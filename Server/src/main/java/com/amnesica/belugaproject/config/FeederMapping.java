package com.amnesica.belugaproject.config;

public class FeederMapping {
	private String hex;
	private String latitude;
	private String longitude;
	private String altitude;
	private String track;
	private String type;
	private String registration;
	private String onGround;
	private String speed;
	private String squawk;
	private String flightId;
	private String verticalRate;
	private String rssi;
	private String category;
	private String temperature;
	private String windSpeed;
	private String windFromDirection;
	private String destination;
	private String origin;
	private String distance;
	private String autopilotEngaged;
	private String elipsoidalAltitude;
	private String selectedQnh;
	private String selectedAltitude;
	private String selectedHeading;
	private String feeder;
	private String lastSeen;
	private String source;
	
	public String getHex() {
		return hex;
	}
	public void setHex(String hex) {
		this.hex = hex;
	}
	public String getLatitude() {
		return latitude;
	}
	public void setLatitude(String latitude) {
		this.latitude = latitude;
	}
	public String getLongitude() {
		return longitude;
	}
	public void setLongitude(String longitude) {
		this.longitude = longitude;
	}
	public String getAltitude() {
		return altitude;
	}
	public void setAltitude(String altitude) {
		this.altitude = altitude;
	}
	public String getTrack() {
		return track;
	}
	public void setTrack(String track) {
		this.track = track;
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
	public String getOnGround() {
		return onGround;
	}
	public void setOnGround(String onGround) {
		this.onGround = onGround;
	}
	public String getSpeed() {
		return speed;
	}
	public void setSpeed(String speed) {
		this.speed = speed;
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
	public String getVerticalRate() {
		return verticalRate;
	}
	public void setVerticalRate(String verticalRate) {
		this.verticalRate = verticalRate;
	}
	public String getRssi() {
		return rssi;
	}
	public void setRssi(String rssi) {
		this.rssi = rssi;
	}
	public String getCategory() {
		return category;
	}
	public void setCategory(String category) {
		this.category = category;
	}
	public String getTemperature() {
		return temperature;
	}
	public void setTemperature(String temperature) {
		this.temperature = temperature;
	}
	public String getWindSpeed() {
		return windSpeed;
	}
	public void setWindSpeed(String windSpeed) {
		this.windSpeed = windSpeed;
	}
	public String getWindFromDirection() {
		return windFromDirection;
	}
	public void setWindFromDirection(String windFromDirection) {
		this.windFromDirection = windFromDirection;
	}
	public String getDestination() {
		return destination;
	}
	public void setDestination(String destination) {
		this.destination = destination;
	}
	public String getOrigin() {
		return origin;
	}
	public void setOrigin(String origin) {
		this.origin = origin;
	}
	public String getDistance() {
		return distance;
	}
	public void setDistance(String distance) {
		this.distance = distance;
	}
	public String getAutopilotEngaged() {
		return autopilotEngaged;
	}
	public void setAutopilotEngaged(String autopilotEngaged) {
		this.autopilotEngaged = autopilotEngaged;
	}
	public String getElipsoidalAltitude() {
		return elipsoidalAltitude;
	}
	public void setElipsoidalAltitude(String elipsoidalAltitude) {
		this.elipsoidalAltitude = elipsoidalAltitude;
	}
	public String getSelectedQnh() {
		return selectedQnh;
	}
	public void setSelectedQnh(String selectedQnh) {
		this.selectedQnh = selectedQnh;
	}
	public String getSelectedAltitude() {
		return selectedAltitude;
	}
	public void setSelectedAltitude(String selectedAltitude) {
		this.selectedAltitude = selectedAltitude;
	}
	public String getSelectedHeading() {
		return selectedHeading;
	}
	public void setSelectedHeading(String selectedHeading) {
		this.selectedHeading = selectedHeading;
	}
	public String getFeeder() {
		return feeder;
	}
	public void setFeeder(String feeder) {
		this.feeder = feeder;
	}
	public String getLastSeen() {
		return lastSeen;
	}
	public void setLastSeen(String lastSeen) {
		this.lastSeen = lastSeen;
	}
	public String getSource() {
		return source;
	}
	public void setSource(String source) {
		this.source = source;
	}
	
	@Override
	public String toString() {
		return "FeederMapping [hex=" + hex + ", latitude=" + latitude + ", longitude=" + longitude + ", altitude="
				+ altitude + ", track=" + track + ", type=" + type + ", registration=" + registration + ", onGround="
				+ onGround + ", speed=" + speed + ", squawk=" + squawk + ", flightId=" + flightId + ", verticalRate="
				+ verticalRate + ", rssi=" + rssi + ", category=" + category + ", temperature=" + temperature
				+ ", windSpeed=" + windSpeed + ", windFromDirection=" + windFromDirection + ", destination="
				+ destination + ", origin=" + origin + ", distance=" + distance + ", autopilotEngaged="
				+ autopilotEngaged + ", elipsoidalAltitude=" + elipsoidalAltitude + ", selectedQnh=" + selectedQnh
				+ ", selectedAltitude=" + selectedAltitude + ", selectedHeading=" + selectedHeading + ", feeder="
				+ feeder + ", lastSeen=" + lastSeen + ", source=" + source + "]";
	}
}
