package com.onecai.edt.views;

import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.swt.browser.Browser;
import org.eclipse.ui.part.ViewPart;

import com.google.gson.JsonObject;
import com.onecai.edt.services.BackendConnector;

/**
 * Metadata Graph View - Visualizes 1C metadata graph from Neo4j
 */
public class MetadataGraphView extends ViewPart {

    public static final String ID = "com.1cai.edt.views.MetadataGraph";

    private Browser browser;
    private Combo configCombo;
    private Combo objectTypeCombo;
    private Text searchText;
    private BackendConnector backend;

    @Override
    public void createPartControl(Composite parent) {
        backend = new BackendConnector();
        
        Composite container = new Composite(parent, SWT.NONE);
        GridLayout layout = new GridLayout(1, false);
        container.setLayout(layout);

        // Control panel
        Composite controlPanel = new Composite(container, SWT.NONE);
        controlPanel.setLayout(new GridLayout(5, false));
        controlPanel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Configuration selector
        Label configLabel = new Label(controlPanel, SWT.NONE);
        configLabel.setText("Конфигурация:");

        configCombo = new Combo(controlPanel, SWT.DROP_DOWN | SWT.READ_ONLY);
        configCombo.setItems(new String[] {"DO", "ERP", "ZUP", "BUH"});
        configCombo.select(0);

        // Object type selector
        Label typeLabel = new Label(controlPanel, SWT.NONE);
        typeLabel.setText("Тип:");

        objectTypeCombo = new Combo(controlPanel, SWT.DROP_DOWN | SWT.READ_ONLY);
        objectTypeCombo.setItems(new String[] {
            "Все", "Документ", "Справочник", "Регистр", "Отчет", "Обработка"
        });
        objectTypeCombo.select(0);

        // Search button
        Button searchButton = new Button(controlPanel, SWT.PUSH);
        searchButton.setText("Показать граф");
        searchButton.addListener(SWT.Selection, e -> loadGraph());

        // Search text
        Composite searchPanel = new Composite(container, SWT.NONE);
        searchPanel.setLayout(new GridLayout(2, false));
        searchPanel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        Label searchLabel = new Label(searchPanel, SWT.NONE);
        searchLabel.setText("Поиск объекта:");

        searchText = new Text(searchPanel, SWT.BORDER);
        searchText.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
        searchText.setMessage("Введите имя объекта...");
        searchText.addListener(SWT.DefaultSelection, e -> searchInGraph());

        // Browser for graph visualization
        try {
            browser = new Browser(container, SWT.BORDER);
            browser.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));
            
