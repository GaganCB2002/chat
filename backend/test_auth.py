import asyncio

import httpx
from colorama import Fore, init

init(autoreset=True)

BASE_URL = "http://localhost:8000/api/auth"


async def test_auth():
    print(Fore.CYAN + "=== Starting Auth Tests ===")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Register
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
        if reg_res.status_code == 400 and "Email already registered" in reg_res.text:
            print("User already registered, continuing to login...")
            token = None
        else:
            print(f"Register response: {reg_res.json()}")
            token = reg_res.json().get("access_token")

        # 2. Login
        print(Fore.YELLOW + "\nTesting /login...")
        log_res = await client.post(
            f"{BASE_URL}/login",
            json={"username": "test@example.com", "password": "password123"},
        )
        print(f"Login status: {log_res.status_code}")
        print(f"Login response: {log_res.json()}")
        token = log_res.json().get("access_token")

        if not token:
            print(Fore.RED + "Failed to get token!")
            return

        # 3. Get Me
        print(Fore.YELLOW + "\nTesting /me (AuthToken session check)...")
        me_res = await client.get(
            f"{BASE_URL}/me", headers={"Authorization": f"Bearer {token}"}
        )
        print(f"Me status: {me_res.status_code}")
        print(f"Me response: {me_res.json()}")

        # 4. Forgot Password (Ethereal Email Check)
        print(Fore.YELLOW + "\nTesting /forgot-password (Checking Ethereal sending)...")
        fp_res = await client.post(
            f"{BASE_URL}/forgot-password", json={"email": "test@example.com"}
        )
        print(f"Forgot password status: {fp_res.status_code}")
        print(f"Forgot password response: {fp_res.json()}")
        print(Fore.CYAN + "\n=== Finished Auth Tests ===")


if __name__ == "__main__":
    asyncio.run(test_auth())
