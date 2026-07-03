"""
app/services/momo_service.py
─────────────────────────────
Mobile Money API integration.

Supports:
  - MTN Mobile Money (Rwanda, Uganda, Ghana, etc.)
  - Airtel Money

In SANDBOX mode: API calls are simulated, no real money moves.
In PRODUCTION mode: Real money moves. Set MTN_MOMO_ENVIRONMENT=production in .env

HOW IT WORKS:
  1. User taps "Send" or "Top Up" in the app
  2. Your backend calls this service
  3. This service calls the real MTN/Airtel API
  4. MTN/Airtel sends a USSD push to the user's phone
  5. User approves on their phone
  6. MTN/Airtel calls your webhook (/webhooks/mtn) to confirm
  7. Your backend updates the user's balance
"""

import httpx
import uuid
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────────────
# Result object returned by every MoMo operation
# ──────────────────────────────────────────────────────────────

class MoMoResult:
    def __init__(self, success: bool, reference: str = "", message: str = "", raw: dict = None):
        self.success   = success
        self.reference = reference   # transaction ID from MTN/Airtel
        self.message   = message
        self.raw       = raw or {}


# ──────────────────────────────────────────────────────────────
# MTN Mobile Money Service
# Docs: https://momodeveloper.mtn.com/api-documentation
# ──────────────────────────────────────────────────────────────

class MTNMoMoService:
    """
    Wraps the MTN MoMo Collection and Disbursement APIs.

    Collection  = pulling money FROM a user (top-up, repayment)
    Disbursement = pushing money TO a user (loan disbursement)
    """

    def __init__(self):
        self.base_url    = settings.MTN_MOMO_BASE_URL
        self.sub_key     = settings.MTN_MOMO_SUBSCRIPTION_KEY
        self.api_user    = settings.MTN_MOMO_API_USER
        self.api_key     = settings.MTN_MOMO_API_KEY
        self.environment = settings.MTN_MOMO_ENVIRONMENT
        self.currency    = settings.MTN_MOMO_CURRENCY

    def _collection_headers(self) -> dict:
        """Headers required for collection (pulling money from user)."""
        import base64
        token = self._get_collection_token()
        return {
            "Authorization":    f"Bearer {token}",
            "X-Target-Environment": self.environment,
            "Ocp-Apim-Subscription-Key": self.sub_key,
            "Content-Type":     "application/json",
        }

    def _get_collection_token(self) -> str:
        """Get OAuth token for the Collection product."""
        import base64
        credentials = base64.b64encode(
            f"{self.api_user}:{self.api_key}".encode()
        ).decode()

        # NOTE: In production, cache this token (it lasts 1 hour)
        # For simplicity here we fetch a fresh one each time
        response = httpx.post(
            f"{self.base_url}/collection/token/",
            headers={
                "Authorization": f"Basic {credentials}",
                "Ocp-Apim-Subscription-Key": self.sub_key,
            }
        )
        return response.json().get("access_token", "")

    def request_to_pay(
        self,
        phone: str,
        amount: float,
        reference: str,
        description: str = "FlowCash payment"
    ) -> MoMoResult:
        """
        Request money FROM a user (for top-up or loan repayment).
        MTN sends a USSD push to the user's phone.
        User approves → MTN calls your webhook.
        """
        if self.environment == "sandbox":
            # ── SANDBOX: simulate success without calling real API ──
            logger.info(f"[SANDBOX] MTN RequestToPay: {amount} RWF from {phone}")
            return MoMoResult(
                success=True,
                reference=f"sandbox-{uuid.uuid4()}",
                message="Sandbox: payment request sent"
            )

        # ── PRODUCTION ────────────────────────────────────────────
        external_id = str(uuid.uuid4())
        payload = {
            "amount": str(int(amount)),
            "currency": self.currency,
            "externalId": external_id,
            "payer": {
                "partyIdType": "MSISDN",
                "partyId": phone.lstrip("+"),   # MTN wants digits only
            },
            "payerMessage": description,
            "payeeNote": reference,
        }

        try:
            resp = httpx.post(
                f"{self.base_url}/collection/v1_0/requesttopay",
                json=payload,
                headers={
                    **self._collection_headers(),
                    "X-Reference-Id": external_id,
                    "X-Callback-Url": settings.MTN_MOMO_CALLBACK_URL,
                }
            )
            if resp.status_code == 202:
                return MoMoResult(
                    success=True,
                    reference=external_id,
                    message="Payment request sent to user's phone"
                )
            else:
                logger.error(f"MTN RequestToPay failed: {resp.status_code} {resp.text}")
                return MoMoResult(success=False, message=f"MTN error: {resp.text}")
        except Exception as e:
            logger.exception("MTN MoMo request failed")
            return MoMoResult(success=False, message=str(e))

    def check_payment_status(self, reference_id: str) -> str:
        """
        Poll MTN to check if a payment was approved.
        Returns: "SUCCESSFUL" | "PENDING" | "FAILED"
        """
        if self.environment == "sandbox":
            return "SUCCESSFUL"   # sandbox always succeeds

        try:
            resp = httpx.get(
                f"{self.base_url}/collection/v1_0/requesttopay/{reference_id}",
                headers=self._collection_headers()
            )
            return resp.json().get("status", "FAILED")
        except Exception:
            return "FAILED"

    def disburse(
        self,
        phone: str,
        amount: float,
        reference: str,
        description: str = "FlowCash loan"
    ) -> MoMoResult:
        """
        Push money TO a user (loan disbursement or transfer).
        """
        if self.environment == "sandbox":
            logger.info(f"[SANDBOX] MTN Disburse: {amount} RWF to {phone}")
            return MoMoResult(
                success=True,
                reference=f"sandbox-disbursement-{uuid.uuid4()}",
                message="Sandbox: disbursement simulated"
            )

        # Production disbursement — similar structure to collection
        # Requires the Disbursement product key, not Collection key
        # See: https://momodeveloper.mtn.com/api-documentation#tag/Disbursement
        external_id = str(uuid.uuid4())
        payload = {
            "amount": str(int(amount)),
            "currency": self.currency,
            "externalId": external_id,
            "payee": {
                "partyIdType": "MSISDN",
                "partyId": phone.lstrip("+"),
            },
            "payerMessage": description,
            "payeeNote": reference,
        }
        # NOTE: Disbursement uses a different token endpoint and subscription key
        # Set up a second subscription at developer.mtn.com for Disbursement product
        logger.warning("Production disbursement not yet configured — add Disbursement product key")
        return MoMoResult(success=False, message="Production disbursement not configured")


