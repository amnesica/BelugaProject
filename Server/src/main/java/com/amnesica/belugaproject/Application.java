package com.amnesica.belugaproject;

import java.io.IOException;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.amnesica.belugaproject.config.AppProperties;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		// Properties werden aus Konfigurationsdatei gelesen
		try {
			AppProperties.readPropertiesFromConfig();
		} catch (IOException e) {
			e.printStackTrace();
			System.out.println("Server: Configuration file app.config not found. Program will terminate!");
			System.exit(0);
		}

		// Spring Application starten
		SpringApplication.run(Application.class, args);
	}
}
