package com.amnesica.belugaproject.entities.aircraft;

import javax.persistence.Entity;
import javax.persistence.Table;

@Entity
@Table(name = "aircraft")
public class Aircraft extends AircraftSuperclass {

    public Aircraft() {
        // Benötiger, leerer Konstruktor
    }

    public Aircraft(String hex, Double latitude, Double longitude) {
        super(hex, latitude, longitude);
    }
}
