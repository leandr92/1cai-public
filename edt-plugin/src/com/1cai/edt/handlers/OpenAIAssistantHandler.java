package com.onecai.edt.handlers;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.IWorkbenchWindow;
import org.eclipse.ui.PartInitException;
import org.eclipse.ui.handlers.HandlerUtil;

import com.onecai.edt.views.AIAssistantView;

public class OpenAIAssistantHandler extends AbstractHandler {

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

        try {
            page.showView(AIAssistantView.ID);
        } catch (PartInitException e) {
            throw new ExecutionException("Unable to open AI Assistant view", e);
        }

        return null;
    }
}

