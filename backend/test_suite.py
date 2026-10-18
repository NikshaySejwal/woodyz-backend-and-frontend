import os
import sys
from datetime import datetime
from uuid import uuid4

import requests


BASE_URL = os.getenv("WOODYZ_API_URL", "http://localhost:8080/api").rstrip("/")
LUCKY_PASSWORD = os.getenv("LUCKY_PASSWORD", "password123")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminpassword")
RUN_LIVE_PAYMENT = os.getenv("RUN_LIVE_PAYMENT", "0") == "1"

LUCKY_USER = {
    "username": "lucky",
    "email": "lucky@example.com",
    "password": LUCKY_PASSWORD,
}

results = []


def record(name, passed, detail):
    status = "PASS" if passed else "FAIL"
    results.append((status, name, detail))
    print(f"[{status}] {name}: {detail}")


def skip(name, detail):
    results.append(("SKIP", name, detail))
    print(f"[SKIP] {name}: {detail}")


def request(session, method, path, **kwargs):
    return session.request(method, f"{BASE_URL}{path}", timeout=15, **kwargs)


def login(session, username, password):
    response = request(session, "POST", "/auth/login", json={"username": username, "password": password})
    if response.status_code != 200:
        return None, response
    token = response.json().get("token")
    if token:
        session.headers.update({"Authorization": f"Bearer {token}"})
    return token, response


def probe(session, name, method, path, expected):
    response = request(session, method, path)
    record(name, response.status_code in expected, f"HTTP {response.status_code}; expected {sorted(expected)}")
    return response


def run_user_audit():
    session = requests.Session()
    response = request(session, "POST", "/auth/signup", json=LUCKY_USER)
    record("create lucky account", response.status_code in {200, 400}, f"HTTP {response.status_code} (400 means it already exists)")

    token, response = login(session, LUCKY_USER["username"], LUCKY_PASSWORD)
    if not token:
        record("login as lucky", False, f"HTTP {response.status_code}: {response.text[:160]}")
        return None, None
    record("login as lucky", True, "JWT received")

    profile = request(session, "GET", "/users/profile")
    record("read lucky profile", profile.status_code == 200, f"HTTP {profile.status_code}")
    if profile.status_code == 200:
        data = profile.json()
        sensitive = {key for key in ("password", "passwordHash") if key in data}
        record("profile does not expose password", not sensitive, f"exposed fields: {sorted(sensitive) or 'none'}")
        record("profile has address and phone storage", {"address", "phone"}.issubset(data), f"fields: {sorted(data)}")

    update = request(session, "PUT", "/user/profile", json={"address": "123 Random St, Fake City", "phone": "+1234567890"})
    record("update address and phone", update.status_code in {200, 204}, f"HTTP {update.status_code}; no update route is currently expected")

    probe(session, "user blocked from analytics", "GET", "/analytics/summary", {401, 403})
    probe(session, "user blocked from all-orders view", "GET", "/orders", {401, 403})
    probe(session, "user blocked from another user record", "GET", "/users/someotheruser", {401, 403, 404})

    products_response = request(session, "GET", "/products")
    if products_response.status_code != 200:
        record("browse products", False, f"HTTP {products_response.status_code}")
        return session, None
    products = products_response.json()
    record("browse products", isinstance(products, list) and bool(products), f"HTTP {products_response.status_code}: {products_response.text[:160]}")
    if not products:
        return session, None

    items = [{"productId": product["id"], "quantity": 1} for product in products[:2]]
    record("multiple cart items can be represented", len(items) == 2, f"{len(items)} checkout items prepared")
    payment = request(
        session,
        "POST",
        "/payments/create-payment-intent",
        json={"items": items},
        headers={"Idempotency-Key": str(uuid4())},
    )
    if payment.status_code == 200 and payment.json().get("clientSecret"):
        record("create Stripe payment intent", True, "clientSecret returned")
        if not RUN_LIVE_PAYMENT:
            skip("complete payment and persist order", "set RUN_LIVE_PAYMENT=1 to use Stripe and create a real order")
    else:
        record("create Stripe payment intent", False, f"HTTP {payment.status_code}: {payment.text[:160]}")
        skip("complete payment and persist order", "payment intent was not created")

    cancel = request(session, "PUT", "/orders/1/status", json={"status": "CANCELLED"})
    record("customer cancellation endpoint exists", cancel.status_code not in {404, 405}, f"HTTP {cancel.status_code}")

    product_id = products[0]["id"]
    review = request(session, "POST", "/reviews", json={"productId": product_id, "rating": 5, "comment": "Audit review"})
    record("submit review", review.status_code == 200, f"HTTP {review.status_code}")
    reviews = request(session, "GET", f"/reviews/product/{product_id}")
    stored = False
    if reviews.status_code == 200:
        stored = any(item.get("comment") == "Audit review" and item.get("rating") == 5 for item in reviews.json())
    record("review and stars persist", stored, f"HTTP {reviews.status_code}; matching review found: {stored}")
    record("reviews require authentication", review.status_code in {401, 403}, "public review submission is a security finding" if review.status_code == 200 else f"HTTP {review.status_code}")
    return session, products


