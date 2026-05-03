package com.mozosubz.app;

import android.webkit.JavascriptInterface;

/**
 * JavaScript interface injected as window.MozosubzContacts.
 * The website's navigator.contacts polyfill calls pickContact() to launch
 * the native Android contact picker; the result is delivered back via JS callback.
 */
public class ContactsPickerBridge {

    private final MainActivity activity;

    public ContactsPickerBridge(MainActivity activity) {
        this.activity = activity;
    }

    /**
     * Called from JavaScript: window.MozosubzContacts.pickContact(callbackId, fieldsJson)
     * Launches the native Android contact picker. The result is delivered by calling
     * window[callbackId](contactJson) on the main thread.
     *
     * @param callbackId  unique id matching the pending JS promise
     * @param fieldsJson  JSON array of requested fields, e.g. ["name","tel"]
     */
    @JavascriptInterface
    public void pickContact(String callbackId, String fieldsJson) {
        activity.launchContactPicker(callbackId);
    }
}
