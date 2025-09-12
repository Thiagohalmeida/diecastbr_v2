SCRIPT_SIGNATURE = "diecastbr-scraper v1.4"

print(f"[INFO] {SCRIPT_SIGNATURE}")
#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
import re
import sys
import time
from typing import Dict, List, Optional, Tuple

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv, find_dotenv

SCRIPT_SIGNATURE = "diecastbr-scraper v1.4"

# ============== ENV ==============
if os.path.exists(".env.scripts"):
    load_dotenv(".env.scripts", override=True)
elif os.path.exists(".env.local"):
    load_dotenv(".env.local", override=True)
elif os.path.exists(".env"):
    load_dotenv(".env", override=True)
else:
    load_dotenv(find_dotenv(usecwd=True), override=True)

# ============== CONFIG ==============
BASE_WIKI_URL = "https://hotwheels.fandom.com"

ALLOWED_FIELDS = {
    "model_name",
    "brand",
    "launch_year",
    "series",
    "base_color",
    "variants",
    "product_code",
    "collection_number",
    "collector_number",
    "image_url",
    "is_treasure_hunt",
    "is_super_treasure_hunt",
}

# headers “reais”
HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/124.0 Safari/537.36"),
    "Accept": ("text/html,application/xhtml+xml,application/xml;q=0.9,"
               "image/avif,image/webp,image/apng,*/*;q=0.8"),
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://hotwheels.fandom.com/wiki/Main_Page",
}

SESSION = requests.Session()
SESSION.headers.update(HEADERS)

def human_err(msg: str) -> None:
    print(f"\n[ERRO] {msg}\n", file=sys.stderr)

def info(msg: str) -> None:
    print(f"[INFO] {msg}")

# ============== FETCH (com fallback cloudscraper) ==============
def fetch_html(url: str, retries: int = 2, backoff: float = 1.5) -> Optional[str]:
    """Tenta baixar HTML com requests; em 403 usa cloudscraper como fallback."""
    last_err = None
    # tenta requests algumas vezes
    for i in range(retries):
        try:
            resp = SESSION.get(url, timeout=30, allow_redirects=True)
            if resp.status_code == 200 and resp.text:
                return resp.text
            if resp.status_code == 403:
                last_err = f"403 (tentativa {i+1})"
                break  # 403 -> vai para fallback imediatamente
            last_err = f"HTTP {resp.status_code}"
        except requests.RequestException as e:
            last_err = str(e)
        time.sleep(backoff)

    # fallback: cloudscraper (precisa estar instalado)
    try:
        import cloudscraper  # type: ignore
        scraper = cloudscraper.create_scraper(
            browser={"browser": "chrome", "platform": "windows", "mobile": False}
        )
        scraper.headers.update(HEADERS)
        resp = scraper.get(url, timeout=30)
        if resp.status_code == 200 and resp.text:
            return resp.text
        last_err = f"fallback cloudscraper HTTP {resp.status_code}"
    except Exception as e:
        last_err = f"fallback cloudscraper falhou: {e}"

    human_err(f"Falha ao acessar {url}: {last_err}")
    return None

# ============== SCRAPER ==============
def get_model_urls_from_list_page(list_page_url: str) -> List[str]:
    urls: List[str] = []
    html = fetch_html(list_page_url)
    if not html:
        return urls

    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="wikitable")
    if not table:
        return urls

    rows = table.find_all("tr")
    for row in rows[1:]:
        cols = row.find_all(["td", "th"])
        if len(cols) > 2:
            a = cols[2].find("a", href=True)
            if a and a["href"].startswith("/wiki/"):
                urls.append(f"{BASE_WIKI_URL}{a['href']}")
    return urls


def scrape_hotwheels_model(url: str) -> List[Dict]:
    html = fetch_html(url)
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")

    # Nome do modelo
    model_name = None
    h1 = soup.find("h1", class_="page-header__title")
    if h1:
        model_name = h1.text.strip()

    # Imagem principal
    image_url = None
    fig = soup.find("figure", class_="pi-image-thumbnail")
    if fig and fig.find("img"):
        image_url = fig.find("img").get("src", None)

    table = soup.find("table", class_="wikitable")
    if not table:
        return []

    rows = table.find_all("tr")
    if not rows:
        return []

    headers = [th.text.strip() for th in rows[0].find_all("th")]

    header_to_column_map = {
        "Collection Number": "collection_number",
        "Year": "launch_year",
        "Series": "series",
        "Color": "base_color",
        "Details": "variants",
        "Base Code": "product_code",
        # "Country": "country_of_manufacture",  # NÃO EXISTE NO SEU SCHEMA
        "Collector Number": "collector_number",
    }

    out: List[Dict] = []
    for row in rows[1:]:
        cols = row.find_all(["td", "th"])
        current = {
            "model_name": model_name,
            "brand": "Hot Wheels",
            "image_url": image_url,
            "is_treasure_hunt": False,
            "is_super_treasure_hunt": False,
        }

        for i, header in enumerate(headers):
            key = header_to_column_map.get(header)
            if not key or i >= len(cols):
                continue
            value = cols[i].text.strip()
            if key == "launch_year":
                try:
                    current[key] = int(value)
                except Exception:
                    current[key] = None
            else:
                current[key] = value or None

        # Deduz collector_number de collection_number (x/y)
        if current.get("collection_number") and not current.get("collector_number"):
            m = re.search(r"(\d+)\s*/\s*\d+", str(current["collection_number"]))
            if m:
                current["collector_number"] = m.group(1)

        # TH / STH
        series_text = (current.get("series") or "").lower()
        variants_text = (current.get("variants") or "").lower()
        if "super treasure hunt" in series_text or "super treasure hunt" in variants_text:
            current["is_super_treasure_hunt"] = True
        elif "treasure hunt" in series_text or "treasure hunt" in variants_text:
            current["is_treasure_hunt"] = True

        out.append(current)

    return out

