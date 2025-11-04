package com.onecai.edt;

import org.eclipse.ui.plugin.AbstractUIPlugin;
import org.osgi.framework.BundleContext;

/**
 * The activator class controls the plug-in life cycle
 * 1C AI Assistant EDT Plugin
 */
public class Activator extends AbstractUIPlugin {

    // The plug-in ID
    public static final String PLUGIN_ID = "com.1cai.edt";

    // The shared instance
    private static Activator plugin;

    /**
     * The constructor
     */
    public Activator() {
    }

    @Override
    public void start(BundleContext context) throws Exception {
        super.start(context);
        plugin = this;
        
        // Initialize plugin
        System.out.println("1C AI Assistant Plugin starting...");
        
        // TODO: Initialize backend connection
        // TODO: Load preferences
        
        System.out.println("1C AI Assistant Plugin started successfully!");
    }

    @Override
    public void stop(BundleContext context) throws Exception {
        plugin = null;
        super.stop(context);
        
        System.out.println("1C AI Assistant Plugin stopped");
    }

    /**
     * Returns the shared instance
     *
     * @return the shared instance
     */
    public static Activator getDefault() {
        return plugin;
    }
}





