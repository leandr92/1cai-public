package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;

import com.onecai.edt.views.CodeOptimizerView;

/**
 * Opens the AI code generation / optimization view.
 */
public class GenerateCodeAction extends AbstractOrchestratorAction {

    @Override
    public void run(IAction action) {
        openView(CodeOptimizerView.ID);
        notifyUser(
            "Генерация кода",
            "Открылся модуль AI-оптимизации кода. Выберите шаблон и используйте панель для генерации BSL."
        );
    }
}

