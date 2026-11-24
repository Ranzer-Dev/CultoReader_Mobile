package com.cultoreader.app

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableArray
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.TranslateRemoteModel
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.Translator
import com.google.mlkit.nl.translate.TranslatorOptions
import java.util.concurrent.ConcurrentHashMap

/**
 * Módulo Nativo do Google ML Kit On-Device Translation.
 * Realiza tradução 100% no hardware do dispositivo móvel (offline), sem limites de tamanho
 * e sem dependência de serviços ou APIs externas na nuvem.
 */
class MlKitTranslateModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MlKitTranslate"

    private val translatorCache = ConcurrentHashMap<String, Translator>()
    private val modelManager = RemoteModelManager.getInstance()

    private fun resolveLanguageCode(code: String): String? {
        val clean = code.trim().lowercase().split("-")[0].split("_")[0]
        return TranslateLanguage.fromLanguageTag(clean)
    }

    private fun getTranslator(sourceLangTag: String, targetLangTag: String): Translator? {
        val source = resolveLanguageCode(sourceLangTag) ?: return null
        val target = resolveLanguageCode(targetLangTag) ?: return null

        val cacheKey = "$source->$target"
        return translatorCache.computeIfAbsent(cacheKey) {
            val options = TranslatorOptions.Builder()
                .setSourceLanguage(source)
                .setTargetLanguage(target)
                .build()
            Translation.getClient(options)
        }
    }

    @ReactMethod
    fun translate(
        text: String,
        sourceLang: String,
        targetLang: String,
        promise: Promise
    ) {
        try {
            val trimmed = text.trim()
            if (trimmed.isEmpty()) {
                promise.resolve(text)
                return
            }

            val sCode = resolveLanguageCode(sourceLang)
            val tCode = resolveLanguageCode(targetLang)

            if (sCode == null || tCode == null || sCode == tCode) {
                promise.resolve(text)
                return
            }

            val translator = getTranslator(sCode, tCode)
            if (translator == null) {
                promise.resolve(text)
                return
            }

            // Executa inferência local offline IMEDIATA na thread nativa do ML Kit
            translator.translate(trimmed)
                .addOnSuccessListener { translatedText ->
                    promise.resolve(translatedText)
                }
                .addOnFailureListener { exception ->
                    // Se o modelo ainda não foi baixado ou falhou, retorna o texto original imediatamente sem travar
                    promise.resolve(text)
                }
        } catch (e: Exception) {
            promise.resolve(text)
        }
    }

    @ReactMethod
    fun isPairDownloaded(sourceLang: String, targetLang: String, promise: Promise) {
        val sCode = resolveLanguageCode(sourceLang)
        val tCode = resolveLanguageCode(targetLang)
        if (sCode == null || tCode == null) {
            promise.resolve(false)
            return
        }
        if (sCode == tCode) {
            promise.resolve(true)
            return
        }

        val sModel = TranslateRemoteModel.Builder(sCode).build()
        val tModel = TranslateRemoteModel.Builder(tCode).build()

        modelManager.isModelDownloaded(sModel)
            .addOnSuccessListener { sDownloaded ->
                if (!sDownloaded) {
                    promise.resolve(false)
                } else {
                    modelManager.isModelDownloaded(tModel)
                        .addOnSuccessListener { tDownloaded ->
                            promise.resolve(tDownloaded)
                        }
                        .addOnFailureListener {
                            promise.resolve(false)
                        }
                }
            }
            .addOnFailureListener {
                promise.resolve(false)
            }
    }

    @ReactMethod
    fun downloadPair(sourceLang: String, targetLang: String, promise: Promise) {
        val sCode = resolveLanguageCode(sourceLang)
        val tCode = resolveLanguageCode(targetLang)
        if (sCode == null || tCode == null) {
            promise.reject("UNSUPPORTED_LANG", "Idiomas não suportados: $sourceLang -> $targetLang")
            return
        }

        val translator = getTranslator(sCode, tCode)
        if (translator == null) {
            promise.reject("TRANSLATOR_ERROR", "Não foi possível criar o tradutor para o par")
            return
        }

        val conditions = DownloadConditions.Builder().build()
        translator.downloadModelIfNeeded(conditions)
            .addOnSuccessListener {
                promise.resolve(true)
            }
            .addOnFailureListener { exception ->
                promise.reject("DOWNLOAD_FAILED", exception.message)
            }
    }

    @ReactMethod
    fun isModelDownloaded(langCode: String, promise: Promise) {
        val code = resolveLanguageCode(langCode)
        if (code == null) {
            promise.resolve(false)
            return
        }

        val model = TranslateRemoteModel.Builder(code).build()
        modelManager.isModelDownloaded(model)
            .addOnSuccessListener { isDownloaded ->
                promise.resolve(isDownloaded)
            }
            .addOnFailureListener {
                promise.resolve(false)
            }
    }

    @ReactMethod
    fun downloadModel(langCode: String, promise: Promise) {
        val code = resolveLanguageCode(langCode)
        if (code == null) {
            promise.reject("UNSUPPORTED_LANG", "Idioma não suportado pelo ML Kit: $langCode")
            return
        }

        val model = TranslateRemoteModel.Builder(code).build()
        val conditions = DownloadConditions.Builder().build()

        modelManager.download(model, conditions)
            .addOnSuccessListener {
                promise.resolve(true)
            }
            .addOnFailureListener { exception ->
                promise.reject("DOWNLOAD_FAILED", exception.message)
            }
    }

    @ReactMethod
    fun deleteModel(langCode: String, promise: Promise) {
        val code = resolveLanguageCode(langCode)
        if (code == null) {
            promise.resolve(true)
            return
        }

        val model = TranslateRemoteModel.Builder(code).build()
        modelManager.deleteDownloadedModel(model)
            .addOnSuccessListener {
                promise.resolve(true)
            }
            .addOnFailureListener { exception ->
                promise.reject("DELETE_FAILED", exception.message)
            }
    }

    @ReactMethod
    fun getDownloadedModels(promise: Promise) {
        modelManager.getDownloadedModels(TranslateRemoteModel::class.java)
            .addOnSuccessListener { models ->
                val array: WritableArray = Arguments.createArray()
                for (m in models) {
                    array.pushString(m.language)
                }
                promise.resolve(array)
            }
            .addOnFailureListener { exception ->
                promise.reject("GET_MODELS_FAILED", exception.message)
            }
    }

    @ReactMethod
    fun readAssetFile(fileName: String, promise: Promise) {
        try {
            val content = reactContext.assets.open(fileName).bufferedReader(Charsets.UTF_8).use { it.readText() }
            promise.resolve(content)
        } catch (e: Exception) {
            promise.reject("ASSET_ERROR", "Erro ao ler asset: ${e.message}")
        }
    }
}
