#!/usr/bin/env python3
"""Archive current tracked source + December QA only; refuse secret matches.
Run from repository root. Does not commit, connect to a DB, or deploy.
"""
from pathlib import Path
import hashlib
import json
import os
import re
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root.parent / "husimcolor_ko_december2026_source_20261126.zip"
assert output.suffix == ".zip" and not output.is_relative_to(root), "Archive must be outside source tree"
tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode().split("\0")
new = subprocess.check_output(["git", "ls-files", "--others", "--exclude-standard", "-z"], cwd=root).decode().split("\0")
allowed_suffixes = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".json", ".yml", ".yaml", ".css", ".md", ".txt", ".sh", ".toml", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ttf", ".otf", ".woff", ".woff2", ".mp4", ".webm", ".webmanifest", ".html", ".map"}
root_special = {".gitignore", ".npmrc", ".nvmrc", ".prettierrc", ".prettierignore", "LICENSE", "pnpm-lock.yaml"}
public_samples = {
    "public/sample-reports/husimcolor-personal-deep-sample.pdf",
    "public/sample-reports/husimcolor-couple-love-sample.pdf",
    "public/sample-reports/husimcolor-parent-child-sample.pdf",
}
exclude_prefixes = (".git/", ".vercel/", "node_modules/", "dist/", "dist-december/", ".expo/", "reports/", "backups/", "tmp/", "logs/")
files = []
for relative in sorted(set(tracked + new)):
    if not relative:
        continue
    p = Path(relative)
    if relative.startswith(exclude_prefixes) or p.name.startswith(".env"):
        continue
    if relative.startswith("docs/") and not (relative.startswith("docs/december-event-qa/") or relative == "docs/december-report-evidence-20261126.md"):
        continue
    if relative.startswith("public/") and p.suffix == ".pdf" and relative not in public_samples:
        continue
    if any(x in p.parts for x in ("private", "customer-results", "private-pdfs", "database-dumps")):
        continue
    if p.suffix not in allowed_suffixes and relative not in root_special and relative not in public_samples:
        continue
    full = root / p
    if full.is_symlink() or not full.is_file():
        continue
    files.append(relative)

secrets = [v.encode() for n, v in os.environ.items() if len(v) >= 14 and any(x in n for x in ("SECRET", "TOKEN", "PASSWORD", "DATABASE_URL", "API_KEY"))]
patterns = [rb"ghp_[A-Za-z0-9]{30,}", rb"github_pat_[A-Za-z0-9_]{45,}", rb"mysql://[^\s'\"]+:[^\s'\"]+@(?!127\.0\.0\.1(?=[:/])|localhost(?=[:/])|\[::1\](?=[:/]))"]
manifest = []
for relative in files:
    data = (root / relative).read_bytes()
    scan_data = data
    if relative in {"tests/decemberReportLocalE2E.test.ts", "scripts/create-december-source-backup.py"}:
        # Reviewed negative guard inputs, not actual credentials or connection targets.
        for fixture in (b"mysql://synthetic:synthetic@database.example.com/husim_december_e2e", b"mysql://synthetic:synthetic@127.0.0.1.example.com/husim_december_e2e", b"mysql://synthetic:synthetic@localhost.example.com/husim_december_e2e", b"mysql://synthetic:synthetic@[::1]/husim_december_e2e", b"mysql://do-not-log-me:secret-password@remote.invalid/production"):
            scan_data = scan_data.replace(fixture, b"reviewed-synthetic-negative-test-fixture")
    if any(s in data for s in secrets) or (Path(relative).suffix not in {".png", ".jpg", ".jpeg", ".webp", ".ttf", ".otf", ".pdf", ".mp4", ".webm"} and any(re.search(p, scan_data) for p in patterns)):
        raise SystemExit("BACKUP_SECRET_SCAN_REJECTED: " + relative)
    manifest.append({"path": relative, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})

commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root).decode().strip()
branch = subprocess.check_output(["git", "branch", "--show-current"], cwd=root).decode().strip()
metadata = {"language": "ko", "event": "2026-12-report-thanks", "created_date": "2026-11-26", "source_commit": commit, "branch": branch, "worktree_clean": not subprocess.check_output(["git", "status", "--porcelain"], cwd=root).strip(), "production_deployed": False, "production_database_mutated": False, "files": manifest, "excluded": ["environment files", "credentials", ".vercel", "database dumps", "customer reports and mail payloads", "node_modules", "build output", "unrelated legacy documentation"]}
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for relative in files:
        z.write(root / relative, "source/" + relative)
    z.writestr("BACKUP_MANIFEST.json", json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None, "Archive integrity failed"
print(f"BACKUP_OK: {len(files)} files; {output.stat().st_size} bytes; exact environment secret scan passed; no credentials printed")
print(output)
