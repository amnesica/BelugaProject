package com.amnesica.belugaproject.entities;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;

@Entity
public class RangeData {

	@Id
	@GeneratedValue
	private int id;
	private String hex;
	private long timestamp;
	private double latitude;
	private double longitude;
	private double distance;
	private String feeder;
	private String source;
	private int altitude;

	public RangeData(String hex, long timestamp, double latitude, double longitude, double distance, String feeder,
			String source, int altitude) {
		super();
		this.hex = hex;
		this.timestamp = timestamp;
		this.latitude = latitude;
		this.longitude = longitude;
		this.distance = distance;
		this.feeder = feeder;
		this.source = source;
		this.altitude = altitude;
	}

	public RangeData() {

	}

	public int getId() {
		return id;
	}

	public void setId(int id) {
		this.id = id;
	}

	public String getHex() {
		return hex;
	}

	public void setHex(String hex) {
		this.hex = hex;
	}

	public long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(long timestamp) {
		this.timestamp = timestamp;
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

	public double getDistance() {
		return distance;
	}

	public void setDistance(double distance) {
		this.distance = distance;
	}

	public String getFeeder() {
		return feeder;
	}

	public void setFeeder(String feeder) {
		this.feeder = feeder;
	}

	public String getSource() {
		return source;
	}

	public void setSource(String source) {
		this.source = source;
	}

	public int getAltitude() {
		return altitude;
	}

	public void setAltitude(int altitude) {
		this.altitude = altitude;
	}

}
