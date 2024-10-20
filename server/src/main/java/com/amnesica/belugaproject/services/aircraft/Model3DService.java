package com.amnesica.belugaproject.services.aircraft;

import com.amnesica.belugaproject.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.FileSystemResource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

@Slf4j
@Service
public class Model3DService {

  @Autowired
  private Configuration configuration;

  private static final String modelDirectory = "models";

  public byte[] getModelFromType(String type) {
    byte[] model;
    final String pathTo3dModels = configuration.getConfigFilesDirectory() + File.separator + modelDirectory + File.separator;

    if (type.contains("..")) return null;

    try {
      type = getTypeForModelFromResources(type, pathTo3dModels);
      model = getModelFromResources(pathTo3dModels + type + ".glb");
      if (model == null && !type.contains("_cockpit")) {
        // Default plane
        type = "Cesium_Air";
        model = getModelFromResources(pathTo3dModels + type + ".glb");
      } else if (model == null && type.contains("_cockpit")) {
        // Default plane for cockpit
        type = "A320_cockpit";
        model = getModelFromResources(pathTo3dModels + type + ".glb");
      }
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    return model;
  }

  private String getTypeForModelFromResources(String type, String pathToResources) throws IOException {
    final String path = pathToResources + "map_type_to_model.config";
    final Properties props = configuration.readPropertiesFromResourcesFile(path);
    final String typeFromResource = props.getProperty(type);
    return typeFromResource != null ? typeFromResource : type;
  }

  private byte[] getModelFromResources(String path) throws IOException {
    final byte[] model;
    try (InputStream inputStream = new FileSystemResource(path).getInputStream()) {
      if (inputStream == null) {
        return null;
      }
      model = inputStream.readAllBytes();
    } catch (FileNotFoundException exception) {
      // Kein model für type vorhanden
      return null;
    }
    return model;
  }
}
