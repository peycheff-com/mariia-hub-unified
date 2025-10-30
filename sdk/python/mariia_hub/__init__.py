"""
Mariia Hub Python SDK

A comprehensive Python SDK for the Mariia Hub beauty and fitness booking platform API
with full async support and Polish market features.
"""

__version__ = "1.0.0"
__author__ = "Mariia Hub Team"
__email__ = "api@mariia-hub.com"
__license__ = "MIT"

# Core imports
from .client import MariiaHubClient
from .config import SDKConfig, APIConfig, WebSocketConfig, PolishMarketConfig

# API classes
from .api.bookings import BookingsAPI
from .api.services import ServicesAPI
from .api.payments import PaymentsAPI
from .api.auth import AuthAPI
from .api.users import UsersAPI
from .api.admin import AdminAPI
from .api.websockets import WebSocketAPI

# Exceptions
from .exceptions import (
    MariiaHubError,
    APIError,
    AuthenticationError,
    ValidationError,
    RateLimitError,
    PaymentError,
    BookingError,
    ConfigurationError,
    BusinessLogicError,
    ExternalServiceError,
    PolishMarketError,
    WebSocketError,
    NetworkError,
)

# Utilities
from .utils.polish import PolishValidator
from .utils.metrics import MetricsCollector

# Type exports for type checking
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .types import (
        # Common types
        ApiResponse,
        QueryParams,
        ListParams,
        Currency,
        Language,
        LocationType,
        ServiceCategory,
        BookingStatus,
        PaymentStatus,

        # Booking types
        Booking,
        CreateBookingRequest,
        BookingAvailability,

        # Service types
        Service,
        ServiceAvailability,

        # Payment types
        Payment,
        PaymentIntent,

        # User types
        User,

        # Polish market types
        PolishAddress,
        PolishPhoneNumber,
        NIP,
        REGON,
        PESEL,
    )

# Export main classes
__all__ = [
    # Version info
    "__version__",
    "__author__",
    "__email__",
    "__license__",

    # Main client
    "MariiaHubClient",

    # Configuration
    "SDKConfig",
    "APIConfig",
    "WebSocketConfig",
    "PolishMarketConfig",

    # API classes
    "BookingsAPI",
    "ServicesAPI",
    "PaymentsAPI",
    "AuthAPI",
    "UsersAPI",
    "AdminAPI",
    "WebSocketAPI",

    # Exceptions
    "MariiaHubError",
    "APIError",
    "AuthenticationError",
    "ValidationError",
    "RateLimitError",
    "PaymentError",
    "BookingError",
    "ConfigurationError",
    "BusinessLogicError",
    "ExternalServiceError",
    "PolishMarketError",
    "WebSocketError",
    "NetworkError",

    # Utilities
    "PolishValidator",
    "MetricsCollector",
]

# Convenience functions for creating clients
def create_client(
    api_key: str | None = None,
    config: SDKConfig | None = None,
    **kwargs
) -> MariiaHubClient:
    """
    Create and return a new MariiaHubClient instance.

    Args:
        api_key: API key for authentication
        config: SDK configuration
        **kwargs: Additional configuration options

    Returns:
        Configured MariiaHubClient instance

    Example:
        >>> client = create_client(
        ...     api_key="your-api-key",
        ...     debug=True
        ... )
    """
    return MariiaHubClient(api_key=api_key, config=config, **kwargs)


def create_polish_client(
    api_key: str | None = None,
    language: str = "pl",
    currency: str = "PLN",
    timezone: str = "Europe/Warsaw",
    enable_polish_payment_methods: bool = True,
    enable_polish_invoicing: bool = True,
    enable_polish_verification: bool = False,
    **kwargs
) -> MariiaHubClient:
    """
    Create a MariiaHubClient configured for the Polish market.

    Args:
        api_key: API key for authentication
        language: Language code (default: "pl")
        currency: Currency code (default: "PLN")
        timezone: Timezone (default: "Europe/Warsaw")
        enable_polish_payment_methods: Enable Polish payment methods
        enable_polish_invoicing: Enable Polish invoicing
        enable_polish_verification: Enable Polish business verification
        **kwargs: Additional configuration options

    Returns:
        MariiaHubClient configured for Polish market

    Example:
        >>> client = create_polish_client(
        ...     api_key="your-api-key",
        ...     enable_polish_payment_methods=True
        ... )
    """
    polish_config = PolishMarketConfig(
        language=language,
        currency=currency,
        timezone=timezone,
        enable_polish_payment_methods=enable_polish_payment_methods,
        enable_polish_invoicing=enable_polish_invoicing,
        enable_polish_verification=enable_polish_verification
    )

    return MariiaHubClient(api_key=api_key, config=polish_config, **kwargs)


def create_mobile_client(
    api_key: str | None = None,
    timeout: float = 15.0,
    retries: int = 2,
    **kwargs
) -> MariiaHubClient:
    """
    Create a MariiaHubClient optimized for mobile applications.

    Args:
        api_key: API key for authentication
        timeout: Request timeout in seconds (default: 15.0)
        retries: Number of retry attempts (default: 2)
        **kwargs: Additional configuration options

    Returns:
        MariiaHubClient optimized for mobile use

    Example:
        >>> client = create_mobile_client(
        ...     api_key="your-api-key",
        ...     timeout=10.0
        ... )
    """
    mobile_config = SDKConfig(
        api=APIConfig(timeout=timeout, retries=retries),
        enable_metrics=False,
        enable_analytics=False
    )

    return MariiaHubClient(api_key=api_key, config=mobile_config, **kwargs)


def create_server_client(
    api_key: str | None = None,
    timeout: float = 60.0,
    retries: int = 5,
    **kwargs
) -> MariiaHubClient:
    """
    Create a MariiaHubClient optimized for server-side applications.

    Args:
        api_key: API key for authentication
        timeout: Request timeout in seconds (default: 60.0)
        retries: Number of retry attempts (default: 5)
        **kwargs: Additional configuration options

    Returns:
        MariiaHubClient optimized for server use

    Example:
        >>> client = create_server_client(
        ...     api_key="your-api-key",
        ...     timeout=30.0
        ... )
    """
    server_config = SDKConfig(
        api=APIConfig(timeout=timeout, retries=retries),
        enable_metrics=True,
        enable_analytics=True,
        debug=False
    )

    return MariiaHubClient(api_key=api_key, config=server_config, **kwargs)


# Set up logging
import logging

logger = logging.getLogger(__name__)

# Configure package logger
def configure_logging(level: str = "INFO", format_string: str | None = None) -> None:
    """
    Configure logging for the Mariia Hub SDK.

    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        format_string: Custom format string for log messages
    """
    if format_string is None:
        format_string = (
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )

    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format=format_string
    )

    logger.info(f"Mariia Hub SDK v{__version__} logging configured")


# Version info utility
def get_version() -> str:
    """Get the SDK version."""
    return __version__


def get_version_info() -> dict:
    """Get detailed version information."""
    return {
        "version": __version__,
        "author": __author__,
        "email": __email__,
        "license": __license__,
        "python_version": ".".join(map(str, __import__("sys").version_info[:3]))
    }