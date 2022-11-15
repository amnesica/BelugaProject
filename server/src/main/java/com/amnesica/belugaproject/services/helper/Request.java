package com.amnesica.belugaproject.services.helper;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.ToString;

@Data
@ToString
@AllArgsConstructor
public class Request {
    // Allgemeine Daten
    private String requestId;
    private Long timestamp;
    private String ipAddressClient;

    // Daten des Requests
    private Double lomin;
    private Double lamin;
    private Double lomax;
    private Double lamax;

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((requestId == null) ? 0 : requestId.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null)
            return false;
        if (getClass() != obj.getClass())
            return false;
        Request other = (Request) obj;
        if (requestId == null) {
            if (other.requestId != null)
                return false;
        } else if (!requestId.equals(other.requestId))
            return false;
        return true;
    }
}
