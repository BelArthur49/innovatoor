class PaymentProvider:
    """
    Every payment provider (mock, MTN MoMo, Airtel Money, a card processor...)
    implements this same interface, so swapping providers never touches
    the rest of the app - only backend/payments/__init__.py's get_provider().
    """

    name = "base"

    def request_to_pay(self, phone, amount, currency, reference, payer_message):
        """
        Ask the provider to push a payment prompt to `phone` for `amount`.
        Must return one of: "PENDING", "SUCCESSFUL", "FAILED".
        `reference` is our own PaymentRequest.reference - pass it through as
        the provider's externalId/reference so webhooks can be matched back.
        """
        raise NotImplementedError

    def check_status(self, reference):
        """
        Poll the provider for the current status of a previously requested
        payment. Must return one of: "PENDING", "SUCCESSFUL", "FAILED".
        """
        raise NotImplementedError
