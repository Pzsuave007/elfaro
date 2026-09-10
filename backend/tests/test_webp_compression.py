"""Test WebP compression for AI-generated and uploaded images."""
import io
import os
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://recursos-or.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@elforo.org"
ADMIN_PASSWORD = "ForoOregon2026"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def _fetch_and_validate(url, expected_size=None, max_kb=1000):
    # url may be relative
    if url.startswith("/"):
        full = f"{BASE_URL}{url}"
    else:
        full = url
    r = requests.get(full, timeout=60)
    assert r.status_code == 200, f"GET {full} -> {r.status_code}"
    ct = r.headers.get("Content-Type", "")
    assert "image/webp" in ct, f"Expected image/webp, got {ct}"
    size_kb = len(r.content) / 1024
    print(f"  URL: {full}")
    print(f"  Size: {size_kb:.1f} KB, Content-Type: {ct}")
    assert size_kb < max_kb, f"Image too large: {size_kb:.1f} KB (expected < {max_kb} KB)"
    img = Image.open(io.BytesIO(r.content))
    img.verify()
    img2 = Image.open(io.BytesIO(r.content))
    print(f"  Dimensions: {img2.size}, Format: {img2.format}")
    assert img2.format == "WEBP"
    if expected_size:
        assert img2.size == expected_size, f"Expected {expected_size}, got {img2.size}"
    return r.content, img2


def test_ai_illustrate_webp(auth_headers):
    """AI illustrate returns WebP < 1MB at 1536x1024."""
    payload = {
        "kind": "articles",
        "title": "Feria de salud comunitaria en Salem",
        "summary": "Familias reciben chequeos gratuitos",
        "style": "comic",
    }
    r = requests.post(f"{BASE_URL}/api/ai/illustrate", json=payload, headers=auth_headers, timeout=180)
    assert r.status_code == 200, f"illustrate failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    assert "url" in data and "prompt" in data
    url = data["url"]
    print(f"illustrate URL: {url}")
    assert url.endswith(".webp"), f"URL should end with .webp: {url}"
    _fetch_and_validate(url, expected_size=(1536, 1024), max_kb=1000)


def test_ai_image_webp(auth_headers):
    """AI image endpoint returns WebP."""
    payload = {"prompt": "a park in Oregon with tall trees"}
    r = requests.post(f"{BASE_URL}/api/ai/image", json=payload, headers=auth_headers, timeout=180)
    assert r.status_code == 200, f"ai/image failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    url = data.get("url")
    assert url and url.endswith(".webp"), f"URL should end with .webp: {url}"
    _fetch_and_validate(url, expected_size=(1536, 1024), max_kb=1000)


def test_media_upload_webp(auth_headers):
    """Media upload converts PNG to WebP."""
    # create a test PNG in memory
    img = Image.new("RGB", (2000, 1200), color=(200, 100, 50))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    original_size = len(buf.getvalue())
    print(f"Original PNG size: {original_size/1024:.1f} KB")

    files = {"file": ("test.png", buf.getvalue(), "image/png")}
    r = requests.post(f"{BASE_URL}/api/media", files=files, headers=auth_headers, timeout=60)
    assert r.status_code in (200, 201), f"media upload failed: {r.status_code} {r.text[:500]}"
    data = r.json()
    url = data.get("url")
    print(f"Media response: {data}")
    assert url and url.endswith(".webp"), f"URL should end with .webp: {url}"
    content_type = data.get("content_type", "")
    assert "image/webp" in content_type, f"content_type should be image/webp: {content_type}"

    content, img_obj = _fetch_and_validate(url, max_kb=1000)
    # width should be capped at 1600
    assert img_obj.size[0] <= 1600, f"Width should be <= 1600, got {img_obj.size}"
    assert len(content) < original_size, "WebP should be smaller than original PNG"
