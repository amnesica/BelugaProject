package com.amnesica.belugaproject.services.data;

import com.amnesica.belugaproject.entities.data.ShapeData;
import com.amnesica.belugaproject.repositories.data.ShapeDataRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class ShapeDataService {

    @Autowired
    private ShapeDataRepository shapeDataRepository;

    /**
     * Gibt alle Informationen über ein Shape mit Angabe des designators aus der
     * Datenbank zurück
     *
     * @param designator String
     * @return shapeData
     */
    public ShapeData getShapeData(String designator) {
        ShapeData shapeData = null;

        if (designator != null && !designator.isEmpty() && !designator.equals("null")) {

            try {
                shapeData = shapeDataRepository.findByDesignator(designator);
            } catch (Exception e) {
                log.error("Server - DB error reading ShapeData for designator " + designator + ": Exception = " + e);
            }

        }

        return shapeData;
    }

    /**
     * Gibt eine Map mit den Shapes zurück, wobei der Key der jeweilige TypeDesignator
     * und der Value das zugehörige ShapeData-Objekt ist. Die Datenstruktur ist dieselbe,
     * die in der Markers-Datei im Frontend benutzt wird
     *
     * @return Map<String, Object>
     */
    public Map<String, Object[]> getShapes() {
        try {
            HashMap<String, Object[]> shapesMap = new HashMap<>();

            // Hole Liste an ShapeData
            List<ShapeData> shapeDataList = (List<ShapeData>) shapeDataRepository.findAll();

            // Packe Inhalte in shapesMap
            for (ShapeData shapeData : shapeDataList) {
                shapesMap.put(shapeData.getDesignator(), new Object[]{shapeData.getShapeData(), shapeData.getPngId(), shapeData.getPngScale()});
            }

            return shapesMap;
        } catch (Exception e) {
            log.error("Server - DB error reading all ShapeData : Exception = " + e);
        }
        return null;
    }
}
