import time
from .base import PaymentProvider


class MockProvider(PaymentProvider):
    """
    Default provider used until real MTN MoMo / Airtel Money credentials
    are configured. Simulates a phone approving the payment prompt a few
    seconds after the request is made, so the whole flow (pending -> polling
    -> confirmed -> listing published) can be built and tested for real
    before a merchant account exists.
    """

    name = "mock"

    def __init__(self):
        self._requested_at = {}

    def request_to_pay(self, phone, amount, currency, reference, payer_message):
        self._requested_at[reference] = time.time()
        return "PENDING"

    def check_status(self, reference):
        started = self._requested_at.get(reference)
        if started is None:
            return "PENDING"
        return "SUCCESSFUL" if (time.time() - started) >= 3 else "PENDING"
