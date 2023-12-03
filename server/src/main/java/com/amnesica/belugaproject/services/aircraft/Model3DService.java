package com.amnesica.belugaproject.services.aircraft;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

@Service
public class Model3DService {

  private static final String modelDirectory = "models";

  public byte[] getModelFromType(String type) {
    final String pathTo3dModels = File.separator + modelDirectory + File.separator;
    byte[] model;

    if (!"ISS".equals(type)) {
      type = "Cesium_Air";
    }

    try {
      model = getModelFromResources(pathTo3dModels + type + ".glb");
    } catch (IOException e) {
      throw new RuntimeException(e);
    }

    return model;
  }

  private byte[] getModelFromResources(String path) throws IOException {
    final byte[] model;

    try (InputStream inputStream = getClass().getResourceAsStream(path)) {
      if (inputStream == null) return null;
      model = inputStream.readAllBytes();
    }
    return model;
  }
}
