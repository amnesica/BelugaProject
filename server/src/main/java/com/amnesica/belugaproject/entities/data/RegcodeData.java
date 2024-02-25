package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class RegcodeData {

  // bspw. "VP-B"
  @Id
  private String regcodePrefix;

  // Land or Ort der Registrierung, bspw. "Bermuda"
  private String regcodeName;

  private String regcodeFlagUtf8code;

  public RegcodeData() {
    // Benötiger, leerer Konstruktor
  }
}
