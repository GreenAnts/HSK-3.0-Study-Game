package com.hskchinese.game;

import com.getcapacitor.BridgeActivity;
import com.hskchinese.game.plugins.TTSHelperPlugin;
import com.hskchinese.game.plugins.TestPlugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        // Important: Register plugins BEFORE super.onCreate() in Capacitor 4
        this.registerPlugin(TestPlugin.class);
        this.registerPlugin(TTSHelperPlugin.class);
        
        super.onCreate(savedInstanceState);
    }
}
