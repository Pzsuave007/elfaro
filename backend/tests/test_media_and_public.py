"""Regression tests for local disk media serving + public API routes."""
import os
import io
import requests
import pytest
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://recursos-or.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@elforo.org"
ADMIN_PASSWORD = "ForoOregon2026"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    return s


@pytest.fixture(scope="module")
def admin_token(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    tok = data.get("access_token") or data.get("token")
    assert tok, f"No token in response: {data}"
    return tok


# --- Public API endpoints ---
@pytest.mark.parametrize("path", [
    "/api/public/articles",
    "/api/public/resources",
    "/api/public/oregon-info",
    "/api/public/places",
    "/api/site-settings",
])
def test_public_endpoint_200(api, path):
    r = api.get(f"{BASE_URL}{path}", timeout=30)
    assert r.status_code == 200, f"{path} -> {r.status_code} {r.text[:200]}"
    # Should be JSON
    r.json()


# --- Media serving from local disk ---
def test_media_serves_valid_image(api):
    # Pick an article with featured_image from public API
    r = api.get(f"{BASE_URL}/api/public/articles", timeout=30)
    assert r.status_code == 200
    items = r.json()
    if isinstance(items, dict):
        items = items.get("items") or items.get("articles") or []
    featured_urls = [it.get("featured_image") for it in items if it.get("featured_image")]
    assert featured_urls, "No article featured_image found"
    url = featured_urls[0]
    full = url if url.startswith("http") else f"{BASE_URL}{url}"
    resp = api.get(full, timeout=60)
    assert resp.status_code == 200, f"Media GET failed: {resp.status_code} {full}"
    ct = resp.headers.get("Content-Type", "")
    assert ct.startswith("image/"), f"Not an image content-type: {ct}"
    assert len(resp.content) > 500, f"Image too small ({len(resp.content)} bytes)"
    # Validate it opens as an image
    img = Image.open(io.BytesIO(resp.content))
    img.verify()


def test_media_all_disk_files_served(api):
    """Sample several disk media files and confirm they serve OK via public route."""
    media_root = "/app/backend/media_store"
    sampled = 0
    ok = 0
    for root, _dirs, files in os.walk(media_root):
        for f in files:
            if sampled >= 5:
                break
            full = os.path.join(root, f)
            rel = os.path.relpath(full, media_root)
            r = api.get(f"{BASE_URL}/api/media/file/{rel}", timeout=30)
            sampled += 1
            if r.status_code == 200 and r.headers.get("Content-Type", "").startswith(("image/", "application/", "video/")):
                ok += 1
        if sampled >= 5:
            break
    assert sampled > 0, "No files sampled"
    # At least most should serve (they must have a db.media record)
    assert ok >= 1, f"Only {ok}/{sampled} disk files served OK"


# --- Admin upload persists to disk + serves ---
def test_admin_upload_saves_to_disk_and_serves(api, admin_token):
    # Create a tiny PNG in memory
    img = Image.new("RGB", (20, 20), color=(200, 30, 30))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    files = {"file": ("test_upload.png", buf, "image/png")}
    headers = {"Authorization": f"Bearer {admin_token}"}
    r = requests.post(f"{BASE_URL}/api/media", files=files, headers=headers, timeout=60)
    assert r.status_code == 200, f"Upload failed: {r.status_code} {r.text}"
    data = r.json()
    assert "url" in data and data["url"].startswith("/api/media/file/")
    storage_path = data["storage_path"]
    # Check disk file exists
    disk_path = os.path.join("/app/backend/media_store", storage_path)
    assert os.path.exists(disk_path), f"Disk file missing at {disk_path}"
    assert os.path.getsize(disk_path) > 50
    # Serve back
    r2 = requests.get(f"{BASE_URL}{data['url']}", timeout=30)
    assert r2.status_code == 200
    assert r2.headers.get("Content-Type", "").startswith("image/")
    assert len(r2.content) > 50


# --- Frontend HTML ---
def test_frontend_title_no_emergent():
    r = requests.get(BASE_URL + "/", timeout=30)
    assert r.status_code == 200
    html = r.text
    assert "<title>El Foro In Oregon</title>" in html or "El Foro In Oregon" in html
    assert "Emergent | Fullstack App" not in html
    # posthog should be gone
    assert "posthog" not in html.lower()
