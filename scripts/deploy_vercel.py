#!/usr/bin/env python3
"""
Vercel API를 직접 사용하여 dist/ 폴더 + api/ 서버리스 함수를 husimcolor 프로젝트에 배포하는 스크립트
"""
import os
import sys
import json
import base64
import hashlib
import mimetypes
import requests
from pathlib import Path

TOKEN = os.environ.get("VERCEL_TOKEN", "")
TEAM_ID = "team_7gstW63DOvDcW26u17YUeDaC"
PROJECT_ID = "prj_VC39YhbebLBEHkw1GcOG2nBK2QR9"
DIST_DIR = Path("/home/ubuntu/hyusim-color/dist")
PROJECT_DIR = Path("/home/ubuntu/hyusim-color")

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

def get_mime(path: str) -> str:
    mime, _ = mimetypes.guess_type(path)
    if mime:
        return mime
    if path.endswith(".html"):
        return "text/html; charset=utf-8"
    if path.endswith(".js"):
        return "application/javascript"
    if path.endswith(".css"):
        return "text/css"
    if path.endswith(".json"):
        return "application/json"
    return "application/octet-stream"

def upload_file(data: bytes) -> str:
    sha1 = hashlib.sha1(data).hexdigest()
    url = f"https://api.vercel.com/v2/files?teamId={TEAM_ID}"
    resp = requests.post(
        url,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/octet-stream",
            "x-vercel-digest": sha1,
        },
        data=data,
    )
    if resp.status_code not in (200, 201):
        if resp.status_code != 409:
            print(f"  upload warning {resp.status_code}: {resp.text[:100]}")
    return sha1

def collect_files():
    files = []
    
    # 1. dist/ 폴더의 정적 파일들
    for path in DIST_DIR.rglob("*"):
        if path.is_file():
            rel = str(path.relative_to(DIST_DIR))
            data = path.read_bytes()
            sha1 = upload_file(data)
            files.append({
                "file": rel,
                "sha": sha1,
                "size": len(data),
            })
            print(f"  [static] {rel} ({len(data)} bytes)")
    
    return files

def create_deployment(files):
    # vercel.json 읽기
    vercel_json_path = PROJECT_DIR / "vercel.json"
    vercel_config = {}
    if vercel_json_path.exists():
        with open(vercel_json_path) as f:
            vercel_config = json.load(f)
    
    payload = {
        "name": "husimcolor",
        "files": files,
        "target": "production",
        "projectSettings": {
            "outputDirectory": "dist",
            "framework": None,
        },
        "routes": [
            {
                "src": "/_expo/static/(.*)",
                "headers": {"cache-control": "public, max-age=31536000, immutable"},
                "continue": True,
            },
            {"handle": "filesystem"},
            {"src": "/api/trpc/(.*)", "dest": "/api/trpc/[...trpc]"},
            {"src": "/(.*)", "dest": "/index.html"},
        ],
    }
    
    url = f"https://api.vercel.com/v13/deployments?teamId={TEAM_ID}"
    resp = requests.post(url, headers=HEADERS, json=payload)
    return resp

def main():
    if not TOKEN:
        print("ERROR: VERCEL_TOKEN not set")
        sys.exit(1)
    
    print(f"Collecting and uploading files from {DIST_DIR}...")
    files = collect_files()
    print(f"\nTotal files: {len(files)}")
    
    print("\nCreating deployment...")
    resp = create_deployment(files)
    data = resp.json()
    
    if resp.status_code in (200, 201):
        deploy_id = data.get("id", "?")
        url = data.get("url", "?")
        state = data.get("readyState", data.get("status", "?"))
        print(f"\nDeployment created!")
        print(f"  ID: {deploy_id}")
        print(f"  URL: https://{url}")
        print(f"  State: {state}")
        print(f"\nProduction URL: https://husimcolor.vercel.app")
    else:
        print(f"\nERROR {resp.status_code}: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}")
        sys.exit(1)

if __name__ == "__main__":
    main()