            // Initial content
            loadWelcomePage();
            
        } catch (Exception e) {
            Label errorLabel = new Label(container, SWT.NONE);
            errorLabel.setText("Browser not available: " + e.getMessage());
            errorLabel.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));
        }
    }

    private void loadWelcomePage() {
        String html = generateWelcomeHTML();
        browser.setText(html);
    }

    private void loadGraph() {
        browser.setText(generateLoadingHTML());

        new Thread(() -> {
            try {
                String config = configCombo.getText();
                String objectType = objectTypeCombo.getText();
                
                // Get data from backend
                JsonObject result = backend.getObjects(
                    config,
                    objectType.equals("Все") ? null : objectType
                );

                // Generate graph HTML
                String html = generateGraphHTML(config, result);

                Display.getDefault().asyncExec(() -> {
                    browser.setText(html);
                });

            } catch (Exception e) {
                Display.getDefault().asyncExec(() -> {
                    browser.setText(generateErrorHTML(e.getMessage()));
                });
            }
        }).start();
    }

    private void searchInGraph() {
        String query = searchText.getText().trim();
        if (query.isEmpty()) {
            return;
        }

        browser.setText(generateLoadingHTML());

        new Thread(() -> {
            try {
                String config = configCombo.getText();
                
                JsonObject result = backend.searchMetadata(query, config);
                String html = generateSearchResultsHTML(query, result);

                Display.getDefault().asyncExec(() -> {
                    browser.setText(html);
                });

            } catch (Exception e) {
                Display.getDefault().asyncExec(() -> {
                    browser.setText(generateErrorHTML(e.getMessage()));
                });
            }
        }).start();
    }

    private String generateWelcomeHTML() {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
               "<style>" +
               "body { font-family: Arial; padding: 20px; background: #f5f5f5; }" +
               "h1 { color: #0066cc; }" +
               ".info { background: white; padding: 15px; border-radius: 5px; margin: 10px 0; }" +
               "</style></head><body>" +
               "<h1>📊 Metadata Graph</h1>" +
               "<div class='info'>" +
               "<p>Граф метаданных вашей конфигурации 1С из Neo4j.</p>" +
               "<p><strong>Инструкции:</strong></p>" +
               "<ol>" +
               "<li>Выберите конфигурацию</li>" +
               "<li>Выберите тип объекта (опционально)</li>" +
               "<li>Нажмите 'Показать граф'</li>" +
               "</ol>" +
               "<p>Или используйте поиск для нахождения конкретного объекта.</p>" +
               "</div>" +
               "<div class='info'>" +
               "<p><strong>Статус backend:</strong> " + 
               (backend.testConnection() ? "✅ Подключено" : "❌ Не подключено") +
               "</p>" +
               "<p>Убедитесь что запущены:</p>" +
               "<ul>" +
               "<li>Graph API: http://localhost:8080</li>" +
               "<li>MCP Server: http://localhost:6001</li>" +
               "</ul>" +
               "</div>" +
               "</body></html>";
    }

    private String generateLoadingHTML() {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
               "<style>" +
               "body { font-family: Arial; padding: 20px; text-align: center; }" +
               ".spinner { border: 4px solid #f3f3f3; border-top: 4px solid #0066cc; " +
               "border-radius: 50%; width: 40px; height: 40px; " +
               "animation: spin 1s linear infinite; margin: 20px auto; }" +
               "@keyframes spin { 0% { transform: rotate(0deg); } " +
               "100% { transform: rotate(360deg); } }" +
               "</style></head><body>" +
               "<h2>Загрузка данных...</h2>" +
               "<div class='spinner'></div>" +
               "</body></html>";
    }

    private String generateErrorHTML(String error) {
        return "<!DOCTYPE html><html><head><meta charset='UTF-8'>" +
               "<style>" +
               "body { font-family: Arial; padding: 20px; }" +
               ".error { background: #fee; border: 1px solid #fcc; padding: 15px; " +
               "border-radius: 5px; color: #c00; }" +
               "</style></head><body>" +
               "<div class='error'>" +
               "<h2>❌ Ошибка</h2>" +
               "<p>" + error + "</p>" +
               "<p><strong>Проверьте:</strong></p>" +
               "<ul>" +
               "<li>Graph API запущен (port 8080)</li>" +
               "<li>Neo4j запущен (port 7474)</li>" +
               "<li>Данные мигрированы в Neo4j</li>" +
               "</ul>" +
               "</div></body></html>";
    }

    private String generateGraphHTML(String config, JsonObject data) {
        // Simple table view for now
        // TODO: Add real graph visualization (D3.js, vis.js)
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial; padding: 20px; }");
        html.append("table { width: 100%; border-collapse: collapse; background: white; }");
        html.append("th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }");
        html.append("th { background: #0066cc; color: white; }");
        html.append("tr:hover { background: #f5f5f5; }");
        html.append("</style></head><body>");
        html.append("<h2>Объекты конфигурации: ").append(config).append("</h2>");
        
        if (data != null && data.has("objects")) {
            html.append("<table>");
            html.append("<tr><th>Тип</th><th>Имя</th><th>Описание</th></tr>");
            
            // Parse objects array
            data.getAsJsonArray("objects").forEach(element -> {
                JsonObject obj = element.getAsJsonObject();
                html.append("<tr>");
                html.append("<td>").append(obj.get("type").getAsString()).append("</td>");
                html.append("<td><strong>").append(obj.get("name").getAsString()).append("</strong></td>");
                html.append("<td>").append(
                    obj.has("description") ? obj.get("description").getAsString() : ""
                ).append("</td>");
                html.append("</tr>");
            });
            
            html.append("</table>");
        } else {
            html.append("<p>Нет данных</p>");
        }
        
        html.append("</body></html>");
        return html.toString();
    }

    private String generateSearchResultsHTML(String query, JsonObject result) {
        // Similar to graph HTML but for search results
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'>");
        html.append("<style>");
        html.append("body { font-family: Arial; padding: 20px; }");
        html.append(".result { background: white; padding: 15px; margin: 10px 0; ");
        html.append("border-radius: 5px; border-left: 4px solid #0066cc; }");
        html.append("</style></head><body>");
        html.append("<h2>Результаты поиска: ").append(query).append("</h2>");
        
        if (result != null && result.has("result")) {
            JsonObject resultData = result.getAsJsonObject("result");
            html.append("<div class='result'>");
            html.append("<pre>").append(resultData.toString()).append("</pre>");
            html.append("</div>");
        } else {
            html.append("<p>Ничего не найдено</p>");
        }
        
        html.append("</body></html>");
        return html.toString();
    }

    @Override
    public void setFocus() {
        if (searchText != null && !searchText.isDisposed()) {
            searchText.setFocus();
        }
    }
}







