"""
MTN Mobile Money (MoMo) Collections integration - the "Request to Pay" API,
which is exactly the flow you asked for: the app asks MTN to push a payment
prompt straight to a customer's phone, and the customer approves it there.

This talks to MTN's real Collections API. To go live:
  1. Create an account at https://momodeveloper.mtn.com
  2. Subscribe to the "Collections" product to get a Subscription Key
  3. Create an API user + API key against the sandbox (or your live product
     once MTN approves it)
  4. Set these environment variables (see backend/.env.example):
       MOMO_SUBSCRIPTION_KEY
       MOMO_API_USER
       MOMO_API_KEY
       MOMO_ENVIRONMENT      ("sandbox" or "mtnrwanda" for production)
       MOMO_BASE_URL         (sandbox default is provided below)
Once those are set, backend/payments/__init__.py automatically switches
from MockProvider to this class - nothing else in the app changes.

NOTE: this code is written against MTN's documented API shape but has not
been run against a live MTN account (no sandbox credentials were available
while building this). Test it against your own sandbox credentials before
trusting it with real money, and check momodeveloper.mtn.com for any
endpoint changes since this was written.
"""
import os
import uuid
import requests
from .base import PaymentProvider

DEFAULT_BASE_URL = "https://sandbox.momodeveloper.mtn.com"


class MTNMoMoProvider(PaymentProvider):
    name = "mtn_momo"

    def __init__(self):
        self.subscription_key = os.environ["MOMO_SUBSCRIPTION_KEY"]
        self.api_user = os.environ["MOMO_API_USER"]
        self.api_key = os.environ["MOMO_API_KEY"]
        self.environment = os.environ.get("MOMO_ENVIRONMENT", "sandbox")
        self.base_url = os.environ.get("MOMO_BASE_URL", DEFAULT_BASE_URL)

    def _get_access_token(self):
        resp = requests.post(
            f"{self.base_url}/collection/token/",
            auth=(self.api_user, self.api_key),
            headers={"Ocp-Apim-Subscription-Key": self.subscription_key},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def request_to_pay(self, phone, amount, currency, reference, payer_message):
        token = self._get_access_token()
        digits = "".join(ch for ch in phone if ch.isdigit())
        if not digits.startswith("250"):
            digits = "250" + digits[-9:]
        resp = requests.post(
            f"{self.base_url}/collection/v1_0/requesttopay",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Reference-Id": reference,
                "X-Target-Environment": self.environment,
                "Ocp-Apim-Subscription-Key": self.subscription_key,
                "Content-Type": "application/json",
            },
            json={
                "amount": str(amount),
                "currency": currency,
                "externalId": reference,
                "payer": {"partyIdType": "MSISDN", "partyId": digits},
                "payerMessage": payer_message,
                "payeeNote": payer_message,
            },
            timeout=15,
        )
        if resp.status_code == 202:
            return "PENDING"
        resp.raise_for_status()
        return "PENDING"

    def check_status(self, reference):
        token = self._get_access_token()
        resp = requests.get(
            f"{self.base_url}/collection/v1_0/requesttopay/{reference}",
            headers={
                "Authorization": f"Bearer {token}",
                "X-Target-Environment": self.environment,
                "Ocp-Apim-Subscription-Key": self.subscription_key,
            },
            timeout=15,
        )
        resp.raise_for_status()
        status = resp.json().get("status", "PENDING")
        return status if status in ("SUCCESSFUL", "FAILED") else "PENDING"
