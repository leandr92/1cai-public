package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;

import com.onecai.edt.services.OrchestratorRunner;

/**
 * Launches dependency refresh workflow (graph generation only).
 */
public class RefreshDependenciesAction extends AbstractOrchestratorAction {

    @Override
    public void run(IAction action) {
        String configName = askForConfiguration("Refresh Dependencies", "ERPCPM");
        if (configName == null) {
            return;
        }

        notifyUser(
            "Обновление зависимостей",
            "Генерация графа зависимостей для \"" + configName + "\" запущена."
        );

        OrchestratorRunner.refreshDependencies(configName, () -> {
            refreshDashboard();
            notifyUser(
                "Граф зависимостей обновлен",
                "Новые данные зависимостей для \"" + configName + "\" доступны в дашборде."
            );
        });
    }
}

