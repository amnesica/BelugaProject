package com.amnesica.belugaproject.entities;


import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class OperatorData {

	@Id
	private String operatorId;
	private String operatorIata; // e.g. "LH" for Lufthansa
	private String operatorIcao; // e.g. "DLH" for Lufthansa
	private String operatorName; // e.g. "Lufthansa"
	private String operatorCallsign; // e.g. "LUFTHANSA"
	private String operatorCountry; // e.g. "Germany"
	private String operatorComment;
	private String operatorCountryIso2letter; // e.g. "de" for Germany
	
	public OperatorData() {

	}

	public String getOperatorId() {
		return operatorId;
	}

	public void setOperatorId(String operatorId) {
		this.operatorId = operatorId;
	}

	public String getOperatorIata() {
		return operatorIata;
	}

	public void setOperatorIata(String operatorIata) {
		this.operatorIata = operatorIata;
	}

	public String getOperatorIcao() {
		return operatorIcao;
	}

	public void setOperatorIcao(String operatorIcao) {
		this.operatorIcao = operatorIcao;
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

	public String getOperatorCountry() {
		return operatorCountry;
	}

	public void setOperatorCountry(String operatorCountry) {
		this.operatorCountry = operatorCountry;
	}

	public String getOperatorComment() {
		return operatorComment;
	}

	public void setOperatorComment(String operatorComment) {
		this.operatorComment = operatorComment;
	}

	public String getOperatorCountryIso2letter() {
		return operatorCountryIso2letter;
	}

	public void setOperatorCountryIso2letter(String operatorCountryIso2letter) {
		this.operatorCountryIso2letter = operatorCountryIso2letter;
	}

}
