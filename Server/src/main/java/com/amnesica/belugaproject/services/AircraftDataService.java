package com.amnesica.belugaproject.services;

import java.util.Calendar;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.entities.Aircraft;
import com.amnesica.belugaproject.entities.AircraftData;
import com.amnesica.belugaproject.repositories.AircraftDataRepository;

@Service
public class AircraftDataService {

	@Autowired
	private AircraftDataRepository aircraftDataRepository;

	/**
	 * Gibt alle Informationen über ein Flugzeug mit Angabe der hex aus der
	 * Datenbank zurück
	 * 
	 * @return AircraftData
	 */
	public void addAircraftData(Aircraft aircraft) {
		AircraftData aircraftData = null;

		if (aircraft.getHex() != null && !aircraft.getHex().isEmpty() && !aircraft.getHex().equals("null")) {
			// Hole Daten aus Datenbank mit Angabe der Hex

			try {
				aircraftData = aircraftDataRepository.findByHex(aircraft.getHex());
			} catch (Exception e) {
				System.out.println("Error Server - DB-Error when reading AircraftData for hex " + aircraft.getHex()
						+ ": Exception = " + e);
			}

			if (aircraftData != null) {
				// Speichere Informationen am Flugzeug
				if ((aircraft.getRegistration() == null || aircraft.getRegistration().isEmpty())
						&& !aircraftData.getRegistration().isEmpty()) {
					aircraft.setRegistration(aircraftData.getRegistration());
				}

				if ((aircraft.getType() == null || aircraft.getType().isEmpty())
						&& !aircraftData.getTypecode().isEmpty()) {
					aircraft.setType(aircraftData.getTypecode());
				}

				if (aircraft.getFullType() == null || aircraft.getFullType().isEmpty()) {
					String manufacturerName = aircraftData.getManufacturerName();
					String model = aircraftData.getModel();

					if (manufacturerName != null && model != null) {
						aircraft.setFullType(manufacturerName + " " + model);
					}
				}

				if (!aircraftData.getOperatorIcao().isEmpty()) {
					aircraft.setOperatorIcao(aircraftData.getOperatorIcao());
				}

				if (!aircraftData.getSerialNumber().isEmpty()) {
					aircraft.setSerialNumber(aircraftData.getSerialNumber());
				}

				if (!aircraftData.getLineNumber().isEmpty()) {
					aircraft.setLineNumber(aircraftData.getLineNumber());
				}

				if (!aircraftData.getTestReg().isEmpty()) {
					aircraft.setTestReg(aircraftData.getTestReg());
				}

				if (!aircraftData.getRegistered().isEmpty()) {
					aircraft.setRegistered(aircraftData.getRegistered());
				}

				if (!aircraftData.getRegUntil().isEmpty()) {
					aircraft.setRegUntil(aircraftData.getRegUntil());
				}

				if (!aircraftData.getStatus().isEmpty()) {
					aircraft.setStatus(aircraftData.getStatus());
				}

				if (!aircraftData.getBuilt().isEmpty()) {
					String built = aircraftData.getBuilt();
					aircraft.setBuilt(aircraftData.getBuilt());

					// Berechne Alter des Flugzeugs und setze dieses
					int builtYear = Integer.parseInt(built.substring(0, 4));
					int year = Calendar.getInstance().get(Calendar.YEAR);
					int age = year - builtYear;
					aircraft.setAge(age);
				}

				if (!aircraftData.getFirstFlightDate().isEmpty()) {
					aircraft.setFirstFlightDate(aircraftData.getFirstFlightDate());
				}

				if (!aircraftData.getIcaoAircraftType().isEmpty()) {
					aircraft.setIcaoAircraftType(aircraftData.getIcaoAircraftType());
				}

				if (!aircraftData.getEngines().isEmpty()) {
					aircraft.setEngines(aircraftData.getEngines());
				}
			}
		}
	}
}
