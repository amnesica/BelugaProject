package com.amnesica.belugaproject.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Component
@EnableWebMvc
public class CORSConfig implements WebMvcConfigurer {
  @Autowired
  private Configuration configuration;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    configuration.prodBaseUrlIsValid();

    registry
        .addMapping("/**")
        .allowedOrigins("http://localhost:4200", "http://localhost:8090",
            String.format("http://%s:4200", configuration.getProdBaseUrl()),
            String.format("http://%s:8090", configuration.getProdBaseUrl()))
        .allowedMethods("GET")
        .allowCredentials(false);
  }
}
