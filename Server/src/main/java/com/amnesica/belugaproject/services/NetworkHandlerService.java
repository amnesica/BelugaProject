package com.amnesica.belugaproject.services;

import java.io.BufferedInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Helfer-Klasse für http and https Verbindungen
 */
public class NetworkHandlerService {

	/**
	 * Mache call zur requestUrl
	 *
	 * @param requestUrl url
	 * @return String
	 */
	public String makeServiceCall(String requestUrl) {
		String response = null;
		InputStream in = null;
		HttpURLConnection conn = null;
		try {
			if (requestUrl != null) {
				URL url = new URL(requestUrl);
				conn = (HttpURLConnection) url.openConnection();
				conn.setRequestMethod("GET");
				// read the response
				in = new BufferedInputStream(conn.getInputStream());
				response = convertStreamToString(in);
			}
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			closeConnectionsAndBuffers(in, conn);
		}
		return response;
	}

	/**
	 * Schließt den InputStream und die HttpURLConnection
	 *
	 * @param in   InputStream
	 * @param conn HttpURLConnection
	 */
	private void closeConnectionsAndBuffers(InputStream in, HttpURLConnection conn) {
		if (in != null) {
			try {
				in.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		if (conn != null) {
			conn.disconnect();
		}
	}

	/**
	 * Konvertiert den InputStream zu einem String
	 *
	 * @param is InputStream
	 * @return String
	 * @throws IOException IOException
	 */
	private String convertStreamToString(InputStream is) throws IOException {
		BufferedReader reader = new BufferedReader(new InputStreamReader(is));
		StringBuilder sb = new StringBuilder();
		String line;
		try (is) {
			while ((line = reader.readLine()) != null) {
				sb.append(line).append('\n');
			}
		}
		return sb.toString();
	}
}