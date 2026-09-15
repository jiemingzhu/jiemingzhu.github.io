#!/usr/bin/env python3
"""Fetch the citation count and write citation.json.

Strategy (ordered by priority):
  1. SerpApi      — free 250/mo, returns Google Scholar's real citedby.
  2. scholarly    — may work with proxies; usually blocked on CI datacenter IPs.
  3. requests     — direct fetch of Google Scholar profile (almost always blocked).
  4. jsdelivr CDN — reads the last committed citation.json (last-known fallback).
  5. local file   — last resort: read citation.json from disk.

The script always exits 0 so the GitHub Action never fails.
"""
import os
import re
import sys
import time
import json
from datetime import datetime

# --- Guarded imports ---------------------------------------------------------
try:
    import requests
except Exception:
    requests = None

try:
    from scholarly import scholarly
except Exception:
    scholarly = None

try:
    from call_function_with_timeout import SetTimeoutDecorator
except Exception:
    def SetTimeoutDecorator(timeout):  # noqa: D401, N802
        def decorator(func):
            return func
        return decorator


SCHOLAR_ID = os.environ.get("GOOGLE_SCHOLAR_ID", "oNKerP8AAAAJ")
SERPAPI_KEY = os.environ.get("SERPAPI_KEY", "")
CITATION_FILE = "citation.json"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")


@SetTimeoutDecorator(timeout=30)
def fetch_via_serpapi():
    """SerpApi: returns Google Scholar's real citedby. Free 250 searches/month."""
    if requests is None or not SERPAPI_KEY:
        return None
    try:
        url = "https://serpapi.com/search"
        params = {
            "engine": "google_scholar_author",
            "author_id": SCHOLAR_ID,
            "hl": "en",
            "api_key": SERPAPI_KEY,
        }
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()
        cited_by = data.get("cited_by", {})
        table = cited_by.get("table", [])
        for entry in table:
            if "citations" in entry:
                val = entry["citations"].get("all")
                if val is not None:
                    print(f"  SerpApi: Google Scholar citedby = {val}")
                    return {"citedby": int(val), "source": "serpapi"}
    except Exception as exc:
        print("  SerpApi error:", repr(exc))
    return None


@SetTimeoutDecorator(timeout=30)
def fetch_via_scholarly():
    """scholarly: usually blocked on GitHub datacenter IPs without a proxy."""
    if scholarly is None:
        return None
    try:
        author = scholarly.search_author_id(SCHOLAR_ID)
        scholarly.fill(author, sections=["basics", "indices"])
        citedby = author.get("citedby")
        if citedby:
            print(f"  scholarly: citedby = {citedby}")
            return {"citedby": int(citedby), "source": "scholarly"}
    except Exception as exc:
        print("  scholarly error:", repr(exc))
    return None


@SetTimeoutDecorator(timeout=30)
def fetch_via_requests():
    """Direct HTTP to Google Scholar profile (almost always blocked on CI)."""
    if requests is None:
        return None
    try:
        url = f"https://scholar.google.com/citations?user={SCHOLAR_ID}&hl=en"
        resp = requests.get(url, headers={"User-Agent": UA}, timeout=20)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding
        m = re.search(
            r"Citations</a></td><td class=\"gsc_rsb_std\">([\d,]+)</td>",
            resp.text)
        if m:
            val = int(m.group(1).replace(",", ""))
            print(f"  requests: citedby = {val}")
            return {"citedby": val, "source": "requests"}
    except Exception as exc:
        print("  requests error:", repr(exc))
    return None


@SetTimeoutDecorator(timeout=15)
def fetch_via_jsdelivr():
    """jsdelivr CDN: reads the last committed citation.json (old value)."""
    if requests is None:
        return None
    try:
        url = ("https://cdn.jsdelivr.net/gh/jiemingzhu/"
               "jiemingzhu.github.io@citation/citation.json")
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        msg = str(data.get("message", "")).replace(",", "")
        if msg.isdigit():
            print(f"  jsdelivr (old value): {msg}")
            return {"citedby": int(msg), "source": "jsdelivr"}
    except Exception as exc:
        print("  jsdelivr error:", repr(exc))
    return None


def load_last_known():
    try:
        with open(CITATION_FILE, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        msg = str(data.get("message", "")).replace(",", "")
        if msg.isdigit():
            return int(msg)
    except Exception:
        pass
    return None


def main():
    # Ordered: best source first, fallback last.
    methods = [
        (fetch_via_serpapi, "serpapi"),
        (fetch_via_scholarly, "scholarly"),
        (fetch_via_requests, "requests"),
    ]

    author = None

    for method, name in methods:
        print(f"Trying {name}...")
        try:
            is_done, is_timeout, err_msg, result = method()
        except Exception as exc:
            print(f"  {name} unexpected error:", repr(exc))
            is_done, result = False, None
        if is_done and result:
            author = result
            break
        time.sleep(3)

    # Last resort: jsdelivr CDN (old committed value)
    if not author:
        print("Trying jsdelivr fallback (reads old committed value)...")
        try:
            is_done, _, _, result = fetch_via_jsdelivr()
            if is_done and result:
                author = result
        except Exception:
            pass

    # Final fallback: local file
    if not author:
        last = load_last_known()
        if last is not None:
            print(f"All fetches failed; using last known: {last}")
            author = {"citedby": last, "source": "local"}
        else:
            print("All fetches failed; writing 0.")
            author = {"citedby": 0, "source": "none"}

    src = author.get("source", "?")
    shield = {
        "schemaVersion": 1,
        "label": "citations",
        "message": f"{author['citedby']}",
    }
    with open(CITATION_FILE, "w", encoding="utf-8") as fh:
        json.dump(shield, fh, ensure_ascii=False)
    print(f"Wrote {CITATION_FILE} (value={author['citedby']}, source={src})")


if __name__ == "__main__":
    main()