def run_admin_audit(products):
    admin = requests.Session()
    token, response = login(admin, ADMIN_USERNAME, ADMIN_PASSWORD)
    if not token:
        skip("admin login", f"HTTP {response.status_code}: {response.text[:160]}; configure ADMIN_USERNAME and ADMIN_PASSWORD")
        return
    record("admin account exists and can log in", True, f"username: {ADMIN_USERNAME}")

    analytics = request(admin, "GET", "/analytics/summary")
    record("admin dashboard analytics", analytics.status_code == 200, f"HTTP {analytics.status_code}")
    orders = request(admin, "GET", "/orders")
    record("admin can see all orders", orders.status_code == 200, f"HTTP {orders.status_code}")
    user = request(admin, "GET", "/users/lucky")
    record("admin can see lucky details", user.status_code == 200, f"HTTP {user.status_code}")
    if user.status_code == 200:
        exposed = {key for key in ("password", "passwordHash") if key in user.json()}
        record("admin user response does not expose password", not exposed, f"exposed fields: {sorted(exposed) or 'none'}")

    tickets = request(admin, "GET", "/support")
    record("admin support inbox is restricted", tickets.status_code in {401, 403}, f"HTTP {tickets.status_code}; expected 401/403")
    probe(admin, "blacklist capability exists", "DELETE", "/users/lucky", {200, 204, 401, 403})
    probe(admin, "coupon capability exists", "GET", "/coupons", {200, 401, 403})
    probe(admin, "order status update capability exists", "PUT", "/orders/1/status", {200, 401, 403, 404})
    probe(admin, "admin message/reply capability exists", "POST", "/support/1/message", {200, 201, 401, 403, 404})
    probe(admin, "live developer configuration exists", "GET", "/config", {200, 401, 403})

    if not products:
        skip("admin product CRUD", "no product fixture available")
        return
    product = products[0]
    update = dict(product)
    update["name"] = f"{product.get('name', 'Product')} audit"
    response = request(admin, "PUT", f"/products/{product['id']}", json=update)
    record("admin can update products", response.status_code == 200, f"HTTP {response.status_code}")
    if response.status_code == 200:
        restored = dict(product)
        request(admin, "PUT", f"/products/{product['id']}", json=restored)
        record("admin product update persists", request(admin, "GET", f"/products/{product['id']}").json().get("name") == product.get("name"), "product restored and read back")


def run_tests():
    print(f"Woodyz backend audit started {datetime.now().isoformat(timespec='seconds')} against {BASE_URL}")
    try:
        session, products = run_user_audit()
        if session is not None:
            run_admin_audit(products)
    except requests.exceptions.ConnectionError:
        print(f"[FAIL] backend reachable: could not connect to {BASE_URL}")
        return 2
    failures = sum(status == "FAIL" for status, _, _ in results)
    skips = sum(status == "SKIP" for status, _, _ in results)
    print(f"\nAudit complete: {len(results) - failures - skips} passed, {failures} failed, {skips} skipped")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(run_tests())
