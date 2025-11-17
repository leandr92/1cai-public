package com.onecai.edt.views;

import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.SashForm;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.ui.part.ViewPart;
import org.eclipse.jface.text.ITextSelection;
import org.eclipse.ui.IEditorPart;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.texteditor.ITextEditor;

import com.google.gson.JsonObject;
import com.onecai.edt.services.BackendConnector;

/**
 * Code Optimizer View - Optimize BSL code using AI
 */
public class CodeOptimizerView extends ViewPart {

    public static final String ID = "com.1cai.edt.views.CodeOptimizer";

    private Text originalCodeText;
    private Text optimizedCodeText;
    private Text explanationText;
    private Button analyzeButton;
    private Button applyButton;
    private Label statusLabel;
    private BackendConnector backend;

    @Override
    public void createPartControl(Composite parent) {
        backend = new BackendConnector();
        
        Composite container = new Composite(parent, SWT.NONE);
        GridLayout layout = new GridLayout(1, false);
        container.setLayout(layout);

        // Title
        Label titleLabel = new Label(container, SWT.NONE);
        titleLabel.setText("⚡ Code Optimizer - Оптимизация кода с помощью AI");
        titleLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Control panel
        Composite controlPanel = new Composite(container, SWT.NONE);
        controlPanel.setLayout(new GridLayout(3, false));
        controlPanel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        Button loadFromEditorButton = new Button(controlPanel, SWT.PUSH);
        loadFromEditorButton.setText("📄 Загрузить из редактора");
        loadFromEditorButton.addListener(SWT.Selection, e -> loadCodeFromEditor());

        analyzeButton = new Button(controlPanel, SWT.PUSH);
        analyzeButton.setText("🤖 Анализировать и оптимизировать");
        analyzeButton.addListener(SWT.Selection, e -> optimizeCode());

        applyButton = new Button(controlPanel, SWT.PUSH);
        applyButton.setText("✅ Применить оптимизации");
        applyButton.setEnabled(false);
        applyButton.addListener(SWT.Selection, e -> applyOptimizations());

        // Main content area - SashForm for resizable panels
        SashForm mainSash = new SashForm(container, SWT.HORIZONTAL);
        mainSash.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));

        // Left panel - Original code
        Composite leftPanel = new Composite(mainSash, SWT.NONE);
        leftPanel.setLayout(new GridLayout(1, false));

        Label originalLabel = new Label(leftPanel, SWT.NONE);
        originalLabel.setText("Исходный код:");

        originalCodeText = new Text(leftPanel, 
            SWT.BORDER | SWT.MULTI | SWT.V_SCROLL | SWT.H_SCROLL);
        originalCodeText.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));
        originalCodeText.setFont(
            new org.eclipse.swt.graphics.Font(
                parent.getDisplay(), "Courier New", 9, SWT.NORMAL
            )
        );

        // Right panel - Optimized code
        Composite rightPanel = new Composite(mainSash, SWT.NONE);
        rightPanel.setLayout(new GridLayout(1, false));

        Label optimizedLabel = new Label(rightPanel, SWT.NONE);
        optimizedLabel.setText("Оптимизированный код:");

        optimizedCodeText = new Text(rightPanel, 
            SWT.BORDER | SWT.MULTI | SWT.READ_ONLY | SWT.V_SCROLL | SWT.H_SCROLL);
        optimizedCodeText.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));
        optimizedCodeText.setFont(
            new org.eclipse.swt.graphics.Font(
                parent.getDisplay(), "Courier New", 9, SWT.NORMAL
            )
        );
        optimizedCodeText.setBackground(
            parent.getDisplay().getSystemColor(SWT.COLOR_INFO_BACKGROUND)
        );

        mainSash.setWeights(new int[] {50, 50});

        // Explanation panel
        Label explanationLabel = new Label(container, SWT.NONE);
        explanationLabel.setText("💡 Объяснение изменений:");

        explanationText = new Text(container, 
            SWT.BORDER | SWT.MULTI | SWT.READ_ONLY | SWT.WRAP | SWT.V_SCROLL);
        GridData explData = new GridData(SWT.FILL, SWT.FILL, true, false);
        explData.heightHint = 100;
        explanationText.setLayoutData(explData);

        // Status bar
        statusLabel = new Label(container, SWT.NONE);
        statusLabel.setText("Status: Ready");
        statusLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
    }

    private void loadCodeFromEditor() {
        try {
            IWorkbenchPage page = getSite().getWorkbenchWindow().getActivePage();
            IEditorPart activeEditor = page.getActiveEditor();

            if (activeEditor instanceof ITextEditor) {
                ITextEditor textEditor = (ITextEditor) activeEditor;
                ITextSelection selection = (ITextSelection) textEditor
                    .getSelectionProvider().getSelection();

                if (selection != null && !selection.isEmpty()) {
                    // Load selected text
                    originalCodeText.setText(selection.getText());
                    statusLabel.setText("Status: Loaded selection from editor");
                } else {
                    MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_INFORMATION);
                    msg.setText("Информация");
                    msg.setMessage("Выделите код в редакторе для анализа");
                    msg.open();
                }
            }
        } catch (Exception e) {
            showError("Ошибка загрузки кода: " + e.getMessage());
        }
    }

    private void optimizeCode() {
        String code = originalCodeText.getText().trim();

        if (code.isEmpty()) {
            MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_WARNING);
            msg.setText("Внимание");
            msg.setMessage("Введите код для оптимизации");
            msg.open();
            return;
        }

        // Disable buttons during processing
        analyzeButton.setEnabled(false);
        statusLabel.setText("Status: Анализирую код...");

        new Thread(() -> {
            try {
                // Call AI for optimization
                JsonObject request = new JsonObject();
                request.addProperty("description", 
                    "Оптимизируй этот BSL код: " + code.substring(0, Math.min(500, code.length())));
                
                String config = configCombo.getText();
                if (!config.equals("Все")) {
                    JsonObject context = new JsonObject();
                    context.addProperty("configuration", config);
                    request.add("context", context);
                }

                JsonObject result = backend.generateBSLCode(
                    "Оптимизируй код:\n" + code,
                    null
                );

                Display.getDefault().asyncExec(() -> {
                    if (result != null) {
                        // Parse result
                        String optimizedCode = parseOptimizedCode(result, code);
                        String explanation = parseExplanation(result);

                        optimizedCodeText.setText(optimizedCode);
                        explanationText.setText(explanation);
                        
                        applyButton.setEnabled(true);
                        statusLabel.setText("Status: ✓ Анализ завершен");
                    } else {
                        showError("Не удалось получить ответ от AI");
                    }
                    
                    analyzeButton.setEnabled(true);
                });

            } catch (Exception e) {
                Display.getDefault().asyncExec(() -> {
                    showError("Ошибка оптимизации: " + e.getMessage());
                    analyzeButton.setEnabled(true);
                });
            }
        }).start();
    }

    private String parseOptimizedCode(JsonObject result, String original) {
        // TODO: Parse real AI response
        // For now, return placeholder
        
        if (result.has("result") && result.getAsJsonObject("result").has("response")) {
            return result.getAsJsonObject("result").get("response").getAsString();
        }
        
        return "// Оптимизированный код будет здесь\n" +
               "// После полной интеграции с Qwen3-Coder\n\n" +
               original;
    }

    private String parseExplanation(JsonObject result) {
        // TODO: Parse real AI explanation
        return "Функциональность оптимизации будет доступна после:\n" +
               "1. Запуска Ollama с моделью Qwen3-Coder\n" +
               "2. Интеграции с AI Orchestrator\n" +
               "3. Реализации response parsing\n\n" +
               "Текущий ответ от backend:\n" +
               (result != null ? result.toString() : "Нет ответа");
    }

    private void applyOptimizations() {
        String optimizedCode = optimizedCodeText.getText();

        if (optimizedCode.isEmpty()) {
            return;
        }

        // TODO: Insert optimized code back to editor
        MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_INFORMATION);
        msg.setText("Применение изменений");
        msg.setMessage(
            "Функция применения оптимизаций будет реализована в следующей версии.\n\n" +
            "Пока скопируйте код вручную из правой панели."
        );
        msg.open();
    }

    private void showError(String message) {
        MessageBox msg = new MessageBox(getSite().getShell(), SWT.ICON_ERROR);
        msg.setText("Ошибка");
        msg.setMessage(message);
        msg.open();
        
        statusLabel.setText("Status: ✗ Ошибка");
    }

    @Override
    public void setFocus() {
        originalCodeText.setFocus();
    }
}







