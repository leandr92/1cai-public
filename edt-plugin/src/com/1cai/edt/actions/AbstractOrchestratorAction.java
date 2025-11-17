package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;
import org.eclipse.jface.dialogs.InputDialog;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.jface.window.Window;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.IWorkbenchWindow;
import org.eclipse.ui.IWorkbenchWindowActionDelegate;
import org.eclipse.ui.PartInitException;

import com.onecai.edt.views.AnalysisDashboardView;

/**
 * Base helper for actions that launch the EDT orchestrator.
 */
public abstract class AbstractOrchestratorAction implements IWorkbenchWindowActionDelegate {

    protected IWorkbenchWindow window;

    @Override
    public void init(IWorkbenchWindow window) {
        this.window = window;
    }

    @Override
    public void dispose() {
        // nothing to cleanup
    }

    @Override
    public void selectionChanged(IAction action, ISelection selection) {
        // not used for menu actions
    }

    protected Shell getShell() {
        if (window != null && window.getShell() != null) {
            return window.getShell();
        }
        return Display.getDefault().getActiveShell();
    }

    protected String askForConfiguration(String title, String initialValue) {
        InputDialog dialog = new InputDialog(
            getShell(),
            title,
            "Enter configuration name:",
            initialValue,
            value -> (value == null || value.trim().isEmpty())
                ? "Configuration name cannot be empty"
                : null
        );

        if (dialog.open() == Window.OK) {
            return dialog.getValue().trim();
        }
        return null;
    }

    protected void notifyUser(String title, String message) {
        MessageDialog.openInformation(getShell(), title, message);
    }

    protected void showError(String title, String message) {
        MessageDialog.openError(getShell(), title, message);
    }

    protected void refreshDashboard() {
        Display.getDefault().asyncExec(() -> {
            if (window == null) {
                return;
            }
            IWorkbenchPage page = window.getActivePage();
            if (page == null) {
                return;
            }
            try {
                AnalysisDashboardView view = (AnalysisDashboardView) page.findView(AnalysisDashboardView.ID);
                if (view == null) {
                    view = (AnalysisDashboardView) page.showView(AnalysisDashboardView.ID);
                }
                if (view != null) {
                    view.refresh();
                }
            } catch (PartInitException e) {
                showError("Analysis Dashboard", "Failed to open Analysis Dashboard: " + e.getMessage());
            }
        });
    }

    protected void openView(String viewId) {
        if (window == null) {
            return;
        }
        Display.getDefault().asyncExec(() -> {
            try {
                IWorkbenchPage page = window.getActivePage();
                if (page != null) {
                    page.showView(viewId);
                }
            } catch (PartInitException e) {
                showError("Open View", "Unable to open view: " + e.getMessage());
            }
        });
    }
}

