"""Custom Exception Classes for the Application."""
from typing import Any, Optional


class AppException(Exception):
    """Base application exception."""
    def __init__(self, message: str, status_code: int = 400, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.details = details


class NotFoundException(AppException):
    """Resource not found."""
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message=message, status_code=404, details=details)


class ValidationException(AppException):
    """Validation failed."""
    def __init__(self, message: str = "Validation failed", details: Optional[Any] = None):
        super().__init__(message=message, status_code=422, details=details)


class BusinessRuleException(AppException):
    """Business rule violation."""
    def __init__(self, message: str = "Business rule violation", details: Optional[Any] = None):
        super().__init__(message=message, status_code=400, details=details)
