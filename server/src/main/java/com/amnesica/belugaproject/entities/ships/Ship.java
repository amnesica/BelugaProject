package com.amnesica.belugaproject.entities.ships;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.util.Objects;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Ship {
  // PositionsReport
  private Double latitude;
  private Double longitude;
  private Integer userId;
  private Integer trueHeading;
  private Integer sog; // speed over ground
  private Integer rateOfTurn;
  private Double cog; // course over ground
  private Integer navigationalStatus;

  // MetaData
  private String timeUTC;
  private Integer mmsi;
  private String shipName;

  // ShipStaticData
  private String callSign;
  private String destination;
  private Integer imoNumber;
  private Double maximumStaticDraught;

  public record Dimension(Integer to_bow, Integer to_stern, Integer to_port, Integer to_starboard) {
  }

  public record ETA(Integer month, Integer day, Integer hour, Integer minute) {
  }

  private Dimension dimension;
  private String name;
  private Integer type;
  private ETA eta;
  private long timestamp;

  private String photoUrl;

  public Ship(Double latitude, Double longitude, Integer userId, String timeUTC, Integer mmsi, String shipName, long timestamp) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.userId = userId;
    this.timeUTC = timeUTC;
    this.mmsi = mmsi;
    this.shipName = shipName;
    this.timestamp = timestamp;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) return true;
    if (o == null || getClass() != o.getClass()) return false;
    Ship ship = (Ship) o;
    return Objects.equals(latitude, ship.latitude) && Objects.equals(longitude, ship.longitude) && Objects.equals(userId, ship.userId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(latitude, longitude, userId);
  }

  @Override
  public String toString() {
    return "Ship{" +
        "latitude=" + latitude +
        ", longitude=" + longitude +
        ", id=" + userId +
        '}';
  }
}
