package com.deuna.fraud

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import java.util.Locale
import java.util.concurrent.Executors

private const val TAG = "DeunaFraud"

class DeunaFraudModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val mainHandler = Handler(Looper.getMainLooper())
    private val workers = Executors.newCachedThreadPool()

    override fun getName() = "DeunaFraud"

    @ReactMethod
    fun generateFraudId(params: ReadableMap, promise: Promise) {
        val context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
        val paramsMap = readableMapToMap(params)

        workers.execute {
            try {
                val envString = paramsMap["environment"] as? String ?: "production"
                val publicApiKey = paramsMap["publicApiKey"] as? String ?: "deuna_fraud_key"

                @Suppress("UNCHECKED_CAST")
                val providers = (paramsMap["providers"] as? Map<String, Any?>)
                    ?: paramsMap.filterKeys { it != "environment" && it != "publicApiKey" }

                Log.d(TAG, "generateFraudId called with providers: ${providers.keys}")
                invokeNativeGenerateFraudId(context, envString, publicApiKey, providers, promise)
            } catch (t: Throwable) {
                Log.w(TAG, "generateFraudId invocation failed gracefully: ${t.message}", t)
                mainHandler.post { promise.resolve(null) }
            }
        }
    }

    @ReactMethod
    fun initializeFraudProviders(params: ReadableMap, promise: Promise) {
        val context = reactApplicationContext.currentActivity ?: reactApplicationContext.applicationContext
        val paramsMap = readableMapToMap(params)

        workers.execute {
            try {
                @Suppress("UNCHECKED_CAST")
                val providers = (paramsMap["providers"] as? Map<String, Any?>)
                    ?: paramsMap.filterKeys { it != "environment" && it != "publicApiKey" }

                Log.d(TAG, "initializeFraudProviders called with providers: ${providers.keys}")
                invokeNativeInitializeFraudProviders(context, providers, promise)
            } catch (t: Throwable) {
                Log.w(TAG, "initializeFraudProviders invocation failed gracefully: ${t.message}", t)
                mainHandler.post { promise.resolve(null) }
            }
        }
    }

    private fun invokeNativeGenerateFraudId(
        context: Context,
        envString: String,
        publicApiKey: String,
        providers: Map<String, Any?>,
        promise: Promise
    ) {
        try {
            val deunaSdkClass = Class.forName("com.deuna.maven.DeunaSDK")
            val envClass = Class.forName("com.deuna.maven.shared.Environment")
            val envConstant = resolveEnvironment(envClass, envString)

            val sdkInstance = try {
                val companionField = deunaSdkClass.getField("Companion").get(null)
                val getSharedMethod = companionField.javaClass.getMethod("getShared")
                getSharedMethod.invoke(companionField)
            } catch (_: Throwable) {
                val constructor = deunaSdkClass.getConstructor(envClass, String::class.java)
                constructor.newInstance(envConstant, publicApiKey)
            }

            val generateFraudIdKtClass = Class.forName("com.deuna.maven.GenerateFraudIdKt")
            val method = generateFraudIdKtClass.methods.firstOrNull { it.name == "generateFraudId" }
                ?: throw NoSuchMethodException("generateFraudId method not found in GenerateFraudIdKt")

            val callback = { fraudId: String? ->
                Log.d(TAG, "generateFraudId completed with result: $fraudId")
                mainHandler.post { promise.resolve(fraudId) }
            }

            method.invoke(null, sdkInstance, context, providers, callback)
        } catch (e: ClassNotFoundException) {
            Log.w(TAG, "deuna-sdk-android core not found on classpath: ${e.message}. Resolving null.")
            mainHandler.post { promise.resolve(null) }
        } catch (t: Throwable) {
            Log.e(TAG, "Error invoking native generateFraudId: ${t.message}", t)
            mainHandler.post { promise.resolve(null) }
        }
    }

    private fun invokeNativeInitializeFraudProviders(
        context: Context,
        providers: Map<String, Any?>,
        promise: Promise
    ) {
        try {
            val deunaSdkClass = Class.forName("com.deuna.maven.DeunaSDK")
            val method4 = deunaSdkClass.methods.firstOrNull {
                it.name == "initializeFraudProviders" && it.parameterTypes.size == 4
            }
            val method2 = deunaSdkClass.methods.firstOrNull {
                it.name == "initializeFraudProviders" && it.parameterTypes.size == 2
            }

            if (method4 == null && method2 == null) {
                Log.w(TAG, "initializeFraudProviders not present in deuna-sdk-android. Resolving immediately.")
                mainHandler.post { promise.resolve(null) }
                return
            }

            val onSuccess = {
                Log.d(TAG, "initializeFraudProviders completed successfully")
                mainHandler.post { promise.resolve(null) }
            }

            val onError = { error: String ->
                Log.e(TAG, "initializeFraudProviders failed: $error")
                mainHandler.post { promise.reject("INIT_ERROR", error) }
            }

            if (method4 != null) {
                method4.invoke(null, context, providers, onSuccess, onError)
            } else {
                method2?.invoke(null, context, providers)
                mainHandler.post { promise.resolve(null) }
            }
        } catch (e: ClassNotFoundException) {
            Log.w(TAG, "deuna-sdk-android core not found on classpath: ${e.message}. Resolving null.")
            mainHandler.post { promise.resolve(null) }
        } catch (t: Throwable) {
            Log.e(TAG, "Error invoking native initializeFraudProviders: ${t.message}", t)
            mainHandler.post { promise.resolve(null) }
        }
    }

    private fun resolveEnvironment(envClass: Class<*>, envString: String): Any {
        val normalized = envString.trim().uppercase(Locale.US)
        val constants = envClass.enumConstants ?: return envClass.enumConstants?.firstOrNull() ?: Object()
        for (constant in constants) {
            if ((constant as Enum<*>).name == normalized) {
                return constant
            }
        }
        return constants.first()
    }

    private fun readableMapToMap(map: ReadableMap): Map<String, Any?> {
        val result = mutableMapOf<String, Any?>()
        val iter = map.keySetIterator()
        while (iter.hasNextKey()) {
            val key = iter.nextKey()
            result[key] = readableValueToAny(map, key)
        }
        return result
    }

    private fun readableArrayToList(arr: ReadableArray): List<Any?> {
        val result = mutableListOf<Any?>()
        for (i in 0 until arr.size()) {
            when (arr.getType(i)) {
                ReadableType.Null -> result.add(null)
                ReadableType.Boolean -> result.add(arr.getBoolean(i))
                ReadableType.Number -> result.add(arr.getDouble(i))
                ReadableType.String -> result.add(arr.getString(i))
                ReadableType.Map -> arr.getMap(i)?.let { result.add(readableMapToMap(it)) }
                ReadableType.Array -> arr.getArray(i)?.let { result.add(readableArrayToList(it)) }
            }
        }
        return result
    }

    private fun readableValueToAny(map: ReadableMap, key: String): Any? {
        return when (map.getType(key)) {
            ReadableType.Null -> null
            ReadableType.Boolean -> map.getBoolean(key)
            ReadableType.Number -> map.getDouble(key)
            ReadableType.String -> map.getString(key)
            ReadableType.Map -> map.getMap(key)?.let { readableMapToMap(it) }
            ReadableType.Array -> map.getArray(key)?.let { readableArrayToList(it) }
        }
    }
}
