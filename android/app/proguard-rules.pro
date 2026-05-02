# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.msubz.app.** { *; }
-dontwarn com.getcapacitor.**

# Keep native methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# WebView JavaScript interface
-keepattributes JavascriptInterface
-keepattributes *Annotation*

# Prevent class name obfuscation for reflection
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Supabase / OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Security - remove logging in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Remove debug info from stack traces in release
-keepattributes !LocalVariableTable, !LocalVariableTypeTable
