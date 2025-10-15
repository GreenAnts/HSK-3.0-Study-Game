package com.hskchinese.game.plugins;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

@CapacitorPlugin(name = "TTSHelper")
public class TTSHelperPlugin extends Plugin {
    
    private static final String TAG = "TTSHelperPlugin";
    private static final int CHECK_TTS_DATA_REQUEST = 1;
    private TextToSpeech tts;
    private PluginCall pendingCall;

    @PluginMethod
    public void checkChineseTTSAvailability(PluginCall call) {
        Log.d(TAG, "Checking Chinese TTS availability");
        
        try {
            // Initialize TTS to check language availability
            tts = new TextToSpeech(getContext(), new TextToSpeech.OnInitListener() {
                @Override
                public void onInit(int status) {
                    if (status == TextToSpeech.SUCCESS) {
                        Log.d(TAG, "TTS initialized successfully");
                        
                        // Check Chinese language availability
                        Locale chineseLocale = Locale.SIMPLIFIED_CHINESE;
                        int availability = tts.isLanguageAvailable(chineseLocale);
                        
                        Log.d(TAG, "Chinese TTS availability result: " + availability);
                        
                        boolean isAvailable = (availability == TextToSpeech.LANG_AVAILABLE || 
                                             availability == TextToSpeech.LANG_COUNTRY_AVAILABLE ||
                                             availability == TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE);
                        
                        boolean needsInstallation = (availability == TextToSpeech.LANG_MISSING_DATA);
                        
                        // Clean up TTS instance
                        if (tts != null) {
                            tts.shutdown();
                            tts = null;
                        }
                        
                        // Return result to JavaScript
                        call.resolve(new com.getcapacitor.JSObject()
                            .put("available", isAvailable)
                            .put("needsInstallation", needsInstallation)
                            .put("availabilityCode", availability)
                            .put("message", getAvailabilityMessage(availability)));
                        
                    } else {
                        Log.e(TAG, "TTS initialization failed with status: " + status);
                        if (tts != null) {
                            tts.shutdown();
                            tts = null;
                        }
                        call.reject("TTS initialization failed");
                    }
                }
            });
            
        } catch (Exception e) {
            Log.e(TAG, "Error checking TTS availability", e);
            call.reject("Error checking TTS availability: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openTTSSettings(PluginCall call) {
        Log.d(TAG, "Opening TTS settings with improved intent resolution");
        
        try {
            android.content.pm.PackageManager pm = getContext().getPackageManager();
            
            // Method 1: Try ACTION_INSTALL_TTS_DATA with proper resolution check
            Intent installIntent = new Intent();
            installIntent.setAction(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA);
            android.content.pm.ResolveInfo resolveInfo = pm.resolveActivity(installIntent, android.content.pm.PackageManager.MATCH_DEFAULT_ONLY);
            
            if (resolveInfo != null) {
                Log.d(TAG, "Opening TTS installation via ACTION_INSTALL_TTS_DATA");
                getActivity().startActivity(installIntent);
                call.resolve();
                return;
            }
            
            // Method 2: Try TTS settings with proper action constant
            Intent ttsSettingsIntent = new Intent();
            ttsSettingsIntent.setAction("com.android.settings.TTS_SETTINGS");
            ttsSettingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (ttsSettingsIntent.resolveActivity(pm) != null) {
                Log.d(TAG, "Opening TTS settings via com.android.settings.TTS_SETTINGS");
                getActivity().startActivity(ttsSettingsIntent);
                call.resolve();
                return;
            }
            
            // Method 3: Try alternative TTS settings action
            Intent altTtsSettingsIntent = new Intent("android.settings.TTS_SETTINGS");
            altTtsSettingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (altTtsSettingsIntent.resolveActivity(pm) != null) {
                Log.d(TAG, "Opening TTS settings via android.settings.TTS_SETTINGS");
                getActivity().startActivity(altTtsSettingsIntent);
                call.resolve();
                return;
            }
            
            // Method 4: Try direct component approach for modern Android versions
            try {
                Intent componentIntent = new Intent();
                componentIntent.setComponent(new android.content.ComponentName(
                    "com.android.settings", 
                    "com.android.settings.TextToSpeechSettings"
                ));
                componentIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                
                if (componentIntent.resolveActivity(pm) != null) {
                    Log.d(TAG, "Opening TTS settings via direct component");
                    getActivity().startActivity(componentIntent);
                    call.resolve();
                    return;
                }
            } catch (Exception componentError) {
                Log.d(TAG, "Direct component method failed: " + componentError.getMessage());
            }
            
            // Method 5: Fallback to accessibility settings
            Intent accessibilityIntent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            accessibilityIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (accessibilityIntent.resolveActivity(pm) != null) {
                Log.d(TAG, "Opening accessibility settings as fallback");
                getActivity().startActivity(accessibilityIntent);
                call.resolve();
                return;
            }
            
            // Method 6: Final fallback to general settings
            Intent generalSettingsIntent = new Intent(Settings.ACTION_SETTINGS);
            generalSettingsIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            
            if (generalSettingsIntent.resolveActivity(pm) != null) {
                Log.d(TAG, "Opening general settings as final fallback");
                getActivity().startActivity(generalSettingsIntent);
                call.resolve();
                return;
            }
            
            // If all methods fail
            Log.e(TAG, "All methods to open TTS settings failed");
            call.reject("Could not open TTS settings. No suitable activity found on this device.");
            
        } catch (Exception e) {
            Log.e(TAG, "Error opening TTS settings", e);
            call.reject("Error opening TTS settings: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkTTSData(PluginCall call) {
        Log.d(TAG, "Checking TTS data availability");
        pendingCall = call;
        
        try {
            Intent checkIntent = new Intent();
            checkIntent.setAction(TextToSpeech.Engine.ACTION_CHECK_TTS_DATA);
            if (checkIntent.resolveActivity(getContext().getPackageManager()) != null) {
                getActivity().startActivityForResult(checkIntent, CHECK_TTS_DATA_REQUEST);
            } else {
                call.reject("Could not check TTS data. No suitable activity found.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking TTS data", e);
            call.reject("Error checking TTS data: " + e.getMessage());
        }
    }

    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == CHECK_TTS_DATA_REQUEST && pendingCall != null) {
            boolean dataAvailable = (resultCode == TextToSpeech.Engine.CHECK_VOICE_DATA_PASS);
            
            Log.d(TAG, "TTS data check result: " + resultCode + ", available: " + dataAvailable);
            
            pendingCall.resolve(new com.getcapacitor.JSObject()
                .put("dataAvailable", dataAvailable)
                .put("resultCode", resultCode));
            
            pendingCall = null;
        }
    }

    private String getAvailabilityMessage(int availability) {
        switch (availability) {
            case TextToSpeech.LANG_AVAILABLE:
                return "Chinese language is available";
            case TextToSpeech.LANG_COUNTRY_AVAILABLE:
                return "Chinese language and country are available";
            case TextToSpeech.LANG_COUNTRY_VAR_AVAILABLE:
                return "Chinese language, country, and variant are available";
            case TextToSpeech.LANG_MISSING_DATA:
                return "Chinese language is supported but data is missing";
            case TextToSpeech.LANG_NOT_SUPPORTED:
                return "Chinese language is not supported";
            default:
                return "Unknown availability status: " + availability;
        }
    }
}
