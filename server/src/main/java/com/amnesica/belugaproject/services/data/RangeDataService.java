package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.config.StaticValues;
import com.amnesica.belugaproject.entities.aircraft.Aircraft;
import com.amnesica.belugaproject.entities.data.RangeData;
import com.amnesica.belugaproject.repositories.data.RangeDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.DateFormat;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
public class RangeDataService {

    @Autowired
    private RangeDataRepository rangeDataRepository;

    /**
     * Gibt eine Liste mit Range-Data, Start- und Endpunkt von Flugzeugen,
     * welche in dem Zeitslot empfangen wurden
     *
     * @param startTime long
     * @param endTime   long
     * @return List<RangeData>
     */
    public List<RangeData> getRangeDataBetweenTimestamps(long startTime, long endTime) {
        List<RangeData> listRangeData = null;

        if (startTime == 0 && endTime == 0) return null;

        try {
            listRangeData = rangeDataRepository.findAllByTimestampBetween(startTime, endTime);
        } catch (Exception e) {
            log.error("Server - DB error reading RangeData for startTime " + DateFormat.getDateTimeInstance().format(new Date(startTime)) +
                    " and endTime " + DateFormat.getDateTimeInstance().format(new Date(endTime)) + " : Exception = " + e);
        }

        return listRangeData;
    }

    /**
     * Erstellt einen RangeData-Eintrag für ein Flugzeug
     *
     * @param aircraft Aircraft
     */
    public void createAndSaveRangeDataEntry(Aircraft aircraft) {
        if (aircraft == null) return;

        try {
            // Erstelle RangeData (Hinweis: Timestamp ist LastUpdate hier!)
            RangeData rangeData = new RangeData(aircraft.getHex(), aircraft.getLatitude(), aircraft.getLongitude(),
                    aircraft.getDistance(), aircraft.getAltitude(), aircraft.getType(), aircraft.getCategory(), aircraft.getRegistration(),
                    aircraft.getFlightId(), aircraft.getLastUpdate(), aircraft.getFeederList(), aircraft.getSourceList());

            rangeDataRepository.save(rangeData);
        } catch (Exception e) {
            log.error("Server - DB error saving RangeData for hex " + aircraft.getHex() + " : Exception = " + e);
        }
    }

    /**
     * Löscht alle Range-Data, welche älter sind als 30 Tage endgültig.
     * Methode wird alle INTERVAL_REMOVE_OLD_DATA Millisekunden aufgerufen
     */
    @Transactional
    @Scheduled(fixedRate = StaticValues.INTERVAL_REMOVE_OLD_DATA)
    private void deleteRangeDataOlderThanOneMonth() {
        // Berechne timestamp vor 30 Tagen in Millisekunden,
        // damit nur alte Range-Data gelöscht werden
        long startTime = System.currentTimeMillis() - 2592000000L;

        // Lösche Range-Data, welche älter sind als startTime
        try {
            rangeDataRepository.deleteAllByTimestampLessThanEqual(startTime);
        } catch (Exception e) {
            log.error("Server - DB error when removing range data from RangeData older than "
                    + new Date(startTime).toLocaleString() + " days : Exception = " + e);
        }
    }
}
