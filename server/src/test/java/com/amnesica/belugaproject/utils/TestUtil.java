package com.amnesica.belugaproject.utils;

import lombok.SneakyThrows;
import lombok.experimental.UtilityClass;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

@UtilityClass
public class TestUtil {

  private static final Charset UTF_8 = StandardCharsets.UTF_8;

  public static String getResource(String filename) {
    return readFile("testData/%s".formatted(filename));
  }

  @SneakyThrows
  public static String readFile(String filename) {
    try {
      return Files.readString(Paths.get("./src/test/resources/" + filename), UTF_8);
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }
}
