"""
Run once to populate a few example listings, so the marketplace isn't
empty the first time you open the frontend. Safe to re-run - it does
nothing if listings already exist.

    python seed.py
"""
import os
from PIL import Image, ImageDraw

from app import create_app, UPLOAD_DIR
from models import db, Listing, ListingPhoto

SAMPLE = [
    dict(type="rent", title="2-bedroom apartment near Kimironko market", district="Gasabo",
         area="Kimironko", street="KG 11 Ave", price=180000, bedrooms=2, bathrooms=1,
         year_built=2016, water_electricity="included", title_deed=True,
         description="Bright, fenced apartment five minutes' walk from Kimironko market and "
                      "the main taxi stage. Tiled floors throughout and a small private compound.",
         owner_name="Aline U.", owner_phone="788000001"),
    dict(type="sale", title="3-bedroom family house in Kibagabaga", district="Gasabo",
         area="Kibagabaga", street="KG 631 St", price=65000000, bedrooms=3, bathrooms=2,
         year_built=2010, renovated=True, year_renovated=2022, water_electricity="included",
         title_deed=True,
         description="Solidly built family home with a renovated kitchen and roof, on a titled "
                      "400 sqm plot. Quiet residential street near Kibagabaga hospital road.",
         owner_name="Jean K.", owner_phone="788000002"),
    dict(type="plot", title="450 sqm residential plot in Kanombe", district="Kicukiro",
         area="Kanombe", street="KK 15 Ave", price=22000000, plot_size=450, plot_unit="sqm",
         water_nearby=True, electricity_nearby=True, title_deed=True,
         description="Flat residential plot close to a tarmac feeder road; water and electricity "
                      "lines already reach the neighbouring plots. Clean title, ready to build.",
         owner_name="Providence M.", owner_phone="788000003"),
    dict(type="rent", title="Studio near Norrsken House, Kacyiru", district="Gasabo",
         area="Kacyiru", street="KG 7 Ave", price=130000, bedrooms=1, bathrooms=1,
         year_built=2019, water_electricity="shared", title_deed=True,
         description="Compact, secure studio in a small gated compound, popular with young "
                      "professionals working around Kacyiru and Kimihurura.",
         owner_name="Eric N.", owner_phone="788000004"),
]

HOUSE_CATS = ["exterior", "interior", "rooms", "ceiling", "floorIndoor", "floorOutdoor"]
PLOT_CATS = ["overview", "boundaries", "surroundings"]
HUES = [(159, 122, 234), (139, 92, 246), (109, 40, 217), (196, 181, 253)]


def placeholder_image(path, label, seed):
    color = HUES[abs(hash(seed)) % len(HUES)]
    img = Image.new("RGB", (640, 480), color)
    draw = ImageDraw.Draw(img)
    draw.text((20, 220), label, fill=(20, 16, 30))
    img.save(path, "JPEG", quality=80)


def run():
    app = create_app()
    with app.app_context():
        if Listing.query.count() > 0:
            print("Listings already exist - skipping seed.")
            return
        for row in SAMPLE:
            l = Listing(status="published", **row)
            db.session.add(l)
            db.session.flush()
            cats = PLOT_CATS if l.type == "plot" else HOUSE_CATS
            folder = os.path.join(UPLOAD_DIR, str(l.id))
            os.makedirs(folder, exist_ok=True)
            for i, cat in enumerate(cats):
                fname = f"seed-{cat}.jpg"
                placeholder_image(os.path.join(folder, fname), cat, f"{l.id}{cat}")
                db.session.add(ListingPhoto(listing_id=l.id, category=cat,
                                             url=f"/static/uploads/{l.id}/{fname}", sort_order=0))
        db.session.commit()
        print(f"Seeded {len(SAMPLE)} sample listings.")


if __name__ == "__main__":
    run()
