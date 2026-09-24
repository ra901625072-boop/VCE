"""Tests for VCE Operator Authentication and 8-Hour Session Lifetime."""


def test_login_success(client):
    """Test login with operator ID akrajput2005 and pass Akshay@05."""
    res = client.post("/api/auth/login", json={
        "username": "akrajput2005",
        "password": "Akshay@05"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    # Session must be valid for exactly 8 hours (28,800 seconds)
    assert data["expires_in"] == 28800
    assert data["user"]["username"] == "akrajput2005"
    assert data["user"]["full_name"] == "Akshay Rajput"
    assert data["user"]["role"] == "VCE Operator"


def test_login_invalid_password(client):
    """Test login rejection when an invalid password is provided."""
    res = client.post("/api/auth/login", json={
        "username": "akrajput2005",
        "password": "WrongPassword123"
    })
    assert res.status_code == 401
    assert "Invalid Operator ID or Password" in res.json()["detail"]


def test_login_nonexistent_user(client):
    """Test login rejection for unknown username."""
    res = client.post("/api/auth/login", json={
        "username": "unknown_operator",
        "password": "Akshay@05"
    })
    assert res.status_code == 401


def test_verify_current_session(client):
    """Test /api/auth/me session verification with valid Bearer token."""
    login_res = client.post("/api/auth/login", json={
        "username": "akrajput2005",
        "password": "Akshay@05"
    })
    token = login_res.json()["access_token"]

    res = client.get("/api/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["user"]["username"] == "akrajput2005"
    # Remaining seconds should be between 28790 and 28800
    assert 28700 <= data["remaining_seconds"] <= 28800


def test_verify_session_unauthorized(client):
    """Test /api/auth/me rejection without token or with corrupted token."""
    res = client.get("/api/auth/me")
    assert res.status_code == 401

    res_bad = client.get("/api/auth/me", headers={
        "Authorization": "Bearer invalid_tampered_token_xyz"
    })
    assert res_bad.status_code == 401


def test_logout_endpoint(client):
    """Test logout endpoint returns 200 OK."""
    res = client.post("/api/auth/logout")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_login_case_insensitive_username(client):
    """Test that username is case-insensitive (e.g. Akrajput2005 or AKRAJPUT2005)."""
    for variant in ["Akrajput2005", "AKRAJPUT2005", "  akrajput2005  "]:
        res = client.post("/api/auth/login", json={
            "username": variant,
            "password": "Akshay@05"
        })
        assert res.status_code == 200, f"Failed for variant {variant}: {res.text}"
        data = res.json()
        assert data["user"]["username"] == "akrajput2005"


def test_verify_password_resilience():
    """Test verify_password handles tuple-string format gracefully."""
    from backend.core.security import hash_password, verify_password
    h, s = hash_password("Akshay@05")
    assert verify_password("Akshay@05", h, s) is True
    # Corrupted tuple string representation
    tuple_str = f"({h},{s})"
    assert verify_password("Akshay@05", tuple_str, s) is True

