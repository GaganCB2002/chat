import asyncio
import httpx

async def get_me():
    async with httpx.AsyncClient() as client:
        log_res = await client.post('http://localhost:8000/api/auth/login', json={'username': 'test@example.com', 'password': 'password123'})
        token = log_res.json().get('access_token')
        me_res = await client.get('http://localhost:8000/api/auth/me', headers={'Authorization': f'Bearer {token}'})
        print(me_res.status_code)
        print(me_res.text)

asyncio.run(get_me())
