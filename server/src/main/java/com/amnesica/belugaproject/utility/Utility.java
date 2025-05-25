package com.amnesica.belugaproject.utility;

import org.json.JSONObject;

public class Utility {
  public static boolean jsonFieldExists(JSONObject jsonObject, String fieldName) {
    return jsonObject != null && fieldName != null &&
        jsonObject.has(fieldName) && !jsonObject.isNull(fieldName);
  }
}
