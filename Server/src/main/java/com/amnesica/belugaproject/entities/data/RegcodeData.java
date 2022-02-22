package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

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
