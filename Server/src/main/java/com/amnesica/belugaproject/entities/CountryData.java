package com.amnesica.belugaproject.entities;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class CountryData {

	@Id
	private String countryIso2letter; // e.g. "de" for Germany
	private String countryIso3letter; // e.g. "deu" for Germany
	private String countryNameEn; // e.g. "Germany"
	private String countryNameDe; // e.g. "Deutschland"
	private String countryFlagUtf8Code; // e.g. "U+1F1E9 U+1F1EA" for Germany
	
	public CountryData() {

	}

	public String getCountryNameEn() {
		return countryNameEn;
	}

	public String getCountryIso2letter() {
		return countryIso2letter;
	}

	public void setCountryIso2letter(String countryIso2letter) {
		this.countryIso2letter = countryIso2letter;
	}

	public String getCountryIso3letter() {
		return countryIso3letter;
	}

	public void setCountryIso3letter(String countryIso3letter) {
		this.countryIso3letter = countryIso3letter;
	}

	public String getCountryNameDe() {
		return countryNameDe;
	}

	public void setCountryNameDe(String countryNameDe) {
		this.countryNameDe = countryNameDe;
	}

	public String getCountryFlagUtf8Code() {
		return countryFlagUtf8Code;
	}

	public void setCountryFlagUtf8Code(String countryFlagUtf8Code) {
		this.countryFlagUtf8Code = countryFlagUtf8Code;
	}

	public void setCountryNameEn(String countryNameEn) {
		this.countryNameEn = countryNameEn;
	}

}
