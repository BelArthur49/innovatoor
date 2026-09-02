"""
Database models for Innonzu by Innovatoor.

A Listing is a house/apartment for rent, a house for sale, or a plot for sale.
Photos are stored as separate rows so each one can carry its category
(exterior, interior, rooms, ceiling, floor-indoor, floor-outdoor / or
plot overview/boundaries/surroundings), matching the categories shown
in the frontend gallery tabs.
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

HOUSE_CATEGORIES = ["exterior", "interior", "rooms", "ceiling", "floorIndoor", "floorOutdoor"]
PLOT_CATEGORIES = ["overview", "boundaries", "surroundings"]
LISTING_TYPES = ["rent", "sale", "plot"]
LISTING_STATUSES = ["draft", "published", "rented", "sold", "removed"]
WATER_ELECTRICITY_OPTIONS = ["included", "shared", "separate"]
DISTRICTS = ["Gasabo", "Kicukiro", "Nyarugenge"]


class Listing(db.Model):
    __tablename__ = "listings"

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(10), nullable=False)  # rent | sale | plot
    status = db.Column(db.String(12), nullable=False, default="draft")

    title = db.Column(db.String(200), nullable=False, default="")
    district = db.Column(db.String(40), nullable=False, default="")
    area = db.Column(db.String(120), nullable=False, default="")       # neighbourhood / sector
    street = db.Column(db.String(120), nullable=True, default="")      # e.g. "KK 15 Ave"
    description = db.Column(db.Text, nullable=True, default="")

    price = db.Column(db.Integer, nullable=False, default=0)           # RWF
    currency = db.Column(db.String(6), nullable=False, default="RWF")

    # house / apartment fields
    bedrooms = db.Column(db.Integer, nullable=True)
    bathrooms = db.Column(db.Integer, nullable=True)
    year_built = db.Column(db.Integer, nullable=True)
    renovated = db.Column(db.Boolean, default=False)
    year_renovated = db.Column(db.Integer, nullable=True)
    water_electricity = db.Column(db.String(12), nullable=True)  # included | shared | separate

    # plot fields
    plot_size = db.Column(db.Float, nullable=True)
    plot_unit = db.Column(db.String(6), nullable=True)  # sqm | ha
    water_nearby = db.Column(db.Boolean, default=False)
    electricity_nearby = db.Column(db.Boolean, default=False)

    title_deed = db.Column(db.Boolean, default=False)

    owner_name = db.Column(db.String(120), nullable=False, default="")
    owner_phone = db.Column(db.String(20), nullable=False, default="", index=True)

    no_commission = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    photos = db.relationship("ListingPhoto", backref="listing", cascade="all, delete-orphan",
                              order_by="ListingPhoto.sort_order")
    payments = db.relationship("PaymentRequest", backref="listing", cascade="all, delete-orphan")

    def categories(self):
        return PLOT_CATEGORIES if self.type == "plot" else HOUSE_CATEGORIES

    def to_summary(self, base_url=""):
        cover = None
        cats = self.categories()
        by_cat = {}
        for p in self.photos:
            by_cat.setdefault(p.category, []).append(p)
        for c in cats:
            if by_cat.get(c):
                cover = by_cat[c][0]
                break
        return {
            "id": self.id,
            "type": self.type,
            "status": self.status,
            "title": self.title,
            "district": self.district,
            "area": self.area,
            "street": self.street,
            "price": self.price,
            "currency": self.currency,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "plotSize": self.plot_size,
            "plotUnit": self.plot_unit,
            "noCommission": self.no_commission,
            "thumb": (base_url + cover.url) if cover else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }

    def to_detail(self, base_url=""):
        d = self.to_summary(base_url)
        by_cat = {}
        for p in self.photos:
            by_cat.setdefault(p.category, []).append(base_url + p.url)
        d.update({
            "description": self.description,
            "yearBuilt": self.year_built,
            "renovated": self.renovated,
            "yearRenovated": self.year_renovated,
            "waterElectricity": self.water_electricity,
            "waterNearby": self.water_nearby,
            "electricityNearby": self.electricity_nearby,
            "titleDeed": self.title_deed,
            "ownerName": self.owner_name,
            "ownerPhone": self.owner_phone,
            "photosByCategory": by_cat,
        })
        return d


class ListingPhoto(db.Model):
    __tablename__ = "listing_photos"

    id = db.Column(db.Integer, primary_key=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id"), nullable=False)
    category = db.Column(db.String(20), nullable=False)
    url = db.Column(db.String(300), nullable=False)  # relative path under /static/uploads/...
    sort_order = db.Column(db.Integer, default=0)


class FeeConfig(db.Model):
    __tablename__ = "fee_config"

    id = db.Column(db.Integer, primary_key=True)
    rent_fee = db.Column(db.Integer, nullable=False, default=10000)
    sale_fee = db.Column(db.Integer, nullable=False, default=50000)
    plot_fee = db.Column(db.Integer, nullable=False, default=30000)
    currency = db.Column(db.String(6), nullable=False, default="RWF")

    def to_dict(self):
        return {"rent": self.rent_fee, "sale": self.sale_fee, "plot": self.plot_fee, "currency": self.currency}


class AdminUser(db.Model):
    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)


class PaymentRequest(db.Model):
    __tablename__ = "payment_requests"

    id = db.Column(db.Integer, primary_key=True)
    reference = db.Column(db.String(64), unique=True, nullable=False, index=True)
    listing_id = db.Column(db.Integer, db.ForeignKey("listings.id"), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    currency = db.Column(db.String(6), nullable=False, default="RWF")
    provider = db.Column(db.String(20), nullable=False, default="mock")
    status = db.Column(db.String(15), nullable=False, default="PENDING")  # PENDING | SUCCESSFUL | FAILED
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "reference": self.reference,
            "status": self.status,
            "amount": self.amount,
            "currency": self.currency,
            "listingId": self.listing_id,
        }
