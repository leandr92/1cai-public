package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;

import com.onecai.edt.services.OrchestratorRunner;

/**
 * Launches the full EDT orchestrator workflow from the main menu.
 */
public class RunFullAnalysisAction extends AbstractOrchestratorAction {

    @Override
    public void run(IAction action) {
        String configName = askForConfiguration("Run Full Analysis", "ERPCPM");
        if (configName == null) {
            return;
        }

        notifyUser(
            "Запуск анализа",
            "Полный анализ конфигурации \"" + configName + "\" запущен.\n" +
            "Прогресс можно отслеживать в Eclipse Progress View."
        );

        OrchestratorRunner.runFullAnalysis(configName, () -> {
            refreshDashboard();
            notifyUser(
                "Анализ завершен",
                "Полный анализ конфигурации \"" + configName + "\" успешно завершен."
            );
        });
    }
}

