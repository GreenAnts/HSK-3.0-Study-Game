package com.hskchinese.game.plugins;

import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TestPlugin")
public class TestPlugin extends Plugin {
    
    private static final String TAG = "TestPlugin";

    @PluginMethod
    public void testMethod(PluginCall call) {
        Log.d(TAG, "TestPlugin method called");
        call.resolve();
    }
}
