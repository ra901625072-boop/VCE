import urllib.request
import json

def run_verification():
    print("--- Testing VCE Pali Login System ---")

    # 1. Check login page HTML
    res = urllib.request.urlopen('http://127.0.0.1:8000/pages/login.html')
    html = res.read().decode('utf-8')
    assert 'Operator Sign-In' in html
    assert 'Shift Session: 8 Hours Active Validity' in html
    assert 'id="username"' in html
    assert 'id="current-password"' in html
    print("[PASS] 1. Login HTML verified with 8-Hour shift badge and form inputs")

    # 2. Test wrong password
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login',
        data=json.dumps({'username': 'akrajput2005', 'password': 'wrong_password'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        urllib.request.urlopen(req)
        raise AssertionError("Should have failed on wrong password")
    except urllib.error.HTTPError as e:
        assert e.code == 401
        err = json.loads(e.read().decode('utf-8'))
        print(f"[PASS] 2. Invalid password rejected with HTTP 401: {err['detail']}")

    # 3. Test correct credentials
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/login',
        data=json.dumps({'username': 'akrajput2005', 'password': 'Akshay@05'}).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    assert res.code == 200
    data = json.loads(res.read().decode('utf-8'))
    assert data['expires_in'] == 28800, f"Expected 28800, got {data['expires_in']}"
    token = data['access_token']
    user = data['user']
    print("[PASS] 3. Login successful with id=akrajput2005 and pass=Akshay@05:")
    print(f"       Operator: {user['full_name']} ({user['username']}) - Role: {user['role']}")
    print(f"       Session validity: {data['expires_in']} seconds (8 Hours)")
    print(f"       Expires at: {data['expires_at']}")

    # 4. Verify session endpoint
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/me',
        headers={'Authorization': f'Bearer {token}'}
    )
    res = urllib.request.urlopen(req)
    me_data = json.loads(res.read().decode('utf-8'))
    assert me_data['valid'] is True
    print(f"[PASS] 4. /api/auth/me verified active token: remaining {me_data['remaining_seconds']}s")

    # 5. Logout
    req = urllib.request.Request(
        'http://127.0.0.1:8000/api/auth/logout',
        method='POST',
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    assert res.code == 200
    print("[PASS] 5. /api/auth/logout acknowledged")
    print("--- All Login System Verification Checks Passed! ---")

if __name__ == '__main__':
    run_verification()
