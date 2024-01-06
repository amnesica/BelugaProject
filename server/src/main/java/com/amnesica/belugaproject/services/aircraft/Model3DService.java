package com.amnesica.belugaproject.services.aircraft;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

@Slf4j
@Service
public class Model3DService {

  private static final String modelDirectory = "models";

  public byte[] getModelFromType(String type) {
    final String pathTo3dModels = modelDirectory + File.separator;
    byte[] model;

    type = mapTypeToModel(type);

    try {
      model = getModelFromResources(pathTo3dModels + type + ".glb");
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    return model;
  }

  private String mapTypeToModel(String type) {
    return switch (type) {
      case "A320", "A20N" -> "A320";
      case "A337" -> "A337";
      case "A346" -> "A346";
      case "A359", "A35K" -> "A359";
      case "A388" -> "A388";
      case "EC35", "EC45" -> "EC35";
      case "ISS" -> "ISS";
      default -> "Cesium_Air";
    };
  }

  private byte[] getModelFromResources(String path) throws IOException {
    final byte[] model;

    try (InputStream inputStream = this.getClass()
        .getClassLoader()
        .getResourceAsStream(path)) {

      if (inputStream == null) {
        log.error("Server - Cannot load model resource from " + path);
        return null;
      }
      model = inputStream.readAllBytes();
    }
    return model;
  }
}
