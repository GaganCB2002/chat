import asyncio

import httpx
import pytest
from colorama import Fore, init

init(autoreset=True)

BASE_URL = "http://localhost:8000/api/auth"


def _backend_running() -> bool:
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(("127.0.0.1", 8000)) == 0


@pytest.mark.asyncio
async def test_auth():
    if not _backend_running():
        pytest.skip("Backend not running at http://localhost:8000")

    print(Fore.CYAN + "=== Starting Auth Tests ===")

    async with httpx.AsyncClient(timeout=30.0) as client:
        print(Fore.YELLOW + "Testing /register...")
        reg_res = await client.post(
            f"{BASE_URL}/register",
            json={
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "password": "password123",
                "age": 25,
            },
        )
        print(f"Register status: {reg_res.status_code}")
        assert reg_res.status_code in (200, 400), f"Register failed: {reg_res.text}"
        if reg_res.status_code == 400:
            assert "Email already registered" in reg_res.text
            print("User already registered, continuing to login...")
        else:
            data = reg_res.json()
            assert "id" in data
            print(f"Register response: {data}")

        print(Fore.YELLOW + "\nTesting /login...")
        log_res = await client.post(
            f"{BASE_URL}/login",
            json={"username": "test@example.com", "password": "password123"},
        )
        print(f"Login status: {log_res.status_code}")
        assert log_res.status_code == 200, f"Login failed: {log_res.text}"
        log_data = log_res.json()
        assert "access_token" in log_data
        assert "token_type" in log_data
        print(f"Login response OK")

        token = log_data["access_token"]

        print(Fore.YELLOW + "\nTesting /me (AuthToken session check)...")
        me_res = await client.get(
            f"{BASE_URL}/me", headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Me status: {me_res.status_code}")
        assert me_res.status_code == 200, f"/me failed: {me_res.text}"
        me_data = me_res.json()
        assert me_data["email"] == "test@example.com"
        print(f"Authenticated as: {me_data['first_name']} {me_data['last_name']}")

        print(Fore.YELLOW + "\nTesting /forgot-password...")
        fp_res = await client.post(
            f"{BASE_URL}/forgot-password", json={"email": "test@example.com"}
        )
        print(f"Forgot password status: {fp_res.status_code}")
        assert fp_res.status_code == 200, f"Forgot password failed: {fp_res.text}"
        fp_data = fp_res.json()
        assert "message" in fp_data
        print(f"Forgot password response: {fp_data}")
        print(Fore.CYAN + "\n=== Finished Auth Tests ===")


if __name__ == "__main__":
    asyncio.run(test_auth())
