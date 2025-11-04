package com.onecai.edt.preferences;

import org.eclipse.jface.preference.PreferencePage;
import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.ui.IWorkbench;
import org.eclipse.ui.IWorkbenchPreferencePage;

import com.onecai.edt.Activator;

/**
 * Main preference page for 1C AI Assistant
 */
public class MainPreferencePage extends PreferencePage implements IWorkbenchPreferencePage {

    public static final String PREF_ENABLED = "ai.assistant.enabled";
    public static final String PREF_AUTO_SUGGEST = "ai.assistant.auto.suggest";

    private Button enabledCheckbox;
    private Button autoSuggestCheckbox;

    @Override
    public void init(IWorkbench workbench) {
        setPreferenceStore(Activator.getDefault().getPreferenceStore());
        setDescription("Настройки 1C AI Assistant");
    }

    @Override
    protected Control createContents(Composite parent) {
        Composite composite = new Composite(parent, SWT.NONE);
        GridLayout layout = new GridLayout(1, false);
        composite.setLayout(layout);

        // Title
        Label titleLabel = new Label(composite, SWT.NONE);
        titleLabel.setText("Основные настройки 1C AI Assistant");
        titleLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Separator
        Label separator = new Label(composite, SWT.SEPARATOR | SWT.HORIZONTAL);
        separator.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Enabled checkbox
        enabledCheckbox = new Button(composite, SWT.CHECK);
        enabledCheckbox.setText("Включить AI Assistant");
        enabledCheckbox.setSelection(
            getPreferenceStore().getBoolean(PREF_ENABLED)
        );

        // Auto-suggest checkbox
        autoSuggestCheckbox = new Button(composite, SWT.CHECK);
        autoSuggestCheckbox.setText("Автоматические подсказки при написании кода");
        autoSuggestCheckbox.setSelection(
            getPreferenceStore().getBoolean(PREF_AUTO_SUGGEST)
        );

        // Info section
        Group infoGroup = new Group(composite, SWT.NONE);
        infoGroup.setText("Информация");
        infoGroup.setLayout(new GridLayout(1, false));
        infoGroup.setLayoutData(new GridData(SWT.FILL, SWT.FILL, true, true));

        Label infoLabel = new Label(infoGroup, SWT.WRAP);
        infoLabel.setText(
            "1C AI Assistant интегрирует возможности искусственного интеллекта " +
            "непосредственно в среду разработки EDT.\n\n" +
            "Функции:\n" +
            "• AI Assistant - чат с AI о вашей конфигурации\n" +
            "• Metadata Graph - визуализация графа метаданных\n" +
            "• Semantic Search - семантический поиск кода\n" +
            "• Code Optimizer - автоматическая оптимизация кода\n\n" +
            "Для работы требуется запущенный backend:\n" +
            "• Graph API (port 8080)\n" +
            "• MCP Server (port 6001)"
        );
        GridData infoData = new GridData(SWT.FILL, SWT.FILL, true, true);
        infoData.widthHint = 400;
        infoLabel.setLayoutData(infoData);

        return composite;
    }

    @Override
    protected void performDefaults() {
        enabledCheckbox.setSelection(true);
        autoSuggestCheckbox.setSelection(false);
        super.performDefaults();
    }

    @Override
    public boolean performOk() {
        getPreferenceStore().setValue(PREF_ENABLED, enabledCheckbox.getSelection());
        getPreferenceStore().setValue(PREF_AUTO_SUGGEST, autoSuggestCheckbox.getSelection());
        return super.performOk();
    }
}





