import os
import io
import uuid
import json
from functools import wraps

from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from models import (
    db, Listing, ListingPhoto, FeeConfig, AdminUser, PaymentRequest,
    HOUSE_CATEGORIES, PLOT_CATEGORIES, LISTING_TYPES, DISTRICTS,
)
from payments import get_provider

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "static", "uploads")
ALLOWED_EXT = {"png", "jpg", "jpeg", "webp", "gif"}
MAX_DIMENSION = 1400


def create_app():
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'innonzu.db')}")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["MAX_CONTENT_LENGTH"] = 12 * 1024 * 1024  # 12MB per request

    allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
    CORS(app, supports_credentials=True, origins=[allowed_origin] if allowed_origin != "*" else "*")

    db.init_app(app)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with app.app_context():
        db.create_all()
        _ensure_fee_config()
        _ensure_admin_user()

    register_routes(app)
    return app


def _ensure_fee_config():
    if FeeConfig.query.first() is None:
        db.session.add(FeeConfig())
        db.session.commit()


def _ensure_admin_user():
    if AdminUser.query.first() is None:
        username = os.environ.get("ADMIN_USERNAME", "admin")
        password = os.environ.get("ADMIN_PASSWORD", "innonzu-admin")
        db.session.add(AdminUser(username=username, password_hash=generate_password_hash(password)))
        db.session.commit()
        print(f"[innonzu] Created default admin user '{username}'. "
              f"Set ADMIN_USERNAME / ADMIN_PASSWORD env vars to change this.")


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("admin_id"):
            return jsonify({"error": "Admin login required"}), 401
        return fn(*args, **kwargs)
    return wrapper


def base_url():
    return request.host_url.rstrip("/")


