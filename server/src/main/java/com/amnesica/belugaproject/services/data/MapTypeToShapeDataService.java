package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.data.MapTypeToShapeData;
import com.amnesica.belugaproject.repositories.data.MapTypeToShapeDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MapTypeToShapeDataService {

    @Autowired
    private MapTypeToShapeDataRepository mapTypeToShapeDataRepository;

    /**
     * Gibt zu einem typeDesignator den Designator für das zugeordnete Shape zurück
     *
     * @param typeDesignator String
     * @return mapTypeToShapeData
     */
    public MapTypeToShapeData getMapTypeToShapeData(String typeDesignator) {
        MapTypeToShapeData mapTypeToShapeData = null;

        if (typeDesignator != null && !typeDesignator.isEmpty() && !typeDesignator.equals("null")) {

            try {
                mapTypeToShapeData = mapTypeToShapeDataRepository.findByTypeDesignator(typeDesignator);
            } catch (Exception e) {
                log.error("Server - DB error reading ShapeData for typeDesignator " + typeDesignator + ": Exception = "
                        + e);
            }

        }

        return mapTypeToShapeData;
    }

    /**
     * Gibt eine Map mit Type to Shape-Zuordnungen zurück, wobei der Key der jeweilige TypeDesignator
     * und der Value ein Array mit dem zugeordneten ShapeDesignator und ShapeScale ist. Die Datenstruktur ist dieselbe,
     * die in der Markers-Datei im Frontend benutzt wird
     *
     * @return Map<String, Object [ ]>
     */
    public Map<String, Object[]> getMapTypeToShape() {
        try {
            HashMap<String, Object[]> typesMap = new HashMap<>();

            // Hole Liste an MapTypeToShapeData
            List<MapTypeToShapeData> mapTypeToShapeDataList = (List<MapTypeToShapeData>) mapTypeToShapeDataRepository.findAll();

            // Packe Inhalte in typesMap
            for (MapTypeToShapeData mapTypeToShapeData : mapTypeToShapeDataList) {
                Object[] valueArray = {mapTypeToShapeData.getShapeDesignator(), mapTypeToShapeData.getShapeScale()};
                typesMap.put(mapTypeToShapeData.getTypeDesignator(), valueArray);
            }

            return typesMap;
        } catch (Exception e) {
            log.error("Server - DB error reading all MapTypeToShapeData : Exception = " + e);
        }
        return null;
    }

}
