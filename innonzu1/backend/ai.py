"""
Server-side AI helpers. These call the Anthropic API using ANTHROPIC_API_KEY
from the environment, so the key never has to be shipped to the browser
(unlike the claude.ai-artifact version of this app, which could rely on
Claude's own sandbox to inject the key - a real deployed site can't do
that safely).

If ANTHROPIC_API_KEY isn't set, both functions fall back to simple,
non-AI behaviour so the app still runs.
"""
import os
import json
import requests

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-6"


def _call_claude(user_text):
    resp = requests.post(
        ANTHROPIC_URL,
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={"model": MODEL, "max_tokens": 1000, "messages": [{"role": "user", "content": user_text}]},
        timeout=20,
    )
    resp.raise_for_status()
    data = resp.json()
    return "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text")


def rank_listings(query, listings):
    """Returns (ids, reasons_dict) ranking `listings` against a free-text query."""
    compact = [{
        "id": l.id, "type": l.type, "title": l.title, "area": l.area, "district": l.district,
        "price": l.price, "beds": l.bedrooms, "baths": l.bathrooms, "size": l.plot_size,
    } for l in listings]

    if not ANTHROPIC_API_KEY:
        return _naive_search(query, compact)

    prompt = (
        "You are a search-ranking assistant for a Rwandan property marketplace called Innonzu. "
        f'A user typed this search: "{query}". Here is the list of currently published properties '
        f"as JSON: {json.dumps(compact)}. "
        'Return ONLY strict JSON, no prose, no markdown fences, in this exact shape: '
        '{"ids":["id1","id2"],"reasons":{"id1":"short reason under 12 words"}}. '
        "Only include properties that genuinely fit the request (type, budget, area, bedrooms if "
        "mentioned). Order ids from best match to weakest. If nothing fits well, return an empty ids array."
    )
    try:
        text = _call_claude(prompt).strip()
        text = text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(text)
        ids = [int(i) for i in parsed.get("ids", [])]
        reasons = {int(k): v for k, v in parsed.get("reasons", {}).items()}
        return ids, reasons
    except Exception:
        return _naive_search(query, compact)


def _naive_search(query, compact):
    q = query.lower()
    words = [w for w in q.split() if len(w) > 2]
    ids = []
    for item in compact:
        hay = f"{item['title']} {item['area']} {item['district']}".lower()
        if q in hay or any(w in hay for w in words):
            ids.append(item["id"])
    return ids, {}


def write_description(fields):
    """Writes a short honest description for a property from structured fields."""
    if not ANTHROPIC_API_KEY:
        parts = [fields.get("title") or "This property"]
        if fields.get("area"):
            parts.append(f"is located in {fields['area']}")
        if fields.get("beds"):
            parts.append(f"with {fields['beds']} bedroom(s)")
        return " ".join(parts) + "."

    prompt = (
        "Write a warm, honest, plain-English 2-3 sentence description for a Rwandan property "
        "listing on a marketplace called Innonzu. Do not invent facts not given below and do not "
        f"exaggerate. Property details: {json.dumps(fields)}. "
        "Reply with ONLY the description text, nothing else."
    )
    try:
        return _call_claude(prompt).strip()
    except Exception:
        return fields.get("desc") or ""
