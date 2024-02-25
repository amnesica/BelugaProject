package com.amnesica.belugaproject.entities.aircraft;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "spacecraft")
public class Spacecraft extends AircraftSuperclass {
  public Spacecraft() {
    // Benötiger, leerer Konstruktor
  }

  public Spacecraft(String hex, Double latitude, Double longitude) {
    super(hex, latitude, longitude);
  }
}
