package com.onecai.edt.preferences;

import org.eclipse.jface.preference.PreferencePage;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.*;
import org.eclipse.swt.widgets.*;
import org.eclipse.ui.IWorkbench;
import org.eclipse.ui.IWorkbenchPreferencePage;

import com.onecai.edt.Activator;
import com.onecai.edt.services.BackendConnector;

/**
 * Connection settings preference page
 */
public class ConnectionPreferencePage extends PreferencePage implements IWorkbenchPreferencePage {

    public static final String PREF_MCP_URL = "ai.backend.mcp.url";
    public static final String PREF_API_URL = "ai.backend.api.url";

    private Text mcpUrlText;
    private Text apiUrlText;
    private Label statusLabel;

    @Override
    public void init(IWorkbench workbench) {
        setPreferenceStore(Activator.getDefault().getPreferenceStore());
        setDescription("Настройки подключения к backend сервисам");
    }

    @Override
    protected Control createContents(Composite parent) {
        Composite composite = new Composite(parent, SWT.NONE);
        GridLayout layout = new GridLayout(2, false);
        composite.setLayout(layout);

        // MCP Server URL
        Label mcpLabel = new Label(composite, SWT.NONE);
        mcpLabel.setText("MCP Server URL:");

        mcpUrlText = new Text(composite, SWT.BORDER);
        mcpUrlText.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
        mcpUrlText.setText(
            getPreferenceStore().getString(PREF_MCP_URL).isEmpty() 
            ? "http://localhost:6001"
            : getPreferenceStore().getString(PREF_MCP_URL)
        );

        // Graph API URL
        Label apiLabel = new Label(composite, SWT.NONE);
        apiLabel.setText("Graph API URL:");

        apiUrlText = new Text(composite, SWT.BORDER);
        apiUrlText.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));
        apiUrlText.setText(
            getPreferenceStore().getString(PREF_API_URL).isEmpty()
            ? "http://localhost:8080"
            : getPreferenceStore().getString(PREF_API_URL)
        );

        // Test connection button
        Composite buttonPanel = new Composite(composite, SWT.NONE);
        GridData buttonData = new GridData(SWT.RIGHT, SWT.CENTER, false, false);
        buttonData.horizontalSpan = 2;
        buttonPanel.setLayoutData(buttonData);
        buttonPanel.setLayout(new GridLayout(1, false));

        Button testButton = new Button(buttonPanel, SWT.PUSH);
        testButton.setText("Test Connection");
        GridData testButtonData = new GridData();
        testButtonData.widthHint = 120;
        testButton.setLayoutData(testButtonData);
        testButton.addListener(SWT.Selection, e -> testConnection());

        // Status
        Label statusTitleLabel = new Label(composite, SWT.NONE);
        statusTitleLabel.setText("Status:");

        statusLabel = new Label(composite, SWT.NONE);
        statusLabel.setText("Not tested");
        statusLabel.setLayoutData(new GridData(SWT.FILL, SWT.CENTER, true, false));

        // Info
        Label separator = new Label(composite, SWT.SEPARATOR | SWT.HORIZONTAL);
        GridData sepData = new GridData(SWT.FILL, SWT.CENTER, true, false);
        sepData.horizontalSpan = 2;
        separator.setLayoutData(sepData);

        Label infoLabel = new Label(composite, SWT.WRAP);
        GridData infoData = new GridData(SWT.FILL, SWT.FILL, true, true);
        infoData.horizontalSpan = 2;
        infoData.widthHint = 400;
        infoLabel.setLayoutData(infoData);
        infoLabel.setText(
            "Backend сервисы должны быть запущены для работы AI Assistant.\n\n" +
            "Запуск backend:\n" +
            "1. docker-compose -f docker-compose.yml -f docker-compose.stage1.yml up -d\n" +
            "2. python -m uvicorn src.api.graph_api:app --port 8080\n" +
            "3. python -m uvicorn src.ai.mcp_server:app --port 6001\n\n" +
            "Или см. DEPLOYMENT_INSTRUCTIONS.md для деталей."
        );

        return composite;
    }

    private void testConnection() {
        statusLabel.setText("Testing...");

        new Thread(() -> {
            String mcpUrl = mcpUrlText.getText();
            String apiUrl = apiUrlText.getText();

            BackendConnector backend = new BackendConnector(mcpUrl, apiUrl);
            boolean connected = backend.testConnection();

            Display.getDefault().asyncExec(() -> {
                if (connected) {
                    statusLabel.setText("✅ Connected");
                    statusLabel.setForeground(
                        Display.getDefault().getSystemColor(SWT.COLOR_DARK_GREEN)
                    );

                    MessageDialog.openInformation(
                        getShell(),
                        "Connection Test",
                        "Successfully connected to backend!\n\n" +
                        "API URL: " + apiUrl
                    );
                } else {
                    statusLabel.setText("❌ Connection failed");
                    statusLabel.setForeground(
                        Display.getDefault().getSystemColor(SWT.COLOR_RED)
                    );

                    MessageDialog.openError(
                        getShell(),
                        "Connection Test",
                        "Failed to connect to backend.\n\n" +
                        "Check that services are running:\n" +
                        "• Graph API: " + apiUrl + "\n" +
                        "• MCP Server: " + mcpUrl
                    );
                }
            });
        }).start();
    }

    @Override
    protected void performDefaults() {
        mcpUrlText.setText("http://localhost:6001");
        apiUrlText.setText("http://localhost:8080");
        statusLabel.setText("Not tested");
        statusLabel.setForeground(
            Display.getDefault().getSystemColor(SWT.COLOR_BLACK)
        );
        super.performDefaults();
    }

    @Override
    public boolean performOk() {
        getPreferenceStore().setValue(PREF_MCP_URL, mcpUrlText.getText());
        getPreferenceStore().setValue(PREF_API_URL, apiUrlText.getText());
        return super.performOk();
    }
}





