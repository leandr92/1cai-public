package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;

import com.onecai.edt.services.OrchestratorRunner;

/**
 * Re-runs the best practices analysis without full parsing.
 */
public class UpdateBestPracticesAction extends AbstractOrchestratorAction {

    @Override
    public void run(IAction action) {
        String configName = askForConfiguration("Update Best Practices", "ERPCPM");
        if (configName == null) {
            return;
        }

        notifyUser(
            "Обновление best practices",
            "Пересчет метрик best practices для конфигурации \"" + configName + "\" запущен."
        );

        OrchestratorRunner.updateBestPractices(configName, () -> {
            refreshDashboard();
            notifyUser(
                "Best practices обновлены",
                "Данные отчета best practices для \"" + configName + "\" обновлены."
            );
        });
    }
}

