package com.mariaborysevych.beautyfitness.presentation.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.runBlocking
import javax.crypto.Cipher
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BiometricAuthManager @Inject constructor(
    private val context: Context
) {
    companion object {
        private const val PREFS_NAME = "biometric_auth_prefs"
        private const val KEY_BIOMETRIC_ENABLED = "biometric_enabled"
        private const val KEY_BIOMETRIC_SETUP = "biometric_setup"
    }

    private val sharedPreferences: SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _biometricAvailable = MutableStateFlow(false)
    val biometricAvailable: StateFlow<Boolean> = _biometricAvailable.asStateFlow()

    private val _biometricEnabled = MutableStateFlow(false)
    val biometricEnabled: StateFlow<Boolean> = _biometricEnabled.asStateFlow()

    private val _authResult = Channel<BiometricAuthResult>()
    val authResult = _authResult.receiveAsFlow()

    private var biometricPrompt: BiometricPrompt? = null

    init {
        checkBiometricAvailability()
        loadBiometricSettings()
    }

    private fun checkBiometricAvailability() {
        val biometricManager = BiometricManager.from(context)
        val canAuthenticate = when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL)) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            else -> false
        }

        _biometricAvailable.value = canAuthenticate
    }

    private fun loadBiometricSettings() {
        _biometricEnabled.value = sharedPreferences.getBoolean(KEY_BIOMETRIC_ENABLED, false)
    }

    fun setupBiometricAuth(
        activity: FragmentActivity,
        title: String = "Enable Biometric Authentication",
        subtitle: String = "Use your fingerprint or face to secure your account",
        description: String = "This adds an extra layer of security to your beauty and fitness bookings"
    ) {
        if (!_biometricAvailable.value) {
            runBlocking {
                _authResult.send(
                    BiometricAuthResult.Error("Biometric authentication is not available on this device")
                )
            }
            return
        }

        val executor = ContextCompat.getMainExecutor(activity)
        biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    runBlocking {
                        when (errorCode) {
                            BiometricPrompt.ERROR_USER_CANCELED,
                            BiometricPrompt.ERROR_NEGATIVE_BUTTON -> {
                                _authResult.send(BiometricAuthResult.Cancelled)
                            }
                            else -> {
                                _authResult.send(
                                    BiometricAuthResult.Error("Authentication error: $errString")
                                )
                            }
                        }
                    }
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    runBlocking {
                        // Enable biometric auth after successful setup
                        enableBiometricAuth()
                        _authResult.send(BiometricAuthResult.Success)
                    }
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    runBlocking {
                        _authResult.send(
                            BiometricAuthResult.Error("Authentication failed. Please try again.")
                        )
                    }
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .build()

        biometricPrompt?.authenticate(promptInfo)
    }

    fun authenticate(
        activity: FragmentActivity,
        title: String = "Verify Your Identity",
        subtitle: String = "Use your fingerprint or face to continue",
        description: String = "Confirm your identity to access your account"
    ) {
        if (!_biometricEnabled.value) {
            runBlocking {
                _authResult.send(
                    BiometricAuthResult.Error("Biometric authentication is not enabled")
                )
            }
            return
        }

        if (!_biometricAvailable.value) {
            runBlocking {
                _authResult.send(
                    BiometricAuthResult.Error("Biometric authentication is not available on this device")
                )
            }
            return
        }

        val executor = ContextCompat.getMainExecutor(activity)
        biometricPrompt = BiometricPrompt(
            activity,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    runBlocking {
                        when (errorCode) {
                            BiometricPrompt.ERROR_USER_CANCELED,
                            BiometricPrompt.ERROR_NEGATIVE_BUTTON -> {
                                _authResult.send(BiometricAuthResult.Cancelled)
                            }
                            else -> {
                                _authResult.send(
                                    BiometricAuthResult.Error("Authentication error: $errString")
                                )
                            }
                        }
                    }
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    runBlocking {
                        _authResult.send(BiometricAuthResult.Success)
                    }
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    runBlocking {
                        _authResult.send(
                            BiometricAuthResult.Error("Authentication failed. Please try again.")
                        )
                    }
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .setConfirmationRequired(false)
            .build()

        biometricPrompt?.authenticate(promptInfo)
    }

    fun enableBiometricAuth() {
        sharedPreferences.edit()
            .putBoolean(KEY_BIOMETRIC_ENABLED, true)
            .putBoolean(KEY_BIOMETRIC_SETUP, true)
            .apply()
        _biometricEnabled.value = true
    }

    fun disableBiometricAuth() {
        sharedPreferences.edit()
            .putBoolean(KEY_BIOMETRIC_ENABLED, false)
            .apply()
        _biometricEnabled.value = false
    }

    fun isBiometricSetup(): Boolean {
        return sharedPreferences.getBoolean(KEY_BIOMETRIC_SETUP, false)
    }

    fun hasBiometricCapability(): Boolean {
        return _biometricAvailable.value
    }

    // For secure data encryption/decryption
    fun createEncryptionCipher(): Cipher? {
        return try {
            // Implementation for creating cipher with biometric authentication
            // This would be used for encrypting sensitive data like user tokens
            null // Placeholder - would implement actual cipher creation
        } catch (e: Exception) {
            null
        }
    }

    fun createDecryptionCipher(): Cipher? {
        return try {
            // Implementation for creating cipher for decryption
            null // Placeholder - would implement actual cipher creation
        } catch (e: Exception) {
            null
        }
    }

    // Authentication for sensitive operations
    fun authenticateForSensitiveOperation(
        activity: FragmentActivity,
        operation: String,
        onSuccess: () -> Unit,
        onError: (String) -> Unit
    ) {
        val title = "Verify for $operation"
        val subtitle = "Additional verification required"
        val description = "Confirm your identity to proceed with this action"

        biometricPrompt = BiometricPrompt(
            activity,
            ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    onSuccess()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    when (errorCode) {
                        BiometricPrompt.ERROR_USER_CANCELED,
                        BiometricPrompt.ERROR_NEGATIVE_BUTTON -> {
                            onError("Authentication cancelled")
                        }
                        else -> {
                            onError("Authentication error: $errString")
                        }
                    }
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    onError("Authentication failed")
                }
            }
        )

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setDescription(description)
            .setNegativeButtonText("Cancel")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .build()

        biometricPrompt?.authenticate(promptInfo)
    }

    fun getAuthenticationType(): String {
        val biometricManager = BiometricManager.from(context)
        return when (biometricManager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG)) {
            BiometricManager.BIOMETRIC_SUCCESS -> {
                // Try to determine which specific biometric type is available
                // This is a simplified check - in reality, you'd need more sophisticated detection
                "Biometric"
            }
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> "No biometric hardware"
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> "Biometric hardware unavailable"
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "No biometric enrolled"
            BiometricManager.BIOMETRIC_ERROR_SECURITY_UPDATE_REQUIRED -> "Security update required"
            BiometricManager.BIOMETRIC_ERROR_UNSUPPORTED -> "Biometric not supported"
            BiometricManager.BIOMETRIC_STATUS_UNKNOWN -> "Biometric status unknown"
            else -> "Unknown biometric status"
        }
    }

    // Clean up resources
    fun cleanup() {
        biometricPrompt = null
    }
}

