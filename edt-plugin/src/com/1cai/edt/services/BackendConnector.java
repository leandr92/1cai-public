package com.onecai.edt.services;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

/**
 * Backend Connector - connects EDT Plugin to MCP Server and Graph API
 */
public class BackendConnector {
    
    private static final String DEFAULT_MCP_URL = "http://localhost:6001";
    private static final String DEFAULT_API_URL = "http://localhost:8080";
    
    private final String mcpUrl;
    private final String apiUrl;
    private final Gson gson;
    
    public BackendConnector() {
        // TODO: Load from preferences
        this.mcpUrl = DEFAULT_MCP_URL;
        this.apiUrl = DEFAULT_API_URL;
        this.gson = new Gson();
    }
    
    public BackendConnector(String mcpUrl, String apiUrl) {
        this.mcpUrl = mcpUrl;
        this.apiUrl = apiUrl;
        this.gson = new Gson();
    }
    
    /**
     * Test connection to backend
     */
    public boolean testConnection() {
        try {
            String response = httpGet(apiUrl + "/health");
            return response != null && response.contains("healthy");
        } catch (Exception e) {
            System.err.println("Connection test failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Call MCP tool
     */
    public JsonObject callMCPTool(String toolName, JsonObject arguments) {
        try {
            JsonObject request = new JsonObject();
            request.addProperty("name", toolName);
            request.add("arguments", arguments);
            
            String response = httpPost(mcpUrl + "/mcp/tools/call", request.toString());
            
            if (response != null) {
                return gson.fromJson(response, JsonObject.class);
            }
            
        } catch (Exception e) {
            System.err.println("MCP tool call failed: " + e.getMessage());
        }
        
        return null;
    }
    
    /**
     * Search metadata using MCP
     */
    public JsonObject searchMetadata(String query, String configuration) {
        JsonObject args = new JsonObject();
        args.addProperty("query", query);
        if (configuration != null && !configuration.isEmpty()) {
            args.addProperty("configuration", configuration);
        }
        
        return callMCPTool("search_metadata", args);
    }
    
    /**
     * Semantic code search
     */
    public JsonObject searchCodeSemantic(String query, String configuration, int limit) {
        JsonObject args = new JsonObject();
        args.addProperty("query", query);
        if (configuration != null && !configuration.isEmpty()) {
            args.addProperty("configuration", configuration);
        }
        args.addProperty("limit", limit);
        
        return callMCPTool("search_code_semantic", args);
    }
    
    /**
     * Generate BSL code
     */
    public JsonObject generateBSLCode(String description, String functionName) {
        JsonObject args = new JsonObject();
        args.addProperty("description", description);
        if (functionName != null && !functionName.isEmpty()) {
            args.addProperty("function_name", functionName);
        }
        
        return callMCPTool("generate_bsl_code", args);
    }
    
    /**
     * Analyze function dependencies
     */
    public JsonObject analyzeDependencies(String moduleName, String functionName) {
        JsonObject args = new JsonObject();
        args.addProperty("module_name", moduleName);
        args.addProperty("function_name", functionName);
        
        return callMCPTool("analyze_dependencies", args);
    }
    
    /**
     * Get all configurations from Graph API
     */
    public JsonObject getConfigurations() {
        try {
            String response = httpGet(apiUrl + "/api/graph/configurations");
            if (response != null) {
                return gson.fromJson(response, JsonObject.class);
            }
        } catch (Exception e) {
            System.err.println("Get configurations failed: " + e.getMessage());
        }
        return null;
    }
    
    /**
     * Get objects of configuration
     */
    public JsonObject getObjects(String configName, String objectType) {
        try {
            String url = apiUrl + "/api/graph/objects/" + configName;
            if (objectType != null && !objectType.isEmpty()) {
                url += "?object_type=" + objectType;
            }
            
            String response = httpGet(url);
            if (response != null) {
                return gson.fromJson(response, JsonObject.class);
            }
        } catch (Exception e) {
            System.err.println("Get objects failed: " + e.getMessage());
        }
        return null;
    }
    
    /**
     * HTTP GET request
     */
    private String httpGet(String urlString) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(10000);
        
        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            BufferedReader in = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            
            while ((line = in.readLine()) != null) {
                response.append(line);
            }
            in.close();
            
            return response.toString();
        }
        
        return null;
    }
    
    /**
     * HTTP POST request
     */
    private String httpPost(String urlString, String jsonBody) throws Exception {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setConnectTimeout(5000);
        conn.setReadTimeout(30000);  // AI calls can be slow
        conn.setDoOutput(true);
        
        // Write body
        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = jsonBody.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }
        
        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            BufferedReader in = new BufferedReader(
                new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            StringBuilder response = new StringBuilder();
            String line;
            
            while ((line = in.readLine()) != null) {
                response.append(line);
            }
            in.close();
            
            return response.toString();
        }
        
        return null;
    }
}





