import httpx
from bs4 import BeautifulSoup

try:
    from recipe_scrapers import scrape_html
except ImportError:
    scrape_html = None


async def import_recipe_from_url(url: str) -> dict:
    async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
        resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()

    html = resp.text

    if scrape_html:
        try:
            scraper = scrape_html(html, org_url=url)
            ingredients = []
            for ing in scraper.ingredients():
                ingredients.append({"name": ing, "amount": None, "unit": None})

            steps = []
            instructions = scraper.instructions_list()
            for i, step in enumerate(instructions, 1):
                steps.append({"order": i, "description": step})

            return {
                "title": scraper.title(),
                "description": getattr(scraper, "description", lambda: None)(),
                "prep_time": _safe_int(getattr(scraper, "prep_time", lambda: None)()),
                "cook_time": _safe_int(getattr(scraper, "cook_time", lambda: None)()),
                "servings": _safe_int(getattr(scraper, "yields", lambda: None)()),
                "image_url": getattr(scraper, "image", lambda: None)(),
                "source_url": url,
                "ingredients": ingredients,
                "steps": steps,
            }
        except Exception:
            pass

    return _fallback_parse(html, url)


def _fallback_parse(html: str, url: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")

    title = ""
    og_title = soup.find("meta", property="og:title")
    if og_title:
        title = og_title.get("content", "")
    if not title:
        title_tag = soup.find("title")
        title = title_tag.get_text(strip=True) if title_tag else "导入的食谱"

    description = ""
    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        description = og_desc.get("content", "")

    image_url = None
    og_img = soup.find("meta", property="og:image")
    if og_img:
        image_url = og_img.get("content")

    ingredients = []
    for el in soup.find_all(attrs={"itemprop": "recipeIngredient"}):
        ingredients.append({"name": el.get_text(strip=True), "amount": None, "unit": None})

    if not ingredients:
        for li in soup.select("[class*=ingredient] li"):
            ingredients.append({"name": li.get_text(strip=True), "amount": None, "unit": None})

    steps = []
    for i, el in enumerate(soup.find_all(attrs={"itemprop": "recipeInstructions"}), 1):
        text = el.get_text(strip=True)
        if text:
            steps.append({"order": i, "description": text})

    if not steps:
        for i, li in enumerate(soup.select("[class*=instruction] li, [class*=step] li"), 1):
            steps.append({"order": i, "description": li.get_text(strip=True)})

    return {
        "title": title,
        "description": description,
        "prep_time": None,
        "cook_time": None,
        "servings": None,
        "image_url": image_url,
        "source_url": url,
        "ingredients": ingredients,
        "steps": steps,
    }


def _safe_int(val) -> int | None:
    if val is None:
        return None
    try:
        s = str(val)
        digits = "".join(c for c in s if c.isdigit())
        return int(digits) if digits else None
    except (ValueError, TypeError):
        return None
