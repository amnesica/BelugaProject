package com.amnesica.belugaproject.config;

import lombok.Data;

@Data
public class Feeder {
    // Allgemeine Informationen über Feeder
    private String name;
    private String ipAddress;
    private String type;
    private String color;

    // Zuweisungen
    private FeederMapping mapping;

    // Konstruktor
    public Feeder(String name, String ipAddress, String type, String color) {
        super();
        this.name = name;
        this.ipAddress = ipAddress;
        this.type = type;
        this.color = color;
    }
}
