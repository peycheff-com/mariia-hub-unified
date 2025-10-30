"""
Exception classes for the Mariia Hub SDK.
"""

from typing import Any, Dict, Optional, Type


class MariiaHubError(Exception):
    """
    Base exception class for all Mariia Hub SDK errors.
    """

    def __init__(
        self,
        message: str,
        code: str = "UNKNOWN_ERROR",
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
        retryable: bool = False,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        self.request_id = request_id
        self.retryable = retryable

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"

    def __repr__(self) -> str:
        return (
            f"{self.__class__.__name__}("
            f"code='{self.code}', "
            f"message='{self.message}', "
            f"status_code={self.status_code}, "
            f"retryable={self.retryable}"
            f")"
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary representation."""
        return {
            "error_type": self.__class__.__name__,
            "code": self.code,
            "message": self.message,
            "status_code": self.status_code,
            "details": self.details,
            "request_id": self.request_id,
            "retryable": self.retryable,
        }


class APIError(MariiaHubError):
    """
    General API error.
    """

    def __init__(
        self,
        message: str,
        code: str = "API_ERROR",
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=details,
            request_id=request_id,
        )


class AuthenticationError(MariiaHubError):
    """
    Authentication-related errors.
    """

    AUTH_ERROR_CODES = [
        "INVALID_CREDENTIALS",
        "TOKEN_EXPIRED",
        "TOKEN_INVALID",
        "TOKEN_REVOKED",
        "UNAUTHORIZED",
        "FORBIDDEN",
        "ACCOUNT_LOCKED",
        "ACCOUNT_SUSPENDED",
        "EMAIL_NOT_VERIFIED",
        "PHONE_NOT_VERIFIED",
        "TWO_FACTOR_REQUIRED",
        "TWO_FACTOR_INVALID",
        "SESSION_EXPIRED",
        "PERMISSION_DENIED",
        "SCOPE_INSUFFICIENT",
        "API_KEY_INVALID",
        "API_KEY_EXPIRED",
        "OAUTH_ERROR",
        "CSRF_TOKEN_INVALID",
    ]

    def __init__(
        self,
        message: str,
        code: str = "AUTHENTICATION_ERROR",
        status_code: Optional[int] = 401,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=details,
            request_id=request_id,
            retryable=False,
        )


class ValidationError(MariiaHubError):
    """
    Validation-related errors.
    """

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        value: Optional[Any] = None,
        constraint: Optional[str] = None,
        code: str = "VALIDATION_ERROR",
        status_code: Optional[int] = 400,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.field = field
        self.value = value
        self.constraint = constraint

        validation_details = {
            "field": field,
            "value": value,
            "constraint": constraint,
        }

        if details:
            validation_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=validation_details,
            request_id=request_id,
            retryable=False,
        )


class RateLimitError(MariiaHubError):
    """
    Rate limiting errors.
    """

    def __init__(
        self,
        message: str,
        retry_after: Optional[int] = None,
        limit: Optional[int] = None,
        remaining: Optional[int] = None,
        reset: Optional[int] = None,
        code: str = "RATE_LIMIT_EXCEEDED",
        status_code: Optional[int] = 429,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.retry_after = retry_after
        self.limit = limit
        self.remaining = remaining
        self.reset = reset

        rate_limit_details = {
            "retry_after": retry_after,
            "limit": limit,
            "remaining": remaining,
            "reset": reset,
        }

        if details:
            rate_limit_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=rate_limit_details,
            request_id=request_id,
            retryable=True,
        )


class PaymentError(MariiaHubError):
    """
    Payment-related errors.
    """

    PAYMENT_ERROR_CODES = [
        "PAYMENT_FAILED",
        "PAYMENT_CANCELLED",
        "PAYMENT_DECLINED",
        "INSUFFICIENT_FUNDS",
        "CARD_DECLINED",
        "CARD_DECLINED_TEMPORARY",
        "INVALID_CARD",
        "EXPIRED_CARD",
        "INCORRECT_CVC",
        "PROCESSING_ERROR",
        "FRAUD_DETECTED",
        "PAYMENT_GATEWAY_ERROR",
        "PAYMENT_TIMEOUT",
        "PAYMENT_METHOD_INVALID",
        "CURRENCY_NOT_SUPPORTED",
        "AMOUNT_TOO_SMALL",
        "AMOUNT_TOO_LARGE",
        "REFUND_FAILED",
        "REFUND_EXPIRED",
        "REFUND_PROCESSED",
        "POLISH_PAYMENT_FAILED",
        "BLIK_ERROR",
        "PRZELEWY24_ERROR",
        "INSTALLMENT_DECLINED",
    ]

    def __init__(
        self,
        message: str,
        payment_id: Optional[str] = None,
        payment_intent_id: Optional[str] = None,
        gateway: Optional[str] = None,
        decline_code: Optional[str] = None,
        code: str = "PAYMENT_ERROR",
        status_code: Optional[int] = 400,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.payment_id = payment_id
        self.payment_intent_id = payment_intent_id
        self.gateway = gateway
        self.decline_code = decline_code

        payment_details = {
            "payment_id": payment_id,
            "payment_intent_id": payment_intent_id,
            "gateway": gateway,
            "decline_code": decline_code,
        }

        # Determine if retryable based on error code
        retryable_codes = [
            "PAYMENT_GATEWAY_ERROR",
            "PAYMENT_TIMEOUT",
            "INSUFFICIENT_FUNDS",
            "CARD_DECLINED_TEMPORARY",
        ]
        retryable = code in retryable_codes

        if details:
            payment_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=payment_details,
            request_id=request_id,
            retryable=retryable,
        )


class BookingError(MariiaHubError):
    """
    Booking-related errors.
    """

    BOOKING_ERROR_CODES = [
        "SLOT_UNAVAILABLE",
        "SLOT_ALREADY_BOOKED",
        "SLOT_TEMPORARILY_UNAVAILABLE",
        "SERVICE_UNAVAILABLE",
        "SERVICE_NOT_FOUND",
        "CAPACITY_EXCEEDED",
        "GROUP_SIZE_EXCEEDED",
        "MIN_GROUP_SIZE_NOT_MET",
        "BOOKING_WINDOW_CLOSED",
        "ADVANCE_BOOKING_REQUIRED",
        "PAST_DATE_NOT_ALLOWED",
        "INVALID_TIME_SLOT",
        "CONCURRENT_BOOKING_ATTEMPT",
        "BOOKING_NOT_FOUND",
        "BOOKING_ALREADY_CONFIRMED",
        "BOOKING_ALREADY_CANCELLED",
        "BOOKING_ALREADY_COMPLETED",
        "CANCELLATION_PERIOD_EXPIRED",
        "RESCHEDULE_PERIOD_EXPIRED",
        "CANCELLATION_FEE_APPLIES",
        "NO_SHOW_FEE_APPLIES",
        "WAITLIST_FULL",
        "WAITLIST_ENTRY_EXPIRED",
        "TEMPORARY_SYSTEM_ERROR",
    ]

    def __init__(
        self,
        message: str,
        booking_id: Optional[str] = None,
        service_id: Optional[str] = None,
        time_slot: Optional[str] = None,
        code: str = "BOOKING_ERROR",
        status_code: Optional[int] = 400,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.booking_id = booking_id
        self.service_id = service_id
        self.time_slot = time_slot

        booking_details = {
            "booking_id": booking_id,
            "service_id": service_id,
            "time_slot": time_slot,
        }

        # Determine if retryable based on error code
        retryable_codes = [
            "SLOT_TEMPORARILY_UNAVAILABLE",
            "CONCURRENT_BOOKING_ATTEMPT",
            "TEMPORARY_SYSTEM_ERROR",
        ]
        retryable = code in retryable_codes

        if details:
            booking_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=booking_details,
            request_id=request_id,
            retryable=retryable,
        )


class ConfigurationError(MariiaHubError):
    """
    Configuration-related errors.
    """

    def __init__(
        self,
        message: str,
        config_key: Optional[str] = None,
        config_value: Optional[Any] = None,
        code: str = "CONFIGURATION_ERROR",
        status_code: Optional[int] = 500,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.config_key = config_key
        self.config_value = config_value

        config_details = {
            "config_key": config_key,
            "config_value": config_value,
        }

        if details:
            config_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=config_details,
            request_id=request_id,
            retryable=False,
        )


class BusinessLogicError(MariiaHubError):
    """
    Business logic validation errors.
    """

    def __init__(
        self,
        message: str,
        business_rule: Optional[str] = None,
        entity: Optional[str] = None,
        entity_id: Optional[str] = None,
        code: str = "BUSINESS_LOGIC_ERROR",
        status_code: Optional[int] = 422,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.business_rule = business_rule
        self.entity = entity
        self.entity_id = entity_id

        business_details = {
            "business_rule": business_rule,
            "entity": entity,
            "entity_id": entity_id,
        }

        if details:
            business_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=business_details,
            request_id=request_id,
            retryable=False,
        )


class ExternalServiceError(MariiaHubError):
    """
    External service integration errors.
    """

    EXTERNAL_SERVICE_CODES = [
        "SERVICE_UNAVAILABLE",
        "SERVICE_TIMEOUT",
        "SERVICE_ERROR",
        "SERVICE_MAINTENANCE",
        "SERVICE_DEPRECATED",
        "SERVICE_RATE_LIMITED",
        "SERVICE_QUOTA_EXCEEDED",
        "SERVICE_AUTH_FAILED",
        "SERVICE_INVALID_RESPONSE",
        "SERVICE_CONNECTION_FAILED",
        "BOOKSY_API_ERROR",
        "BOOKSY_SYNC_FAILED",
        "STRIPE_API_ERROR",
        "EMAIL_SERVICE_ERROR",
        "SMS_SERVICE_ERROR",
        "CALENDAR_SERVICE_ERROR",
        "POLISH_SERVICE_ERROR",
    ]

    def __init__(
        self,
        message: str,
        service: Optional[str] = None,
        external_error: Optional[str] = None,
        external_code: Optional[str] = None,
        code: str = "EXTERNAL_SERVICE_ERROR",
        status_code: Optional[int] = 502,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.service = service
        self.external_error = external_error
        self.external_code = external_code

        service_details = {
            "service": service,
            "external_error": external_error,
            "external_code": external_code,
        }

        # Determine if retryable based on error code
        retryable_codes = [
            "SERVICE_UNAVAILABLE",
            "SERVICE_TIMEOUT",
            "SERVICE_RATE_LIMITED",
            "TEMPORARY_FAILURE",
        ]
        retryable = code in retryable_codes

        if details:
            service_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=service_details,
            request_id=request_id,
            retryable=retryable,
        )


class PolishMarketError(BusinessLogicError):
    """
    Polish market specific errors.
    """

    POLISH_ERROR_CODES = [
        "POLISH_BUSINESS_HOURS_VIOLATION",
        "POLISH_HOLIDAY_VIOLATION",
        "NIP_VALIDATION_FAILED",
        "REGON_VALIDATION_FAILED",
        "KRS_VALIDATION_FAILED",
        "PESEL_VALIDATION_FAILED",
        "POLISH_POSTAL_CODE_INVALID",
        "POLISH_PHONE_INVALID",
        "POLISH_BANK_ACCOUNT_INVALID",
        "VAT_RULE_VIOLATION",
        "INVOICE_REQUIREMENT_VIOLATION",
        "CONSUMER_RIGHTS_VIOLATION",
        "GDPR_COMPLIANCE_VIOLATION",
        "POLISH_PAYMENT_METHOD_ERROR",
        "JPK_REPORTING_ERROR",
        "POLISH_TAX_REGULATION_VIOLATION",
    ]

    def __init__(
        self,
        message: str,
        polish_rule: Optional[str] = None,
        polish_requirement: Optional[str] = None,
        code: str = "POLISH_MARKET_ERROR",
        status_code: Optional[int] = 422,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.polish_rule = polish_rule
        self.polish_requirement = polish_requirement

        polish_details = {
            "polish_rule": polish_rule,
            "polish_requirement": polish_requirement,
        }

        if details:
            polish_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=polish_details,
            request_id=request_id,
            retryable=False,
        )


class WebSocketError(MariiaHubError):
    """
    WebSocket-related errors.
    """

    def __init__(
        self,
        message: str,
        ws_code: Optional[int] = None,
        ws_reason: Optional[str] = None,
        code: str = "WEBSOCKET_ERROR",
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        self.ws_code = ws_code
        self.ws_reason = ws_reason

        ws_details = {
            "ws_code": ws_code,
            "ws_reason": ws_reason,
        }

        # Determine if retryable based on error code
        retryable_codes = [
            "WEBSOCKET_CONNECTION_LOST",
            "WEBSOCKET_TIMEOUT",
            "WEBSOCKET_SERVER_ERROR",
        ]
        retryable = code in retryable_codes

        if details:
            ws_details.update(details)

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=ws_details,
            request_id=request_id,
            retryable=retryable,
        )


class NetworkError(MariiaHubError):
    """
    Network-related errors.
    """

    NETWORK_ERROR_CODES = [
        "NETWORK_ERROR",
        "NETWORK_OFFLINE",
        "TIMEOUT",
        "CONNECTION_REFUSED",
        "DNS_RESOLUTION_FAILED",
        "SSL_ERROR",
        "PROXY_ERROR",
        "INVALID_URL",
        "MAX_REDIRECTS_EXCEEDED",
        "REQUEST_TOO_LARGE",
        "RESPONSE_TOO_LARGE",
        "INVALID_RESPONSE_FORMAT",
        "PROTOCOL_ERROR",
        "WEBSOCKET_CONNECTION_FAILED",
        "WEBSOCKET_DISCONNECTED",
        "WEBSOCKET_ERROR",
    ]

    def __init__(
        self,
        message: str,
        code: str = "NETWORK_ERROR",
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ):
        # Determine if retryable based on error code
        non_retryable_codes = [
            "NETWORK_OFFLINE",
            "DNS_RESOLUTION_FAILED",
            "INVALID_URL",
        ]
        retryable = code not in non_retryable_codes

        super().__init__(
            message=message,
            code=code,
            status_code=status_code,
            details=details,
            request_id=request_id,
            retryable=retryable,
        )


class ErrorFactory:
    """
    Factory for creating appropriate exception instances from API responses.
    """

    @staticmethod
    def from_response(
        response_data: Dict[str, Any],
        status_code: Optional[int] = None,
        request_id: Optional[str] = None,
    ) -> MariiaHubError:
        """
        Create appropriate exception from API response data.

        Args:
            response_data: Response data from API
            status_code: HTTP status code
            request_id: Request ID for tracing

        Returns:
            Appropriate exception instance
        """
        code = response_data.get("code", "UNKNOWN_ERROR")
        message = response_data.get("message", "An unknown error occurred")
        details = response_data.get("details", {})

        # Determine exception class based on status code and error code
        if status_code == 401 or status_code == 403:
            return AuthenticationError(
                message=message,
                code=code,
                status_code=status_code,
                details=details,
                request_id=request_id,
            )

        if status_code == 400:
            if code.startswith("VALIDATION_"):
                return ValidationError(
                    message=message,
                    field=details.get("field"),
                    value=details.get("value"),
                    constraint=details.get("constraint"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )
            elif code.startswith("BOOKING_"):
                return BookingError(
                    message=message,
                    booking_id=details.get("booking_id"),
                    service_id=details.get("service_id"),
                    time_slot=details.get("time_slot"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )
            elif code.startswith("PAYMENT_"):
                return PaymentError(
                    message=message,
                    payment_id=details.get("payment_id"),
                    payment_intent_id=details.get("payment_intent_id"),
                    gateway=details.get("gateway"),
                    decline_code=details.get("decline_code"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )

        if status_code == 429:
            return RateLimitError(
                message=message,
                retry_after=details.get("retry_after"),
                limit=details.get("limit"),
                remaining=details.get("remaining"),
                reset=details.get("reset"),
                code=code,
                status_code=status_code,
                details=details,
                request_id=request_id,
            )

        if status_code == 422:
            if code.startswith("POLISH_"):
                return PolishMarketError(
                    message=message,
                    polish_rule=details.get("polish_rule"),
                    polish_requirement=details.get("polish_requirement"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )
            else:
                return BusinessLogicError(
                    message=message,
                    business_rule=details.get("business_rule"),
                    entity=details.get("entity"),
                    entity_id=details.get("entity_id"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )

        if status_code and status_code >= 500:
            if code.startswith("EXTERNAL_"):
                return ExternalServiceError(
                    message=message,
                    service=details.get("service"),
                    external_error=details.get("external_error"),
                    external_code=details.get("external_code"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )
            elif code.startswith("CONFIGURATION_"):
                return ConfigurationError(
                    message=message,
                    config_key=details.get("config_key"),
                    config_value=details.get("config_value"),
                    code=code,
                    status_code=status_code,
                    details=details,
                    request_id=request_id,
                )

        # Default to API error
        return APIError(
            message=message,
            code=code,
            status_code=status_code,
            details=details,
            request_id=request_id,
        )

    @staticmethod
    def from_exception(
        exception: Exception,
        code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> MariiaHubError:
        """
        Create appropriate exception from a generic exception.

        Args:
            exception: The original exception
            code: Error code to use
            details: Additional details

        Returns:
            Appropriate exception instance
        """
        if isinstance(exception, MariiaHubError):
            return exception

        # Network-related errors
        if isinstance(exception, (ConnectionError, OSError)):
            return NetworkError(
                message=str(exception),
                code=code or "NETWORK_ERROR",
                details=details,
            )

        # Timeout errors
        if "timeout" in str(exception).lower():
            return NetworkError(
                message=str(exception),
                code=code or "TIMEOUT",
                details=details,
            )

        # Default error
        return MariiaHubError(
            message=str(exception),
            code=code or "UNKNOWN_ERROR",
            details=details,
        )


# Exception registry for custom error handling
class ExceptionRegistry:
    """
    Registry for custom exception handlers.
    """

    def __init__(self):
        self._handlers: Dict[Type[Exception], callable] = {}

    def register(
        self,
        exception_type: Type[Exception],
        handler: callable,
    ) -> None:
        """
        Register a handler for a specific exception type.

        Args:
            exception_type: Exception class to handle
            handler: Handler function that takes the exception
        """
        self._handlers[exception_type] = handler

    def unregister(self, exception_type: Type[Exception]) -> None:
        """
        Unregister a handler for a specific exception type.

        Args:
            exception_type: Exception class to unregister
        """
        if exception_type in self._handlers:
            del self._handlers[exception_type]

    def handle(self, exception: Exception) -> None:
        """
        Handle an exception using registered handlers.

        Args:
            exception: Exception to handle
        """
        for exc_type, handler in self._handlers.items():
            if isinstance(exception, exc_type):
                handler(exception)
                break

    def clear(self) -> None:
        """Clear all registered handlers."""
        self._handlers.clear()


# Global exception registry
exception_registry = ExceptionRegistry()