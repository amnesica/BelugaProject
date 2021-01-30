package com.amnesica.belugaproject.entities;

import javax.persistence.Entity;
import javax.persistence.Id;

@Entity
public class RegcodeData {

	@Id
	private String regcodePrefix; // e.g. "VP-B"
	private String regcodeName; // Country or Location of Registration, e.g. "Bermuda"
	private String regcodeFlagUtf8code; // Comments
	
	public RegcodeData() {

	}

	public String getRegcodePrefix() {
		return regcodePrefix;
	}

	public void setRegcodePrefix(String regcodePrefix) {
		this.regcodePrefix = regcodePrefix;
	}

	public String getRegcodeName() {
		return regcodeName;
	}

	public void setRegcodeName(String regcodeName) {
		this.regcodeName = regcodeName;
	}

	public String getRegcodeFlagUtf8code() {
		return regcodeFlagUtf8code;
	}

	public void setRegcodeFlagUtf8code(String regcodeFlagUtf8code) {
		this.regcodeFlagUtf8code = regcodeFlagUtf8code;
	}


}

