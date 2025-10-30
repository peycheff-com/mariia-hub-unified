package com.mariaborysevych.beautyfitness.presentation.payment

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.google.android.gms.wallet.*
import com.mariaborysevych.beautyfitness.BuildConfig
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import javax.inject.Inject

@HiltViewModel
class GooglePayViewModel @Inject constructor(
    application: Application
) : AndroidViewModel(application) {

    private val paymentsClient = Wallet.getPaymentsClient(
        application,
        Wallet.WalletOptions.Builder()
            .setEnvironment(BuildConfig.STRIPE_PUBLISHABLE_KEY.startsWith("pk_live"))
            .build()
    )

    private val _uiState = MutableStateFlow(GooglePayUiState())
    val uiState: StateFlow<GooglePayUiState> = _uiState.asStateFlow()

    private val allowedPaymentMethods = JSONArray().apply {
        put(getBaseCardPaymentMethod())
        put(getGooglePayPaymentMethod())
    }

    init {
        checkGooglePayAvailability()
    }

    private fun checkGooglePayAvailability() {
        viewModelScope.launch {
            val isReadyToPayJson = JSONObject().apply {
                put("apiVersion", 2)
                put("apiVersionMinor", 0)
                put("allowedPaymentMethods", allowedPaymentMethods)
            }

            val request = IsReadyToPayRequest.fromJson(isReadyToPayJson.toString())
            paymentsClient.isReadyToPay(request)
                .addOnSuccessListener { isReady ->
                    _uiState.update { it.copy(isGooglePayAvailable = isReady) }
                }
                .addOnFailureListener { exception ->
                    _uiState.update {
                        it.copy(
                            isGooglePayAvailable = false,
                            error = "Google Pay not available: ${exception.message}"
                        )
                    }
                }
        }
    }

    fun requestPayment(amount: Long, currency: String = "PLN") {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                val paymentDataRequestJson = createPaymentDataRequest(amount, currency)
                val request = PaymentDataRequest.fromJson(paymentDataRequestJson.toString())

                paymentsClient.loadPaymentData(request)
                    .addOnSuccessListener { paymentData ->
                        handlePaymentSuccess(paymentData)
                    }
                    .addOnFailureListener { exception ->
                        handlePaymentError(exception)
                    }
            } catch (e: JSONException) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Payment request error: ${e.message}"
                    )
                }
            }
        }
    }

    private fun createPaymentDataRequest(amount: Long, currency: String): JSONObject {
        return JSONObject().apply {
            put("apiVersion", 2)
            put("apiVersionMinor", 0)
            put("merchantInfo", JSONObject().apply {
                put("merchantName", "Mariia Hub Beauty & Fitness")
                put("merchantId", "BCR2DN4TVYDMQKJL") // Replace with your merchant ID
            })
            put("allowedPaymentMethods", allowedPaymentMethods)
            put("transactionInfo", JSONObject().apply {
                put("totalPrice", amount.toString())
                put("totalPriceStatus", "FINAL")
                put("currencyCode", currency)
                put("countryCode", "PL")
                put("checkoutOption", "COMPLETE_IMMEDIATE_PURCHASE")
            })
            put("shippingAddressRequired", false)
            put("emailRequired", true)
            put("allowPaymentMethods", JSONArray().apply {
                put(JSONObject().apply {
                    put("type", "CARD")
                    put("parameters", JSONObject().apply {
                        put("allowedAuthMethods", JSONArray().apply {
                            put("PAN_ONLY")
                            put("CRYPTOGRAM_3DS")
                        })
                        put("allowedCardNetworks", JSONArray().apply {
                            put("AMEX")
                            put("DISCOVER")
                            put("INTERAC")
                            put("JCB")
                            put("MASTERCARD")
                            put("VISA")
                        })
                        put("billingAddressRequired", false)
                    })
                })
            })
        }
    }

    private fun handlePaymentSuccess(paymentData: PaymentData) {
        try {
            val paymentInformation = JSONObject(paymentData.toJson())
            val token = paymentInformation.getJSONObject("paymentMethodData")
                .getJSONObject("tokenizationData")
                .getString("token")

            _uiState.update {
                it.copy(
                    isLoading = false,
                    paymentResult = PaymentResult(
                        status = PaymentStatus.SUCCESS,
                        paymentToken = token,
                        paymentData = paymentData
                    )
                )
            }
        } catch (e: JSONException) {
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = "Payment processing error: ${e.message}"
                )
            }
        }
    }

    private fun handlePaymentError(exception: Exception) {
        val errorMessage = when {
            exception is UserCanceledException -> "Payment was cancelled by user"
            exception is ApiException -> {
                when (exception.statusCode) {
                    WalletConstants.ERROR_CODE_BUYER_ACCOUNT_ERROR -> "Buyer account error"
                    WalletConstants.ERROR_CODE_MERCHANT_ACCOUNT_ERROR -> "Merchant account error"
                    WalletConstants.ERROR_CODE_ENVIRONMENT_ERROR -> "Environment error"
                    WalletConstants.ERROR_CODE_INVALID_PARAMETERS -> "Invalid parameters"
                    WalletConstants.ERROR_CODE_NO_API_KEY -> "No API key"
                    WalletConstants.ERROR_CODE_NOT_SUPPORTED -> "Not supported"
                    WalletConstants.ERROR_CODE_OTHER_ERROR -> "Unknown error"
                    else -> "Payment error: ${exception.message}"
                }
            }
            else -> "Payment failed: ${exception.message}"
        }

        _uiState.update {
            it.copy(
                isLoading = false,
                error = errorMessage,
                paymentResult = PaymentResult(
                    status = PaymentStatus.FAILED,
                    errorMessage = errorMessage
                )
            )
        }
    }

    private fun getBaseCardPaymentMethod(): JSONObject {
        return JSONObject().apply {
            put("type", "CARD")
            put("parameters", JSONObject().apply {
                put("allowedAuthMethods", JSONArray().apply {
                    put("PAN_ONLY")
                    put("CRYPTOGRAM_3DS")
                })
                put("allowedCardNetworks", JSONArray().apply {
                    put("AMEX")
                    put("DISCOVER")
                    put("JCB")
                    put("MASTERCARD")
                    put("VISA")
                })
            })
            put("tokenizationSpecification", JSONObject().apply {
                put("type", "PAYMENT_GATEWAY")
                put("parameters", JSONObject().apply {
                    put("gateway", "stripe")
                    put("stripe:version", "2022-11-15")
                    put("stripe:publishableKey", BuildConfig.STRIPE_PUBLISHABLE_KEY)
                })
            })
        }
    }

    private fun getGooglePayPaymentMethod(): JSONObject {
        return JSONObject().apply {
            put("type", "PAYMENT_GATEWAY")
            put("parameters", JSONObject().apply {
                put("gateway", "stripe")
                put("stripe:version", "2022-11-15")
                put("stripe:publishableKey", BuildConfig.STRIPE_PUBLISHABLE_KEY)
            })
            put("tokenizationSpecification", JSONObject().apply {
                put("type", "PAYMENT_GATEWAY")
                put("parameters", JSONObject().apply {
                    put("gateway", "stripe")
                    put("stripe:version", "2022-11-15")
                    put("stripe:publishableKey", BuildConfig.STRIPE_PUBLISHABLE_KEY)
                })
            })
        }
    }

    fun clearPaymentResult() {
        _uiState.update {
            it.copy(
                paymentResult = null,
                error = null,
                isLoading = false
            )
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}

data class GooglePayUiState(
    val isGooglePayAvailable: Boolean = false,
    val isLoading: Boolean = false,
    val paymentResult: PaymentResult? = null,
    val error: String? = null
)

data class PaymentResult(
    val status: PaymentStatus,
    val paymentToken: String? = null,
    val paymentData: PaymentData? = null,
    val errorMessage: String? = null
)

enum class PaymentStatus {
    SUCCESS,
    FAILED,
    CANCELLED
}