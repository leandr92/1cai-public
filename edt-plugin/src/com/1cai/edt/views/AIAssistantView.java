package com.onecai.edt.views;

import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.ui.part.ViewPart;

/**
 * AI Assistant View - Main chat interface with AI
 */
public class AIAssistantView extends ViewPart {

    public static final String ID = "com.1cai.edt.views.AIAssistant";

    private Text inputText;
    private Text outputText;
    private Button askButton;
    private Combo configCombo;

    @Override
    public void createPartControl(Composite parent) {
        // Main container
        Composite container = new Composite(parent, SWT.NONE);
        GridLayout layout = new GridLayout(1, false);
        layout.marginWidth = 10;
        layout.marginHeight = 10;
        container.setLayout(layout);

        // Title
        Label titleLabel = new Label(container, SWT.NONE);
        titleLabel.setText("AI Assistant - спросите о вашей конфигурации 1С");
        titleLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Configuration selector
        Composite configComposite = new Composite(container, SWT.NONE);
        configComposite.setLayout(new GridLayout(2, false));
        configComposite.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        Label configLabel = new Label(configComposite, SWT.NONE);
        configLabel.setText("Конфигурация:");

        configCombo = new Combo(configComposite, SWT.DROP_DOWN | SWT.READ_ONLY);
        configCombo.setItems(new String[] {"Все", "DO", "ERP", "ZUP", "BUH"});
        configCombo.select(0);
        configCombo.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Input area
        Label inputLabel = new Label(container, SWT.NONE);
        inputLabel.setText("Ваш вопрос:");

        inputText = new Text(container, SWT.BORDER | SWT.MULTI | SWT.WRAP | SWT.V_SCROLL);
        GridData inputData = new GridData(SWT.FILL, SWT.FILL, true, false);
        inputData.heightHint = 80;
        inputText.setLayoutData(inputData);
        inputText.setMessage("Например: Найди все функции для расчета НДС");

        // Ask button
        askButton = new Button(container, SWT.PUSH);
        askButton.setText("Спросить AI");
        GridData buttonData = new GridData(SWT.RIGHT, SWT.CENTER, false, false);
        buttonData.widthHint = 120;
        askButton.setLayoutData(buttonData);
        askButton.addListener(SWT.Selection, e -> askAI());

        // Output area
        Label outputLabel = new Label(container, SWT.NONE);
        outputLabel.setText("Ответ:");

        outputText = new Text(container, SWT.BORDER | SWT.MULTI | SWT.WRAP | SWT.V_SCROLL | SWT.READ_ONLY);
        GridData outputData = new GridData(SWT.FILL, SWT.FILL, true, true);
        outputData.heightHint = 300;
        outputText.setLayoutData(outputData);
        outputText.setBackground(parent.getDisplay().getSystemColor(SWT.COLOR_WHITE));

        // Status bar
        Label statusLabel = new Label(container, SWT.NONE);
        statusLabel.setText("Status: Ready");
        statusLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
    }

    private void askAI() {
        String question = inputText.getText().trim();

        if (question.isEmpty()) {
            outputText.setText("Пожалуйста, введите вопрос.");
            return;
        }

        // Disable button while processing
        askButton.setEnabled(false);
        outputText.setText("Обработка запроса...");

        // TODO: Call MCP Server API
        // For now, show placeholder
        new Thread(() -> {
            try {
                Thread.sleep(1000); // Simulate API call

                Display.getDefault().asyncExec(() -> {
                    String response = generateResponse(question);
                    outputText.setText(response);
                    askButton.setEnabled(true);
                });
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }).start();
    }

    private String generateResponse(String question) {
        // TODO: Real API call to MCP Server
        return String.format(
            "Вопрос: %s\n\n" +
            "Ответ будет сгенерирован AI Orchestrator.\n\n" +
            "Функциональность будет реализована после:\n" +
            "1. Запуска MCP Server (src/ai/mcp_server.py)\n" +
            "2. Интеграции с Neo4j, Qdrant\n" +
            "3. Настройки Qwen3-Coder\n\n" +
            "Текущая конфигурация: %s",
            question,
            configCombo.getText()
        );
    }

    @Override
    public void setFocus() {
        inputText.setFocus();
    }
}