sealed class BiometricAuthResult {
    object Success : BiometricAuthResult()
    object Cancelled : BiometricAuthResult()
    data class Error(val message: String) : BiometricAuthResult()
}

// Biometric authentication preferences manager
@Singleton
class BiometricPreferences @Inject constructor(
    private val context: Context
) {
    private val prefs = context.getSharedPreferences("biometric_prefs", Context.MODE_PRIVATE)

    var isBiometricEnabled: Boolean
        get() = prefs.getBoolean("biometric_enabled", false)
        set(value) = prefs.edit().putBoolean("biometric_enabled", value).apply()

    var lastSuccessfulAuth: Long
        get() = prefs.getLong("last_successful_auth", 0L)
        set(value) = prefs.edit().putLong("last_successful_auth", value).apply()

    var failedAuthAttempts: Int
        get() = prefs.getInt("failed_auth_attempts", 0)
        set(value) = prefs.edit().putInt("failed_auth_attempts", value).apply()

    var isSetupCompleted: Boolean
        get() = prefs.getBoolean("setup_completed", false)
        set(value) = prefs.edit().putBoolean("setup_completed", value).apply()

    fun incrementFailedAttempts() {
        failedAuthAttempts++
    }

    fun resetFailedAttempts() {
        failedAuthAttempts = 0
    }

    fun shouldShowSetupPrompt(): Boolean {
        return !isSetupCompleted && !isBiometricEnabled
    }

    fun shouldReauthenticate(): Boolean {
        val lastAuth = lastSuccessfulAuth
        val currentTime = System.currentTimeMillis()
        val reauthThreshold = 5 * 60 * 1000L // 5 minutes

        return lastAuth == 0L || (currentTime - lastAuth) > reauthThreshold
    }

    fun recordSuccessfulAuth() {
        lastSuccessfulAuth = System.currentTimeMillis()
        resetFailedAttempts()
    }

    fun recordFailedAuth() {
        incrementFailedAttempts()
    }

    fun shouldTemporarilyBlock(): Boolean {
        return failedAuthAttempts >= 3
    }

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}