def register_routes(app):

    # ---------------------------------------------------------------- listings
    @app.get("/api/listings")
    def list_listings():
        q = Listing.query.filter_by(status="published")
        type_ = request.args.get("type")
        district = request.args.get("district")
        if type_ and type_ != "all":
            q = q.filter_by(type=type_)
        if district and district != "all":
            q = q.filter_by(district=district)
        q = q.order_by(Listing.created_at.desc())
        return jsonify([l.to_summary(base_url()) for l in q.all()])

    @app.get("/api/listings/<int:listing_id>")
    def get_listing(listing_id):
        l = Listing.query.get_or_404(listing_id)
        return jsonify(l.to_detail(base_url()))

    @app.post("/api/listings/draft")
    def create_draft():
        data = request.get_json(force=True) or {}
        if data.get("type") not in LISTING_TYPES:
            return jsonify({"error": "type must be one of " + ", ".join(LISTING_TYPES)}), 400

        l = Listing(
            type=data["type"], status="draft",
            title=data.get("title", "").strip(),
            district=data.get("district", ""),
            area=data.get("area", "").strip(),
            street=data.get("street", "").strip(),
            description=data.get("description", "").strip(),
            price=int(data.get("price") or 0),
            owner_name=data.get("ownerName", "").strip(),
            owner_phone=normalize_phone(data.get("ownerPhone", "")),
            title_deed=bool(data.get("titleDeed")),
        )
        if l.type == "plot":
            l.plot_size = float(data.get("size") or 0)
            l.plot_unit = data.get("unit", "sqm")
            l.water_nearby = bool(data.get("waterNearby"))
            l.electricity_nearby = bool(data.get("electricityNearby"))
        else:
            l.bedrooms = int(data.get("beds") or 0)
            l.bathrooms = int(data.get("baths") or 0)
            l.year_built = int(data["yearBuilt"]) if data.get("yearBuilt") else None
            l.renovated = bool(data.get("renovated"))
            l.year_renovated = int(data["yearRenovated"]) if data.get("yearRenovated") else None
            l.water_electricity = data.get("waterElectricity")

        if not l.title or not l.area or not l.price or not l.owner_name or not l.owner_phone:
            return jsonify({"error": "title, area, price, ownerName and ownerPhone are required"}), 400

        db.session.add(l)
        db.session.commit()
        return jsonify({"id": l.id}), 201

    @app.post("/api/listings/<int:listing_id>/photos")
    def upload_photo(listing_id):
        l = Listing.query.get_or_404(listing_id)
        category = request.form.get("category")
        valid_cats = l.categories()
        if category not in valid_cats:
            return jsonify({"error": "invalid category for this listing type"}), 400
        file = request.files.get("file")
        if not file or "." not in file.filename:
            return jsonify({"error": "no file provided"}), 400
        ext = file.filename.rsplit(".", 1)[1].lower()
        if ext not in ALLOWED_EXT:
            return jsonify({"error": "unsupported file type"}), 400

        existing = ListingPhoto.query.filter_by(listing_id=l.id, category=category).count()
        if existing >= 4:
            return jsonify({"error": "maximum 4 photos per category"}), 400

        fname = f"{uuid.uuid4().hex}.jpg"
        folder = os.path.join(UPLOAD_DIR, str(l.id))
        os.makedirs(folder, exist_ok=True)
        full_path = os.path.join(folder, fname)

        if HAS_PIL:
            img = Image.open(file.stream).convert("RGB")
            img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))
            img.save(full_path, "JPEG", quality=82)
        else:
            file.save(full_path)

        rel_url = f"/static/uploads/{l.id}/{fname}"
        photo = ListingPhoto(listing_id=l.id, category=category, url=rel_url, sort_order=existing)
        db.session.add(photo)
        db.session.commit()
        return jsonify({"id": photo.id, "url": base_url() + rel_url}), 201

    @app.delete("/api/listings/<int:listing_id>/photos/<int:photo_id>")
    def delete_photo(listing_id, photo_id):
        photo = ListingPhoto.query.filter_by(id=photo_id, listing_id=listing_id).first_or_404()
        db.session.delete(photo)
        db.session.commit()
        return jsonify({"deleted": True})

    @app.patch("/api/listings/<int:listing_id>")
    def update_listing(listing_id):
        l = Listing.query.get_or_404(listing_id)
        data = request.get_json(force=True) or {}
        if not _owns_or_admin(l, data):
            return jsonify({"error": "not authorized for this listing"}), 403
        if "price" in data:
            l.price = int(data["price"])
        if "status" in data and data["status"] in ("published", "rented", "sold", "removed"):
            l.status = data["status"]
        db.session.commit()
        return jsonify(l.to_summary(base_url()))

    @app.delete("/api/listings/<int:listing_id>")
    def delete_listing(listing_id):
        l = Listing.query.get_or_404(listing_id)
        if not _owns_or_admin(l, request.args):
            return jsonify({"error": "not authorized for this listing"}), 403
        db.session.delete(l)
        db.session.commit()
        return jsonify({"deleted": True})

    @app.get("/api/listings/mine")
    def my_listings():
        phone = normalize_phone(request.args.get("phone", ""))
        if not phone:
            return jsonify({"error": "phone is required"}), 400
        rows = Listing.query.filter_by(owner_phone=phone).order_by(Listing.created_at.desc()).all()
        return jsonify([l.to_summary(base_url()) for l in rows])

    def _owns_or_admin(listing, data_source):
        if session.get("admin_id"):
            return True
        phone = normalize_phone(data_source.get("ownerPhone", "") if hasattr(data_source, "get") else "")
        return phone and phone == listing.owner_phone

    # ------------------------------------------------------------------ fees
    @app.get("/api/fees")
    def get_fees():
        return jsonify(FeeConfig.query.first().to_dict())

    # -------------------------------------------------------------- payments
    @app.post("/api/payments/request")
    def request_payment():
        data = request.get_json(force=True) or {}
        listing_id = data.get("listingId")
        phone = normalize_phone(data.get("phone", ""))
        l = Listing.query.get_or_404(listing_id)
        fees = FeeConfig.query.first()
        amount = {"rent": fees.rent_fee, "sale": fees.sale_fee, "plot": fees.plot_fee}[l.type]

        reference = str(uuid.uuid4())
        pr = PaymentRequest(reference=reference, listing_id=l.id, phone=phone,
                             amount=amount, currency=fees.currency)
        provider = get_provider()
        pr.provider = provider.name
        db.session.add(pr)
        db.session.commit()

        status = provider.request_to_pay(
            phone=phone, amount=amount, currency=fees.currency,
            reference=reference, payer_message=f"Innonzu listing fee - {l.type}",
        )
        pr.status = status
        db.session.commit()
        return jsonify(pr.to_dict()), 201

    @app.get("/api/payments/<reference>")
    def payment_status(reference):
        pr = PaymentRequest.query.filter_by(reference=reference).first_or_404()
        if pr.status == "PENDING":
            provider = get_provider()
            pr.status = provider.check_status(reference)
            if pr.status == "SUCCESSFUL":
                listing = Listing.query.get(pr.listing_id)
                listing.status = "published"
            db.session.commit()
        return jsonify(pr.to_dict())

    @app.post("/api/payments/webhook/mtn")
    def mtn_webhook():
        """MTN MoMo calls this when a payment's status changes (production)."""
        payload = request.get_json(force=True) or {}
        reference = payload.get("externalId") or payload.get("referenceId")
        status = payload.get("status")
        pr = PaymentRequest.query.filter_by(reference=reference).first()
        if pr and status in ("SUCCESSFUL", "FAILED"):
            pr.status = status
            if status == "SUCCESSFUL":
                Listing.query.get(pr.listing_id).status = "published"
            db.session.commit()
        return jsonify({"received": True})

    # -------------------------------------------------------------------- ai
    @app.post("/api/search/smart")
    def smart_search():
        from ai import rank_listings
        data = request.get_json(force=True) or {}
        query = (data.get("query") or "").strip()
        listings = Listing.query.filter_by(status="published").all()
        ids, reasons = rank_listings(query, listings)
        return jsonify({"ids": ids, "reasons": reasons})

    @app.post("/api/ai/describe")
    def ai_describe():
        from ai import write_description
        data = request.get_json(force=True) or {}
        text = write_description(data)
        return jsonify({"description": text})

    # --------------------------------------------------------------- admin
    @app.post("/api/admin/login")
    def admin_login():
        data = request.get_json(force=True) or {}
        user = AdminUser.query.filter_by(username=data.get("username", "")).first()
        if not user or not check_password_hash(user.password_hash, data.get("password", "")):
            return jsonify({"error": "invalid credentials"}), 401
        session["admin_id"] = user.id
        return jsonify({"ok": True})

    @app.post("/api/admin/logout")
    def admin_logout():
        session.pop("admin_id", None)
        return jsonify({"ok": True})

    @app.get("/api/admin/session")
    def admin_session():
        return jsonify({"loggedIn": bool(session.get("admin_id"))})

    @app.get("/api/admin/listings")
    @admin_required
    def admin_listings():
        rows = Listing.query.order_by(Listing.created_at.desc()).all()
        return jsonify([l.to_summary(base_url()) for l in rows])

    @app.delete("/api/admin/listings/<int:listing_id>")
    @admin_required
    def admin_delete_listing(listing_id):
        l = Listing.query.get_or_404(listing_id)
        db.session.delete(l)
        db.session.commit()
        return jsonify({"deleted": True})

    @app.get("/api/admin/fees")
    @admin_required
    def admin_get_fees():
        return jsonify(FeeConfig.query.first().to_dict())

    @app.post("/api/admin/fees")
    @admin_required
    def admin_set_fees():
        data = request.get_json(force=True) or {}
        fees = FeeConfig.query.first()
        fees.rent_fee = int(data.get("rent", fees.rent_fee))
        fees.sale_fee = int(data.get("sale", fees.sale_fee))
        fees.plot_fee = int(data.get("plot", fees.plot_fee))
        db.session.commit()
        return jsonify(fees.to_dict())

    # ----------------------------------------------------------- dev utility
    @app.post("/api/dev/confirm-payment/<reference>")
    def dev_confirm_payment(reference):
        """
        Local-testing helper only: immediately marks a pending payment as
        successful without waiting for the mock provider's timer, or for a
        real MoMo prompt. Disabled unless DEV_MODE=1 is set.
        """
        if os.environ.get("DEV_MODE") != "1":
            return jsonify({"error": "not available"}), 404
        pr = PaymentRequest.query.filter_by(reference=reference).first_or_404()
        pr.status = "SUCCESSFUL"
        Listing.query.get(pr.listing_id).status = "published"
        db.session.commit()
        return jsonify(pr.to_dict())

    @app.get("/static/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(UPLOAD_DIR, filename)

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True})


def normalize_phone(raw):
    digits = "".join(ch for ch in str(raw) if ch.isdigit())
    if digits.startswith("250"):
        digits = digits[3:]
    return digits[-9:] if len(digits) >= 9 else digits


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG") == "1")
