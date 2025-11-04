package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.ui.IObjectActionDelegate;
import org.eclipse.ui.IWorkbenchPart;

import com.google.gson.JsonObject;
import com.onecai.edt.services.BackendConnector;

/**
 * Context menu action: Optimize Function
 */
public class OptimizeFunctionAction implements IObjectActionDelegate {

    private IWorkbenchPart targetPart;
    private Object selectedElement;

    @Override
    public void setActivePart(IAction action, IWorkbenchPart targetPart) {
        this.targetPart = targetPart;
    }

    @Override
    public void run(IAction action) {
        if (selectedElement == null) {
            MessageDialog.openWarning(
                targetPart.getSite().getShell(),
                "Optimize Function",
                "No function selected"
            );
            return;
        }

        // TODO: Get function code from BSL model
        String functionCode = extractFunctionCode(selectedElement);

        if (functionCode == null || functionCode.isEmpty()) {
            MessageDialog.openWarning(
                targetPart.getSite().getShell(),
                "Optimize Function",
                "Could not extract function code"
            );
            return;
        }

        optimizeFunction(functionCode);
    }

    @Override
    public void selectionChanged(IAction action, ISelection selection) {
        selectedElement = selection;
    }

    private void optimizeFunction(String code) {
        BackendConnector backend = new BackendConnector();

        MessageDialog.openInformation(
            targetPart.getSite().getShell(),
            "Optimize Function",
            "Optimizing function with AI...\n\n" +
            "Code length: " + code.length() + " characters"
        );

        new Thread(() -> {
            try {
                // Call AI for optimization
                JsonObject result = backend.generateBSLCode(
                    "Оптимизируй эту функцию:\n" + code,
                    null
                );

                Display.getDefault().asyncExec(() -> {
                    if (result != null) {
                        showOptimizationResult(result);
                    } else {
                        MessageDialog.openError(
                            targetPart.getSite().getShell(),
                            "Error",
                            "Optimization failed. Check backend connection."
                        );
                    }
                });

            } catch (Exception e) {
                Display.getDefault().asyncExec(() -> {
                    MessageDialog.openError(
                        targetPart.getSite().getShell(),
                        "Error",
                        "Optimization error: " + e.getMessage()
                    );
                });
            }
        }).start();
    }

    private void showOptimizationResult(JsonObject result) {
        MessageDialog.openInformation(
            targetPart.getSite().getShell(),
            "Optimization Result",
            "Результат оптимизации:\n\n" +
            (result.has("result") ? result.getAsJsonObject("result").toString() : "No result") +
            "\n\nОткройте Code Optimizer view для детального просмотра"
        );
    }

    private String extractFunctionCode(Object element) {
        // TODO: Extract code from BSL Method model
        return "// Placeholder code\nФункция Test()\n  // TODO\nКонецФункции";
    }
}





