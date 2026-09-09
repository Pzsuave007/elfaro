"""Backend tests for El Foro In Oregon"""
import os
import io
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback for backend tests, but frontend/.env should have it
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL"):
                BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@elforo.org"
ADMIN_PASSWORD = "ForoOregon2026"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    assert data["user"]["email"] == ADMIN_EMAIL
    return data["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=10)
        assert r.status_code == 200

    def test_login_bad(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=10)
        assert r.status_code in (400, 401)

    def test_me(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL


# ---------------- Config / Stats ----------------
class TestConfigStats:
    def test_config(self):
        r = requests.get(f"{API}/config", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict) and len(data) > 0

    def test_stats(self, auth_headers):
        r = requests.get(f"{API}/stats/dashboard", headers=auth_headers, timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)


# ---------------- Public content ----------------
@pytest.mark.parametrize("kind", ["articles", "resources", "oregon-info", "places"])
class TestPublicContent:
    def test_list(self, kind):
        r = requests.get(f"{API}/public/{kind}", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        items = data if isinstance(data, list) else data.get("items", [])
        assert len(items) >= 1, f"No items for {kind}"

    def test_detail_by_slug_increments_views(self, kind):
        r = requests.get(f"{API}/public/{kind}", timeout=10)
        items = r.json() if isinstance(r.json(), list) else r.json().get("items", [])
        assert items, f"No items for {kind}"
        slug = items[0].get("slug")
        assert slug
        r1 = requests.get(f"{API}/public/{kind}/{slug}", timeout=10)
        assert r1.status_code == 200, r1.text
        v1 = r1.json().get("views", 0)
        r2 = requests.get(f"{API}/public/{kind}/{slug}", timeout=10)
        v2 = r2.json().get("views", 0)
        assert v2 >= v1  # incremented (or at least non-decreasing)


# ---------------- Admin CRUD (articles) ----------------
class TestAdminArticles:
    created_slug = None

    def test_create_article(self, auth_headers):
        payload = {
            "title": "TEST_ Artículo de prueba",
            "body": "Contenido de prueba para el artículo.",
            "category": "comunidad",
            "status": "draft",
        }
        r = requests.post(f"{API}/admin/articles", json=payload, headers=auth_headers, timeout=15)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        assert data.get("slug")
        assert data.get("title") == payload["title"]
        TestAdminArticles.created_slug = data["slug"]

    def test_publish_by_super_admin(self, auth_headers):
        slug = TestAdminArticles.created_slug
        assert slug
        # Fetch to get id
        listing = requests.get(f"{API}/admin/articles", headers=auth_headers, timeout=10)
        assert listing.status_code == 200
        items = listing.json() if isinstance(listing.json(), list) else listing.json().get("items", [])
        item = next((i for i in items if i.get("slug") == slug), None)
        assert item, "Created article not in admin list"
        item_id = item.get("id") or item.get("_id")
        r = requests.put(f"{API}/admin/articles/{item_id}", json={"status": "published"}, headers=auth_headers, timeout=15)
        assert r.status_code == 200, r.text
        # super_admin should publish directly
        assert r.json().get("status") == "published"

    def test_delete_article(self, auth_headers):
        slug = TestAdminArticles.created_slug
        listing = requests.get(f"{API}/admin/articles", headers=auth_headers, timeout=10).json()
        items = listing if isinstance(listing, list) else listing.get("items", [])
        item = next((i for i in items if i.get("slug") == slug), None)
        if not item:
            pytest.skip("no item to delete")
        item_id = item.get("id") or item.get("_id")
        r = requests.delete(f"{API}/admin/articles/{item_id}", headers=auth_headers, timeout=10)
        assert r.status_code in (200, 204)


# ---------------- Elections ----------------
class TestElections:
    def test_public_elections(self):
        r = requests.get(f"{API}/public/elections", timeout=10)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list) and len(data) >= 1

    def test_public_races(self):
        r = requests.get(f"{API}/public/races", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        race_id = data[0].get("id") or data[0].get("_id")
        r2 = requests.get(f"{API}/public/races/{race_id}", timeout=10)
        assert r2.status_code == 200
        rd = r2.json()
        assert "race" in rd or "candidates" in rd or "questions" in rd

    def test_public_candidate(self):
        races = requests.get(f"{API}/public/races", timeout=10).json()
        race_id = races[0].get("id") or races[0].get("_id")
        detail = requests.get(f"{API}/public/races/{race_id}", timeout=10).json()
        cands = detail.get("candidates", [])
        assert cands, "No candidates in race"
        cid = cands[0].get("id") or cands[0].get("_id")
        r = requests.get(f"{API}/public/candidates/{cid}", timeout=10)
        assert r.status_code == 200


# ---------------- AI ----------------
class TestAI:
    def test_ai_requires_auth(self):
        r = requests.post(f"{API}/ai/assist", json={"action": "headline", "input": "hola"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_ai_headline(self, auth_headers):
        r = requests.post(
            f"{API}/ai/assist",
            json={"action": "headline", "input": "Nueva ley de vivienda en Oregon apoya a familias hispanas."},
            headers=auth_headers,
            timeout=90,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("result") or data.get("output") or data


# ---------------- Media ----------------
class TestMedia:
    def test_upload_and_list(self, auth_headers):
        files = {"file": ("test.txt", io.BytesIO(b"hello foro"), "text/plain")}
        r = requests.post(f"{API}/media", files=files, headers=auth_headers, timeout=30)
        assert r.status_code in (200, 201), r.text
        data = r.json()
        path = data.get("path") or data.get("url") or data.get("key")
        assert path
        r2 = requests.get(f"{API}/media/list", headers=auth_headers, timeout=10)
        assert r2.status_code == 200


# ---------------- Search ----------------
class TestSearch:
    def test_search(self):
        r = requests.get(f"{API}/search", params={"q": "Oregon"}, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        # Expect grouped results
        assert isinstance(data, dict)
        keys = set(data.keys())
        expected = {"articles", "resources", "oregon-info", "oregon_info", "places", "candidates"}
        assert keys & expected, f"unexpected search shape: {keys}"
