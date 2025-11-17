package com.onecai.edt.actions;

import org.eclipse.jface.action.IAction;

import com.onecai.edt.services.OrchestratorRunner;

/**
 * Launches the quick (parse-only) orchestrator workflow.
 */
public class RunQuickAnalysisAction extends AbstractOrchestratorAction {

    @Override
    public void run(IAction action) {
        String configName = askForConfiguration("Run Quick Analysis", "ERPCPM");
        if (configName == null) {
            return;
        }

        notifyUser(
            "Запуск быстрого анализа",
            "Быстрый анализ конфигурации \"" + configName + "\" запущен.\n" +
            "Будут выполнены только шаги парсинга."
        );

        OrchestratorRunner.runQuickAnalysis(configName, () -> {
            refreshDashboard();
            notifyUser(
                "Быстрый анализ завершен",
                "Парсинг конфигурации \"" + configName + "\" завершен."
            );
        });
    }
}

