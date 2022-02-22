package com.amnesica.belugaproject.services.helper;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.validation.constraints.NotNull;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Collections;
import java.util.zip.GZIPInputStream;

@Slf4j
@Service
public class DebugService {

    // Pfad mit Dateiname des Logs
    @Value("${logging.file.name}")
    @NotNull(message = "logging.file.name was not found in application.properties")
    private String logFilePath;

    /**
     * Gibt die vorhandenen Log-Dateien im Log-Verzeichnis (spezifiziert in application.properties) aus.
     * Diese werden formatiert, sodass auf die geklickt werden kann
     *
     * @return String
     */
    public String getLogs() {
        StringBuilder sb = new StringBuilder();

        if (logFilePath == null || logFilePath.isEmpty()) return null;

        // Extrahiere Log-Verzeichnis aus Pfad zur Log-Datei
        int indexLastSlash = logFilePath.lastIndexOf("/");
        String pathToLogFile = logFilePath.substring(0, indexLastSlash);

        try {
            // Liste die Dateien im Log-Verzeichnis auf
            ArrayList<String> listOfFilenames = listFilesUsingFileWalkAndVisitor(pathToLogFile);

            // Erstelle Headline
            String headlineHtml = "<h1>Log-Files for The Beluga Project</h1>";
            sb.append(headlineHtml);

            // Erstelle HTML-Links für jeden Filename
            for (String filename : listOfFilenames) {
                sb.append("<a href=\"" + "/getLog?filename=" + filename + "\">");
                sb.append(filename);
                sb.append("</a>");
                sb.append("</br>");
            }
            return sb.toString();

        } catch (IOException e) {
            log.error("Server - Error when trying to read log file : Exception = " + e);
        }
        return null;
    }

    /**
     * Gibt eine bestimmte Log-Datei mit einem filename als String aus
     *
     * @param filename String
     * @return String
     */
    public String getSpecificLog(String filename) {
        if (filename == null || filename.isEmpty() || logFilePath == null || logFilePath.isEmpty())
            return "Invalid filename for log file.";

        // Erstelle Pfad zur Log-Datei mit passendem filename
        int indexLastSlash = logFilePath.lastIndexOf("/");
        String pathToLogFile = logFilePath.substring(0, indexLastSlash) + "/" + filename;

        try {
            if (filename.endsWith(".gz")) {
                // Extrahiere Inhalt der komprimierten Datei und gebe diesen zurück
                return readAndPrintCompressedFile(pathToLogFile);
            } else {
                // Gebe die Datei zurück
                return readAndPrintFile(pathToLogFile);
            }
        } catch (IOException e) {
            log.error("Server - Error when trying to read log file : Exception = " + e);
        }
        return null;
    }

    /**
     * Extrahiert den Inhalt einer komprimierten Datei und gibt diesen zurück
     *
     * @param pathToCompressedFile String
     * @return String
     * @throws IOException IOException
     */
    private String readAndPrintCompressedFile(String pathToCompressedFile) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();

        try (GZIPInputStream gis = new GZIPInputStream(
                new FileInputStream(Paths.get(pathToCompressedFile).toFile()))) {

            // Kopiere GZIPInputStream zu ByteArrayOutputStream
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gis.read(buffer)) > 0) {
                output.write(buffer, 0, len);
            }
        }

        // Konvertiere byte[] zu String
        return output.toString(StandardCharsets.UTF_8);
    }

    /**
     * Liest eine Datei und gibt eine Datei zurück
     *
     * @param path String
     * @return String
     * @throws IOException IOException
     */
    private String readAndPrintFile(String path) throws IOException {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        StringBuilder stringBuilder = new StringBuilder();
        String line;
        String ls = System.getProperty("line.separator");

        while ((line = reader.readLine()) != null) {
            stringBuilder.append(line);
            stringBuilder.append(ls);
        }

        // Lösche letzten line separator
        stringBuilder.deleteCharAt(stringBuilder.length() - 1);
        reader.close();

        return stringBuilder.toString();
    }

    /**
     * Gibt die Dateinamen von Dateien in einem Verzeichnis wieder
     *
     * @param dir String
     * @return ArrayList<String>
     * @throws IOException IOException
     */
    public ArrayList<String> listFilesUsingFileWalkAndVisitor(String dir) throws IOException {
        ArrayList<String> fileList = new ArrayList<>();
        Files.walkFileTree(Paths.get(dir), new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                if (!Files.isDirectory(file)) {
                    fileList.add(file.getFileName().toString());
                }
                return FileVisitResult.CONTINUE;
            }
        });

        // Sortiere Dateinamen alphabetisch
        Collections.sort(fileList);

        return fileList;
    }
}
