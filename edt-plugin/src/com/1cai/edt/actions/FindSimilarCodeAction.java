package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.ui.IObjectActionDelegate;
import org.eclipse.ui.IWorkbenchPart;
import org.eclipse.ui.PartInitException;

import com.onecai.edt.views.SemanticSearchView;

/**
 * Context menu action: Find Similar Code
 */
public class FindSimilarCodeAction implements IObjectActionDelegate {

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
                "Find Similar Code",
                "No function selected"
            );
            return;
        }

        // Extract function info
        String functionName = extractFunctionName(selectedElement);
        String description = extractFunctionDescription(selectedElement);

        // Open Semantic Search view
        try {
            targetPart.getSite().getWorkbenchWindow().getActivePage()
                .showView(SemanticSearchView.ID);

            // TODO: Set search query in SemanticSearchView
            String query = description != null ? description : functionName;
            
            MessageDialog.openInformation(
                targetPart.getSite().getShell(),
                "Find Similar Code",
                "Searching for code similar to: " + functionName + "\n\n" +
                "Query: " + query + "\n\n" +
                "Results will appear in Semantic Search view"
            );

        } catch (PartInitException e) {
            MessageDialog.openError(
                targetPart.getSite().getShell(),
                "Error",
                "Could not open Semantic Search view: " + e.getMessage()
            );
        }
    }

    @Override
    public void selectionChanged(IAction action, ISelection selection) {
        selectedElement = selection;
    }

    private String extractFunctionName(Object element) {
        // TODO: Extract from BSL Method model
        return "SelectedFunction";
    }

    private String extractFunctionDescription(Object element) {
        // TODO: Extract comments from BSL Method
        return "функция для обработки данных";
    }
}





