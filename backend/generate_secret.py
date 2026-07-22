import os
import secrets


def ensure_jwt_secret(env_path: str = None):
    if env_path is None:
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

    key = os.getenv("JWT_SECRET", "")
    if not key or key in (
        "kortex-jwt-secret-$(uuidgen)-$(date +%s)",
        "kortex-super-secret-key-change-in-production",
    ):
        new_key = secrets.token_hex(32)
        with open(env_path, "a") as f:
            f.write(f"\nJWT_SECRET={new_key}\n")
        print(f"Generated new JWT_SECRET in {env_path}")
        return new_key
    return key


if __name__ == "__main__":
    ensure_jwt_secret()
