package com.onecai.edt.views;

import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.ui.part.ViewPart;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.onecai.edt.services.BackendConnector;

/**
 * Semantic Search View - Search code by meaning using Qdrant
 */
public class SemanticSearchView extends ViewPart {

    public static final String ID = "com.1cai.edt.views.SemanticSearch";

    private Text searchText;
    private Combo configCombo;
    private Spinner limitSpinner;
    private Table resultsTable;
    private Text codePreviewText;
    private BackendConnector backend;

    @Override
    public void createPartControl(Composite parent) {
        backend = new BackendConnector();
        
        Composite container = new Composite(parent, SWT.NONE);
        GridLayout layout = new GridLayout(1, false);
        container.setLayout(layout);

        // Title
        Label titleLabel = new Label(container, SWT.NONE);
        titleLabel.setText("🔍 Семантический поиск кода");
        titleLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Search panel
        Composite searchPanel = new Composite(container, SWT.NONE);
        searchPanel.setLayout(new GridLayout(6, false));
        searchPanel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Search input
        Label searchLabel = new Label(searchPanel, SWT.NONE);
        searchLabel.setText("Описание:");

        searchText = new Text(searchPanel, SWT.BORDER);
        GridData searchData = new GridData(SWT.FILL, SWT.CENTER, true, false);
        searchData.horizontalSpan = 2;
        searchText.setLayoutData(searchData);
        searchText.setMessage("Например: функция для расчета НДС");
        searchText.addListener(SWT.DefaultSelection, e -> performSearch());

        // Configuration filter
        Label configLabel = new Label(searchPanel, SWT.NONE);
        configLabel.setText("Конфиг:");

        configCombo = new Combo(searchPanel, SWT.DROP_DOWN | SWT.READ_ONLY);
        configCombo.setItems(new String[] {"Все", "DO", "ERP", "ZUP", "BUH"});
        configCombo.select(0);

        // Limit
        Label limitLabel = new Label(searchPanel, SWT.NONE);
        limitLabel.setText("Результатов:");

        limitSpinner = new Spinner(searchPanel, SWT.BORDER);
        limitSpinner.setMinimum(1);
        limitSpinner.setMaximum(50);
        limitSpinner.setSelection(10);

        // Search button
        Composite buttonPanel = new Composite(container, SWT.NONE);
        buttonPanel.setLayout(new GridLayout(1, false));
        buttonPanel.setLayoutData(new GridData(SWT.RIGHT, SWT.CENTER, false, false));

        Button searchButton = new Button(buttonPanel, SWT.PUSH);
        searchButton.setText("Искать");
        GridData buttonData = new GridData();
        buttonData.widthHint = 100;
        searchButton.setLayoutData(buttonData);
        searchButton.addListener(SWT.Selection, e -> performSearch());

        // Results table
        Label resultsLabel = new Label(container, SWT.NONE);
        resultsLabel.setText("Результаты:");

        resultsTable = new Table(container, SWT.BORDER | SWT.FULL_SELECTION);
        resultsTable.setHeaderVisible(true);
        resultsTable.setLinesVisible(true);
        GridData tableData = new GridData(SWT.FILL, SWT.FILL, true, true);
        tableData.heightHint = 200;
        resultsTable.setLayoutData(tableData);

        // Table columns
        String[] columnNames = {"Similarity", "Функция", "Модуль", "Конфигурация"};
        int[] columnWidths = {80, 200, 250, 100};

        for (int i = 0; i < columnNames.length; i++) {
            TableColumn column = new TableColumn(resultsTable, SWT.NONE);
            column.setText(columnNames[i]);
            column.setWidth(columnWidths[i]);
        }

        // Selection listener
        resultsTable.addListener(SWT.Selection, e -> showCodePreview());

        // Code preview
        Label previewLabel = new Label(container, SWT.NONE);
        previewLabel.setText("Предварительный просмотр:");

        codePreviewText = new Text(container, 
            SWT.BORDER | SWT.MULTI | SWT.READ_ONLY | SWT.V_SCROLL | SWT.H_SCROLL);
        GridData previewData = new GridData(SWT.FILL, SWT.FILL, true, true);
        previewData.heightHint = 150;
        codePreviewText.setLayoutData(previewData);
        codePreviewText.setFont(
            new org.eclipse.swt.graphics.Font(
                parent.getDisplay(), "Courier New", 9, SWT.NORMAL
            )
        );
    }

    private void performSearch() {
        String query = searchText.getText().trim();

        if (query.isEmpty()) {
            MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_WARNING);
            msg.setText("Внимание");
            msg.setMessage("Введите описание для поиска");
            msg.open();
            return;
        }

        // Clear previous results
        resultsTable.removeAll();
        codePreviewText.setText("");

        new Thread(() -> {
            try {
                String config = configCombo.getText();
                int limit = limitSpinner.getSelection();

                // Call backend
                JsonObject result = backend.searchCodeSemantic(
                    query,
                    config.equals("Все") ? null : config,
                    limit
                );

                // Update UI
                Display.getDefault().asyncExec(() -> {
                    if (result != null && result.has("results")) {
                        JsonArray results = result.getAsJsonArray("results");
                        
                        for (JsonElement elem : results) {
                            JsonObject item = elem.getAsJsonObject();
                            JsonObject payload = item.getAsJsonObject("payload");
                            
                            TableItem tableItem = new TableItem(resultsTable, SWT.NONE);
                            tableItem.setText(0, String.format("%.2f%%", 
                                item.get("score").getAsDouble() * 100));
                            tableItem.setText(1, payload.get("name").getAsString());
                            tableItem.setText(2, payload.get("module").getAsString());
                            tableItem.setText(3, payload.get("configuration").getAsString());
                            tableItem.setData(payload);
                        }
                        
                        if (results.size() == 0) {
                            MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_INFORMATION);
                            msg.setText("Поиск");
                            msg.setMessage("Ничего не найдено. Попробуйте изменить запрос.");
                            msg.open();
                        }
                    }
                });

            } catch (Exception e) {
                Display.getDefault().asyncExec(() -> {
                    MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_ERROR);
                    msg.setText("Ошибка");
                    msg.setMessage("Ошибка поиска: " + e.getMessage());
                    msg.open();
                });
            }
        }).start();
    }

    private void showCodePreview() {
        TableItem[] selection = resultsTable.getSelection();
        if (selection.length > 0) {
            JsonObject payload = (JsonObject) selection[0].getData();
            
            if (payload.has("code_preview")) {
                String code = payload.get("code_preview").getAsString();
                codePreviewText.setText(code);
            } else {
                codePreviewText.setText("Код недоступен для предпросмотра");
            }
        }
    }

    private String generateErrorHTML(String error) {
        return "<!DOCTYPE html><html><body>" +
               "<h2 style='color: red;'>Ошибка</h2>" +
               "<p>" + error + "</p>" +
               "</body></html>";
    }

    @Override
    public void setFocus() {
        searchText.setFocus();
    }
}







