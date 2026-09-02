import os

_provider_instance = None


def get_provider():
    """
    Returns the active payment provider based on environment variables.
    Falls back to the mock provider so the app runs out of the box.
    Set MOMO_API_USER / MOMO_API_KEY / MOMO_SUBSCRIPTION_KEY to switch to
    real MTN MoMo Collections billing.

    Cached as a singleton per process so the mock provider's in-memory
    "pending requests" state survives across requests during local dev.
    """
    global _provider_instance
    if _provider_instance is not None:
        return _provider_instance
    if os.environ.get("MOMO_SUBSCRIPTION_KEY") and os.environ.get("MOMO_API_USER") and os.environ.get("MOMO_API_KEY"):
        from .mtn_momo import MTNMoMoProvider
        _provider_instance = MTNMoMoProvider()
    else:
        from .mock import MockProvider
        _provider_instance = MockProvider()
    return _provider_instance
