package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class CountryData {

    // bspw. "de" für Germany
    @Id
    private String countryIso2letter;

    // bspw. "deu" für Germany
    private String countryIso3letter;

    // bspw. "Germany"
    private String countryNameEn;

    // bspw. "Deutschland"
    private String countryNameDe;

    // bspw. "U+1F1E9 U+1F1EA" für Germany
    private String countryFlagUtf8Code;

    public CountryData() {
        // Benötiger, leerer Konstruktor
    }
}
