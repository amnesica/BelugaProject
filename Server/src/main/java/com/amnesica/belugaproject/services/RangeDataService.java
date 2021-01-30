package com.amnesica.belugaproject.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.amnesica.belugaproject.entities.Aircraft;
import com.amnesica.belugaproject.entities.RangeData;
import com.amnesica.belugaproject.repositories.RangeDataRepository;

@Service
public class RangeDataService {

	@Autowired
	private RangeDataRepository rangeDataRepository;

	/**
	 * Methode speichert eine Liste an Flugzeugen zu Statistikzwecken in der
	 * RangeData-Tabelle ab
	 * 
	 * @param aircraftsList List<Aircraft>
	 */
	public void saveRangeData(List<Aircraft> aircraftsList) {
		if (aircraftsList != null && !aircraftsList.isEmpty()) {
			for (Aircraft aircraft : aircraftsList) {
				// Erstelle RangeData-Objekt aus Flugzeug
				RangeData rangeData = new RangeData(aircraft.getHex(), System.currentTimeMillis(),
						aircraft.getLongitude(), aircraft.getLatitude(), aircraft.getDistance(), aircraft.getFeeder(),
						aircraft.getSource(), aircraft.getAltitude());

				// Packe RangeData-Objekt in Datenbank

				try {
					rangeDataRepository.save(rangeData);
				} catch (Exception e) {
					System.out.println("Error Server - DB error when writing RangeData for hex " + aircraft.getHex()
							+ ": Exception = " + e);
				}

			}
		}
	}

	/**
	 * Gibt alle Informationen aus der RangeData-Tabelle als Liste an RangeData
	 * zurück
	 * 
	 * @return List<RangeData>
	 */
	public List<RangeData> getAllRangeData() {
		List<RangeData> listRangeData = (List<RangeData>) rangeDataRepository.findAll();
		return listRangeData;
	}

	/**
	 * Gibt alle RangeData zwischen der startTime und der endTime zurück
	 * 
	 * @param startTime
	 * @param endTime
	 * @return List<RangeData>
	 */
	public List<RangeData> getRangeDataBetweenTimestamps(long startTime, long endTime) {
		List<RangeData> listRangeData = null;
		if (startTime != 0 && endTime != 0) {
			listRangeData = (List<RangeData>) rangeDataRepository.findAllByTimestampBetween(startTime, endTime);
		}

		return listRangeData;
	}
}