# ============== SUPABASE ==============
def create_supabase_client(url: str, key: str):
    from supabase import create_client
    return create_client(url, key)

def resolve_supabase_credentials(arg_url: Optional[str], arg_key: Optional[str]) -> Tuple[str, str]:
    url = (
        arg_url
        or os.getenv("SUPABASE_URL")
        or os.getenv("SUPABASE_PROJECT_URL")
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    )
    key = (
        arg_key
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    )
    if not url or not key:
        raise RuntimeError(
            "Defina SUPABASE_URL e uma chave (SUPABASE_SERVICE_ROLE_KEY recomendado) "
            "ou use --supabase-url/--supabase-key."
        )
    return url, key

def upsert_miniature(supabase, data: Dict, dry_run: bool = False) -> Optional[str]:
    clean = {k: v for k, v in data.items() if v is not None and k in ALLOWED_FIELDS}
    conflict_cols = "model_name,launch_year,series"

    if dry_run:
        info(f"[DRY-RUN] UPSERT -> {clean.get('model_name')}")
        return "dry_run_id"

    try:
        res = supabase.table("miniatures_master").upsert(clean, on_conflict=conflict_cols).execute()
        if res.data:
            return res.data[0].get("id")
        return None
    except Exception:
        # fallback manual
        q = supabase.table("miniatures_master").select("id").eq("model_name", clean.get("model_name"))
        if "launch_year" in clean:
            q = q.eq("launch_year", clean["launch_year"])
        if "series" in clean:
            q = q.eq("series", clean["series"])
        existing = q.execute()
        if existing.data:
            return existing.data[0]["id"]
        ins = supabase.table("miniatures_master").insert(clean).execute()
        if ins.data:
            return ins.data[0].get("id")
        return None

# ============== CLI/MAIN ==============
def main():
    print(f"[INFO] {SCRIPT_SIGNATURE}")

    ap = argparse.ArgumentParser(description="Scraper Hot Wheels (Fandom) -> Supabase miniatures_master")
    ap.add_argument("--url", help="URL de uma página específica de modelo")
    ap.add_argument("--list-url", help="URL de uma página com tabela (wikitable) de múltiplos modelos")
    ap.add_argument("--limit", type=int, default=0, help="Limite de modelos ao processar de uma lista")
    ap.add_argument("--dry-run", action="store_true", help="Não grava no banco (simulação)")
    ap.add_argument("--supabase-url", help="Override SUPABASE_URL")
    ap.add_argument("--supabase-key", help="Override SUPABASE_*_KEY")
    args = ap.parse_args()

    if not args.url and not args.list_url:
        human_err("Use --url ou --list-url.")
        sys.exit(2)

    try:
        supabase_url, supabase_key = resolve_supabase_credentials(args.supabase_url, args.supabase_key)
        supabase = create_supabase_client(supabase_url, supabase_key)
    except Exception as e:
        human_err(f"Supabase: {e}")
        sys.exit(1)

    if args.url:
        all_urls = [args.url]
    else:
        info(f"Coletando URLs de: {args.list_url}")
        all_urls = get_model_urls_from_list_page(args.list_url)
        if args.limit and args.limit > 0:
            all_urls = all_urls[: args.limit]
        info(f"{len(all_urls)} URLs encontradas.")

    total_versions, ok = 0, 0
    for u in all_urls:
        info(f"Raspando: {u}")
        versions = scrape_hotwheels_model(u)
        total_versions += len(versions)
        for v in versions:
            print(f" - {v.get('brand')} — {v.get('model_name')} ({v.get('launch_year')}) | série: {v.get('series')}")
            mid = upsert_miniature(supabase, v, dry_run=args.dry_run)
            if mid:
                ok += 1
        time.sleep(1.0)

    print("\n--- Resumo ---")
    print(f"Modelos/versões processados: {total_versions}")
    print(f"{'Simulações' if args.dry_run else 'Inserções/Upserts'} OK: {ok}/{total_versions}")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrompido pelo usuário.")
