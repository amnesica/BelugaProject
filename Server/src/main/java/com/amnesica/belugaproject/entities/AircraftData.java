package com.amnesica.belugaproject.entities;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class AircraftData {

	@Id
	private String hex;
	private String registration;
	private String manufacturerIcao;
	private String manufacturerName; // manufacturer e.g. AIRBUS
	private String model; // full model e.g. A380-841
	private String typecode; // type code only e.g. A388
	private String serialNumber;
	private String lineNumber;
	private String icaoAircraftType; // category e.g. L2J
	private String operatorName; // e.g. GERMAN AIR FORCE
	private String operatorCallsign;
	private String operatorIcao;
	private String operatorIata;
	private String ownerName; // operator (airline) e.g. LUFTHANSA oder GERMAN AIR FORCE
	private String testReg;
	private String registered;
	private String regUntil;
	private String status;
	private String built;
	private String firstFlightDate;
	private String seatConfiguration;
	private String engines;
	private String modes;
	private String adsb;
	private String acars;
	private String notes;
	private String categoryDescription;

	public AircraftData() {

	}

	public String getHex() {
		return hex;
	}

	public void setHex(String hex) {
		this.hex = hex;
	}

	public String getRegistration() {
		return registration;
	}

	public void setRegistration(String registration) {
		this.registration = registration;
	}

	public String getManufacturerIcao() {
		return manufacturerIcao;
	}

	public void setManufacturerIcao(String manufacturerIcao) {
		this.manufacturerIcao = manufacturerIcao;
	}

	public String getManufacturerName() {
		return manufacturerName;
	}

	public void setManufacturerName(String manufacturerName) {
		this.manufacturerName = manufacturerName;
	}

	public String getModel() {
		return model;
	}

	public void setModel(String model) {
		this.model = model;
	}

	public String getTypecode() {
		return typecode;
	}

	public void setTypecode(String typecode) {
		this.typecode = typecode;
	}

	public String getSerialNumber() {
		return serialNumber;
	}

	public void setSerialNumber(String serialNumber) {
		this.serialNumber = serialNumber;
	}

	public String getLineNumber() {
		return lineNumber;
	}

	public void setLineNumber(String lineNumber) {
		this.lineNumber = lineNumber;
	}

	public String getIcaoAircraftType() {
		return icaoAircraftType;
	}

	public void setIcaoAircraftType(String icaoAircraftType) {
		this.icaoAircraftType = icaoAircraftType;
	}

	public String getOperatorName() {
		return operatorName;
	}

	public void setOperatorName(String operatorName) {
		this.operatorName = operatorName;
	}

	public String getOperatorCallsign() {
		return operatorCallsign;
	}

	public void setOperatorCallsign(String operatorCallsign) {
		this.operatorCallsign = operatorCallsign;
	}

	public String getOperatorIcao() {
		return operatorIcao;
	}

	public void setOperatorIcao(String operatorIcao) {
		this.operatorIcao = operatorIcao;
	}

	public String getOperatorIata() {
		return operatorIata;
	}

	public void setOperatorIata(String operatorIata) {
		this.operatorIata = operatorIata;
	}

	public String getOwnerName() {
		return ownerName;
	}

	public void setOwnerName(String ownerName) {
		this.ownerName = ownerName;
	}

	public String getTestReg() {
		return testReg;
	}

	public void setTestReg(String testReg) {
		this.testReg = testReg;
	}

	public String getRegistered() {
		return registered;
	}

	public void setRegistered(String registered) {
		this.registered = registered;
	}

	public String getRegUntil() {
		return regUntil;
	}

	public void setRegUntil(String regUntil) {
		this.regUntil = regUntil;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getBuilt() {
		return built;
	}

	public void setBuilt(String built) {
		this.built = built;
	}

	public String getFirstFlightDate() {
		return firstFlightDate;
	}

	public void setFirstFlightDate(String firstFlightDate) {
		this.firstFlightDate = firstFlightDate;
	}

	public String getSeatConfiguration() {
		return seatConfiguration;
	}

	public void setSeatConfiguration(String seatConfiguration) {
		this.seatConfiguration = seatConfiguration;
	}

	public String getEngines() {
		return engines;
	}

	public void setEngines(String engines) {
		this.engines = engines;
	}

	public String getModes() {
		return modes;
	}

	public void setModes(String modes) {
		this.modes = modes;
	}

	public String getAdsb() {
		return adsb;
	}

	public void setAdsb(String adsb) {
		this.adsb = adsb;
	}

	public String getAcars() {
		return acars;
	}

	public void setAcars(String acars) {
		this.acars = acars;
	}

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public String getCategoryDescription() {
		return categoryDescription;
	}

	public void setCategoryDescription(String categoryDescription) {
		this.categoryDescription = categoryDescription;
	}

	@Override
	public String toString() {
		return "AircraftData [hex=" + hex + ", registration=" + registration + ", manufacturerIcao=" + manufacturerIcao
				+ ", manufacturerName=" + manufacturerName + ", model=" + model + ", typecode=" + typecode
				+ ", serialNumber=" + serialNumber + ", lineNumber=" + lineNumber + ", icaoAircraftType="
				+ icaoAircraftType + ", operatorName=" + operatorName + ", operatorCallsign=" + operatorCallsign
				+ ", operatorIcao=" + operatorIcao + ", operatorIata=" + operatorIata + ", ownerName=" + ownerName
				+ ", testReg=" + testReg + ", registered=" + registered + ", regUntil=" + regUntil + ", status="
				+ status + ", built=" + built + ", firstFlightDate=" + firstFlightDate + ", seatConfiguration="
				+ seatConfiguration + ", engines=" + engines + ", modes=" + modes + ", adsb=" + adsb + ", acars="
				+ acars + ", notes=" + notes + ", categoryDescription=" + categoryDescription + "]";
	}

}
