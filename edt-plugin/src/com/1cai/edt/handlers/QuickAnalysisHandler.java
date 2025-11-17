package com.onecai.edt.handlers;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;
import org.eclipse.jface.dialogs.MessageDialog;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.IWorkbenchPart;
import org.eclipse.ui.IWorkbenchWindow;
import org.eclipse.ui.handlers.HandlerUtil;

import com.onecai.edt.actions.QuickAnalysisAction;

public class QuickAnalysisHandler extends AbstractHandler {

    @Override
    public Object execute(ExecutionEvent event) throws ExecutionException {
        IWorkbenchWindow window = HandlerUtil.getActiveWorkbenchWindow(event);
        if (window == null) {
            throw new ExecutionException("No active workbench window");
        }

        IWorkbenchPage page = window.getActivePage();
        if (page == null) {
            return null;
        }

        IWorkbenchPart activePart = HandlerUtil.getActivePart(event);
        if (activePart == null) {
            activePart = page.getActivePart();
        }

        if (activePart == null) {
            throw new ExecutionException("No active part for quick analysis");
        }

        ISelection selection = HandlerUtil.getCurrentSelection(event);
        if (selection == null && activePart.getSite() != null &&
            activePart.getSite().getSelectionProvider() != null) {
            selection = activePart.getSite().getSelectionProvider().getSelection();
        }

        if (selection == null) {
            Shell shell = window.getShell();
            MessageDialog.openInformation(
                shell,
                "Quick Analysis",
                "Выделите функцию в редакторе и повторите команду (Ctrl+Alt+Q)."
            );
            return null;
        }

        QuickAnalysisAction delegate = new QuickAnalysisAction();
        delegate.setActivePart(null, activePart);
        delegate.selectionChanged(null, selection);
        delegate.run(null);

        return null;
    }
}

