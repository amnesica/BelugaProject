package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.data.MapCatToShapeData;
import com.amnesica.belugaproject.repositories.data.MapCatToShapeDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class MapCatToShapeDataService {

    @Autowired
    private MapCatToShapeDataRepository mapCatToShapeDataRepository;

    /**
     * Gibt zu einer category den Designator für das zugeordnete Shape zurück
     *
     * @param category String
     * @return mapCatToShapeData
     */
    public MapCatToShapeData getMapCatToShapeData(String category) {
        MapCatToShapeData mapCatToShapeData = null;

        if (category != null && !category.isEmpty() && !category.equals("null")) {

            try {
                mapCatToShapeData = mapCatToShapeDataRepository.findByCategory(category);
            } catch (Exception e) {
                log.error("Server - DB error reading ShapeData for category " + category + ": Exception = " + e);
            }

        }

        return mapCatToShapeData;
    }

    /**
     * Gibt eine Map mit Category to Shape-Zuordnungen zurück, wobei der Key der jeweilige TypeDesignator
     * und der Value ein Array mit dem zugeordneten ShapeDesignator und ShapeScale ist. Die Datenstruktur ist dieselbe,
     * die in der Markers-Datei im Frontend benutzt wird
     *
     * @return Map<String, Object [ ]>
     */
    public Map<String, Object[]> getMapCatToShape() {
        try {
            HashMap<String, Object[]> catMap = new HashMap<>();

            // Hole Liste an MapCatToShapeData
            List<MapCatToShapeData> mapCatToShapeDataList = (List<MapCatToShapeData>) mapCatToShapeDataRepository.findAll();

            // Packe Inhalte in catMap
            for (MapCatToShapeData mapCatToShapeData : mapCatToShapeDataList) {
                Object[] valueArray = {mapCatToShapeData.getShapeDesignator(), mapCatToShapeData.getShapeScale()};
                catMap.put(mapCatToShapeData.getCategory(), valueArray);
            }

            return catMap;
        } catch (Exception e) {
            log.error("Server - DB error reading all MapCatToShapeData : Exception = " + e);
        }
        return null;
    }
}
