def test_register_and_login(client):
    # Test User Registration
    reg_payload = {
        'name': 'Priyanka Reddy',
        'email': 'priyanka@example.com',
        'password': 'Password123!',
        'role': 'Pricing Manager'
    }
    res = client.post('/api/auth/register', json=reg_payload)
    assert res.status_code == 201
    data = res.get_json()
    assert 'access_token' in data
    assert data['user']['role'] == 'Pricing Manager'

    # Test Login
    login_payload = {
        'email': 'priyanka@example.com',
        'password': 'Password123!'
    }
    res_login = client.post('/api/auth/login', json=login_payload)
    assert res_login.status_code == 200
    assert 'access_token' in res_login.get_json()

def test_invalid_login(client):
    res = client.post('/api/auth/login', json={'email': 'wrong@example.com', 'password': 'wrong'})
    assert res.status_code == 401

def test_protected_profile(client, analyst_token):
    res = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {analyst_token}'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['user']['role'] == 'Business Analyst'
