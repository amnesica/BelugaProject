package com.amnesica.belugaproject.config;

public class Feeder {
	// Allgemeine Informationen über Feeder
	private String name;
	private String ipAdress;
	private String type;
	private String color;

	// Zuweisungen
	private FeederMapping mapping;

	// Konstruktor
	public Feeder(String name, String ipAdress, String type, String color) {
		super();
		this.name = name;
		this.ipAdress = ipAdress;
		this.type = type;
		this.color = color;
	}

	public String getIpAdress() {
		return ipAdress;
	}

	public void setIpAdress(String ipAdress) {
		this.ipAdress = ipAdress;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public FeederMapping getMapping() {
		return mapping;
	}

	public void setMapping(FeederMapping mapping) {
		this.mapping = mapping;
	}

	public String getColor() {
		return color;
	}

	public void setColor(String color) {
		this.color = color;
	}
}
