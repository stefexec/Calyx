import argparse
import sys
import secrets
from database import SessionLocal
import models

def create_key(name):
    db = SessionLocal()
    try:
        new_token = "calyx_" + secrets.token_urlsafe(32)
        db_key = models.ApiKey(name=name, key=new_token)
        db.add(db_key)
        db.commit()
        print(f"Successfully created new API Key '{name}':")
        print(f"Key: {new_token}")
        print("Please save this key securely. It might not be shown again.")
    finally:
        db.close()

def list_keys():
    db = SessionLocal()
    try:
        keys = db.query(models.ApiKey).all()
        if not keys:
            print("No API keys found.")
            return
        
        print(f"{'ID':<40} | {'Name':<20} | {'Created At'}")
        print("-" * 80)
        for k in keys:
            print(f"{k.id:<40} | {k.name:<20} | {k.created_at}")
    finally:
        db.close()

def delete_key(key_id):
    db = SessionLocal()
    try:
        key_count = db.query(models.ApiKey).count()
        if key_count <= 1:
            print("Error: Cannot delete the last API key.")
            return

        db_key = db.query(models.ApiKey).filter(models.ApiKey.id == key_id).first()
        if not db_key:
            print(f"Error: API Key with ID '{key_id}' not found.")
            return
            
        db.delete(db_key)
        db.commit()
        print(f"Successfully deleted API Key '{db_key.name}' (ID: {key_id})")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Calyx API Key Management")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new API key")
    create_parser.add_argument("name", help="A descriptive name for the API key")

    # List command
    subparsers.add_parser("list", help="List all API keys")

    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete an API key")
    delete_parser.add_argument("id", help="The ID of the API key to delete")

    args = parser.parse_args()

    if args.command == "create":
        create_key(args.name)
    elif args.command == "list":
        list_keys()
    elif args.command == "delete":
        delete_key(args.id)

if __name__ == "__main__":
    main()
