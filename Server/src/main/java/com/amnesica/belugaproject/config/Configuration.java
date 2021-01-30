package com.amnesica.belugaproject.config;

import java.util.ArrayList;
import java.util.List;

public class Configuration {
	// Name und Version der App
	private final String appName = "The Beluga Project";
	private final String appVersion = "1-4-0";

	// Liste mit Feedern aus der Konfigurationsdatei app.config
	private List<Feeder> listFeeder = new ArrayList<>();

	// Angezeigte Position auf der Karte
	private final double latFeeder;
	private final double lonFeeder;

	// Anzahl der Feeder
	private final double amountFeeder;

	// Boolean, ob ISS angezeigt werden soll
	private final boolean showIss;

	// Skalierung der Icons
	private final double scaleIcons;

	// Anzuzeigende Range Ringe
	private final int[] circleDistancesInNm;

	public Configuration(double latFeeder, double lonFeeder, double amountFeeder, boolean showIss, double scaleIcons,
			int[] circleDistancesInNm) {
		this.latFeeder = latFeeder;
		this.lonFeeder = lonFeeder;
		this.amountFeeder = amountFeeder;
		this.showIss = showIss;
		this.scaleIcons = scaleIcons;
		this.circleDistancesInNm = circleDistancesInNm;
	}

	public String getAppName() {
		return appName;
	}

	public String getAppVersion() {
		return appVersion;
	}

	public List<Feeder> getListFeeder() {
		return listFeeder;
	}

	public boolean isShowIss() {
		return showIss;
	}

	public double getLatFeeder() {
		return latFeeder;
	}

	public double getLonFeeder() {
		return lonFeeder;
	}

	public double getAmountFeeder() {
		return amountFeeder;
	}

	public void addFeederToList(Feeder feeder) {
		listFeeder.add(feeder);
	}

	public void setListFeeder(List<Feeder> listFeeder) {
		this.listFeeder = listFeeder;
	}

	public double getScaleIcons() {
		return scaleIcons;
	}

	public int[] getCircleDistancesInNm() {
		return circleDistancesInNm;
	}
}