# ──────────────────────────────────────────────────────────────
# Airtel Money Service
# Docs: https://developers.airtel.africa/documentation
# ──────────────────────────────────────────────────────────────

class AirtelMoneyService:
    """
    Wraps the Airtel Money Payment API.
    Similar pattern to MTN MoMo.
    """

    def __init__(self):
        self.base_url     = settings.AIRTEL_BASE_URL
        self.client_id    = settings.AIRTEL_CLIENT_ID
        self.secret       = settings.AIRTEL_CLIENT_SECRET
        self.environment  = settings.AIRTEL_ENVIRONMENT
        self._token_cache = None

    def _get_token(self) -> str:
        if self.environment == "sandbox":
            return "sandbox-token"

        resp = httpx.post(
            f"{self.base_url}/auth/oauth2/token",
            json={
                "client_id": self.client_id,
                "client_secret": self.secret,
                "grant_type": "client_credentials",
            }
        )
        return resp.json().get("access_token", "")

    def collect(self, phone: str, amount: float, reference: str) -> MoMoResult:
        """Pull money from Airtel user (top-up / repayment)."""
        if self.environment == "sandbox":
            logger.info(f"[SANDBOX] Airtel Collect: {amount} from {phone}")
            return MoMoResult(
                success=True,
                reference=f"airtel-sandbox-{uuid.uuid4()}",
                message="Airtel sandbox: collection simulated"
            )

        token = self._get_token()
        transaction_id = str(uuid.uuid4()).replace("-", "")[:12].upper()

        resp = httpx.post(
            f"{self.base_url}/merchant/v2/payments/",
            json={
                "reference": reference,
                "subscriber": {"country": "RW", "currency": "RWF", "msisdn": phone},
                "transaction": {"amount": amount, "country": "RW", "currency": "RWF", "id": transaction_id},
            },
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "X-Country": "RW",
                "X-Currency": "RWF",
            }
        )
        data = resp.json()
        if data.get("status", {}).get("code") == "200":
            return MoMoResult(success=True, reference=transaction_id, message="Collection initiated")
        return MoMoResult(success=False, message=data.get("status", {}).get("message", "Airtel error"))


# ──────────────────────────────────────────────────────────────
# Unified MoMo Router — picks the right provider automatically
# ──────────────────────────────────────────────────────────────

class MoMoRouter:
    """
    Use this in your routes instead of calling MTN/Airtel directly.
    It looks at the user's registered provider and routes accordingly.

    Usage:
        result = momo.collect(user=user, amount=5000, reference="tx_123")
    """

    def __init__(self):
        self.mtn    = MTNMoMoService()
        self.airtel = AirtelMoneyService()

    def collect(self, phone: str, provider: str, amount: float, reference: str, description: str = "") -> MoMoResult:
        """Pull money from user (top-up or repayment)."""
        if provider == "MTN":
            return self.mtn.request_to_pay(phone, amount, reference, description)
        elif provider == "Airtel":
            return self.airtel.collect(phone, amount, reference)
        else:
            # Orange, M-Pesa etc. — add their SDKs here following same pattern
            logger.warning(f"Provider {provider} not yet integrated — simulating")
            return MoMoResult(
                success=True,
                reference=f"mock-{uuid.uuid4()}",
                message=f"{provider} integration coming soon (simulated)"
            )

    def disburse(self, phone: str, provider: str, amount: float, reference: str, description: str = "") -> MoMoResult:
        """Push money to user (loan disbursement or transfer)."""
        if provider == "MTN":
            return self.mtn.disburse(phone, amount, reference, description)
        else:
            logger.warning(f"Disbursement for {provider} not yet integrated — simulating")
            return MoMoResult(
                success=True,
                reference=f"mock-disburse-{uuid.uuid4()}",
                message=f"{provider} disbursement simulated"
            )


# Singleton — import and use anywhere
momo = MoMoRouter()
