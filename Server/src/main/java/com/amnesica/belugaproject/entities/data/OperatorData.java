package com.amnesica.belugaproject.entities.data;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import javax.persistence.Entity;
import javax.persistence.Id;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Entity
public class OperatorData {

    @Id
    private String operatorId;

    // bspw. "LH" for Lufthansa
    private String operatorIata;

    // bspw. "DLH" for Lufthansa
    private String operatorIcao;

    // bspw. "Lufthansa"
    private String operatorName;

    // bspw. "LUFTHANSA"
    private String operatorCallsign;

    // bspw. "Germany"
    private String operatorCountry;

    private String operatorComment;

    // bspw. "de" for Germany
    private String operatorCountryIso2letter;

    public OperatorData() {
        // Benötiger, leerer Konstruktor
    }
}
