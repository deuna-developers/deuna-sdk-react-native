package com.deuna.wallets

import android.app.Dialog
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Gravity
import android.view.Window
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ProgressBar
import com.deuna.maven.wallets.DeunaWalletLauncher
import com.deuna.maven.wallets.WalletLaunchResult
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.Executors

private const val TAG = "DeunaWallets"

@Suppress("UNCHECKED_CAST")
private fun anyToWritable(value: Any?): Any? = when (value) {
    is JSONObject -> {
        val map = Arguments.createMap()
        value.keys().forEach { key -> putAny(map, key, deepConvert(value.get(key))) }
        map
    }
    is JSONArray -> {
        val arr = Arguments.createArray()
        for (i in 0 until value.length()) pushAny(arr, deepConvert(value.get(i)))
        arr
    }
    is Map<*, *> -> {
        val map = Arguments.createMap()
        (value as Map<String, Any?>).forEach { (k, v) -> putAny(map, k, deepConvert(v)) }
        map
    }
    is List<*> -> {
        val arr = Arguments.createArray()
        value.forEach { pushAny(arr, deepConvert(it)) }
        arr
    }
    else -> value
}

private fun deepConvert(value: Any?): Any? = anyToWritable(value)

private fun putAny(map: WritableMap, key: String, value: Any?) {
    when (value) {
        null -> map.putNull(key)
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
        is Long -> map.putDouble(key, value.toDouble())
        is Double -> map.putDouble(key, value)
        is Float -> map.putDouble(key, value.toDouble())
        is String -> map.putString(key, value)
        is WritableMap -> map.putMap(key, value)
        is com.facebook.react.bridge.WritableArray -> map.putArray(key, value)
        else -> map.putString(key, value.toString())
    }
}

private fun pushAny(arr: com.facebook.react.bridge.WritableArray, value: Any?) {
    when (value) {
        null -> arr.pushNull()
        is Boolean -> arr.pushBoolean(value)
        is Int -> arr.pushInt(value)
        is Long -> arr.pushDouble(value.toDouble())
        is Double -> arr.pushDouble(value)
        is Float -> arr.pushDouble(value.toDouble())
        is String -> arr.pushString(value)
        is WritableMap -> arr.pushMap(value)
        is com.facebook.react.bridge.WritableArray -> arr.pushArray(value)
        else -> arr.pushString(value.toString())
    }
}

class DeunaWalletsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private val workers = Executors.newSingleThreadExecutor()
    private var loadingDialog: Dialog? = null

    override fun getName() = "DeunaWallets"

    private fun readableMapToMap(map: com.facebook.react.bridge.ReadableMap): Map<String, Any> {
        val result = mutableMapOf<String, Any>()
        val iter = map.keySetIterator()
        while (iter.hasNextKey()) {
            val key = iter.nextKey()
            val value = readableValueToAny(map, key)
            if (value != null) result[key] = value
        }
        return result
    }

    private fun readableArrayToList(arr: com.facebook.react.bridge.ReadableArray): List<Any> {
        val result = mutableListOf<Any>()
        for (i in 0 until arr.size()) {
            when (arr.getType(i)) {
                com.facebook.react.bridge.ReadableType.Null -> {}
                com.facebook.react.bridge.ReadableType.Boolean -> result.add(arr.getBoolean(i))
                com.facebook.react.bridge.ReadableType.Number -> result.add(arr.getDouble(i))
                com.facebook.react.bridge.ReadableType.String -> result.add(arr.getString(i) ?: "")
                com.facebook.react.bridge.ReadableType.Map -> result.add(readableMapToMap(arr.getMap(i)!!))
                com.facebook.react.bridge.ReadableType.Array -> result.add(readableArrayToList(arr.getArray(i)!!))
            }
        }
        return result
    }

    private fun readableValueToAny(map: com.facebook.react.bridge.ReadableMap, key: String): Any? {
        return when (map.getType(key)) {
            com.facebook.react.bridge.ReadableType.Null -> null
            com.facebook.react.bridge.ReadableType.Boolean -> map.getBoolean(key)
            com.facebook.react.bridge.ReadableType.Number -> map.getDouble(key)
            com.facebook.react.bridge.ReadableType.String -> map.getString(key) ?: ""
            com.facebook.react.bridge.ReadableType.Map -> readableMapToMap(map.getMap(key)!!)
            com.facebook.react.bridge.ReadableType.Array -> readableArrayToList(map.getArray(key)!!)
        }
    }

    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun checkAvailableProviders(params: ReadableMap, promise: Promise) {
        val providersList = params.getArray("providers")
        val providers = mutableListOf<String>()
        if (providersList != null) {
            for (i in 0 until providersList.size()) providersList.getString(i)?.let { providers.add(it) }
        }
        val envString = if (params.hasKey("environment")) params.getString("environment") ?: "production" else "production"

        Log.d(TAG, "checkAvailableProviders — input: $providers, environment: $envString")

        val context = reactContext.applicationContext

        workers.execute {
            val available = providers.filter { provider ->
                DeunaWalletLauncher.isAvailable(context, provider, envString)
            }
            Log.d(TAG, "checkAvailableProviders — available: $available")
            mainHandler.post { promise.resolve(Arguments.fromList(available)) }
        }
    }

    @ReactMethod
    fun launchWallet(params: ReadableMap, promise: Promise) {
        val provider = if (params.hasKey("provider")) params.getString("provider") else null
        val credentials = if (params.hasKey("credentials")) params.getMap("credentials") else null
        val envString = if (params.hasKey("environment")) params.getString("environment") ?: "production" else "production"

        Log.d(TAG, "launchWallet — provider: $provider, environment: $envString")

        if (provider == null || credentials == null) {
            Log.e(TAG, "launchWallet — INVALID_PARAMS")
            promise.reject("INVALID_PARAMS", "provider and credentials are required")
            return
        }

        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            Log.e(TAG, "launchWallet — NO_ACTIVITY")
            promise.reject("NO_ACTIVITY", "No active Activity found")
            return
        }

        val credMap = readableMapToMap(credentials)

        var settled = false

        Log.d(TAG, "launchWallet — dispatching to main thread")
        mainHandler.post {
            Log.d(TAG, "launchWallet — calling DeunaWalletLauncher.launch")
            DeunaWalletLauncher.launch(
                context = activity,
                provider = provider,
                credentials = credMap,
                environment = envString,
            ) { result ->
                Log.d(TAG, "launchWallet — callback received, settled: $settled")
                if (settled) return@launch
                settled = true
                when (result) {
                    is WalletLaunchResult.Success -> {
                        Log.d(TAG, "launchWallet — success")
                        @Suppress("UNCHECKED_CAST")
                        val eventBody = Arguments.createMap()
                        eventBody.putMap("data", deepConvert(result.rawData) as? WritableMap ?: Arguments.createMap())
                        sendEvent("onWalletSuccess", eventBody)
                        promise.resolve(deepConvert(result.rawData))
                    }
                    is WalletLaunchResult.Error -> {
                        Log.e(TAG, "launchWallet — error: ${result.code} — ${result.message}")
                        val eventBody = Arguments.createMap()
                        eventBody.putString("code", result.code)
                        eventBody.putString("message", result.message)
                        sendEvent("onWalletError", eventBody)
                        promise.reject(result.code, result.message)
                    }
                    WalletLaunchResult.Closed -> {
                        Log.d(TAG, "launchWallet — closed by user")
                        val eventBody = Arguments.createMap()
                        eventBody.putString("action", "userAction")
                        sendEvent("onWalletClosed", eventBody)
                        promise.resolve("closed")
                    }
                }
            }
        }
    }

    @ReactMethod
    fun setLoading(visible: Boolean) {
        mainHandler.post {
            if (visible) {
                showLoadingDialog()
            } else {
                hideLoadingDialog()
            }
        }
    }

    private fun showLoadingDialog() {
        if (loadingDialog?.isShowing == true) return
        val activity = reactApplicationContext.currentActivity ?: return

        val sizePx = dpToPx(72f)
        val container = FrameLayout(activity).apply {
            layoutParams = FrameLayout.LayoutParams(sizePx, sizePx)
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.WHITE)
            }
            addView(
                ProgressBar(activity).apply {
                    isIndeterminate = true
                },
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    Gravity.CENTER
                )
            )
        }

        loadingDialog = Dialog(activity).apply {
            requestWindowFeature(Window.FEATURE_NO_TITLE)
            setCancelable(false)
            setContentView(container)
            window?.apply {
                setBackgroundDrawableResource(android.R.color.transparent)
                setLayout(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT
                )
                setGravity(Gravity.CENTER)
            }
            show()
        }
    }

    private fun hideLoadingDialog() {
        loadingDialog?.dismiss()
        loadingDialog = null
    }

    private fun dpToPx(dp: Float): Int {
        val density = reactContext.resources.displayMetrics.density
        return (dp * density).toInt()
    }

    // Required for RN event emitter — no-ops for NativeEventEmitter compatibility
    @ReactMethod fun addListener(eventName: String) {}
    @ReactMethod fun removeListeners(count: Int) {}
}
