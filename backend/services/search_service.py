import asyncio
from typing import List, Dict, Optional
import httpx
import json
import re
import urllib.parse

async def search_duckduckgo(query: str, max_results: int = 10) -> List[Dict]:
    """Search DuckDuckGo using the free API"""
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://api.duckduckgo.com/?q={encoded}&format=json&no_html=1&skip_disambig=1"
        
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "AITutor/1.0"})
            data = resp.json()
        
        results = []
        
        # Abstract result
        if data.get("Abstract"):
            results.append({
                "title": data.get("Heading", query),
                "url": data.get("AbstractURL", ""),
                "description": data.get("Abstract", ""),
                "type": "article",
                "source": "Wikipedia"
            })
        
        # Related topics
        for topic in data.get("RelatedTopics", [])[:max_results]:
            if isinstance(topic, dict) and topic.get("FirstURL"):
                results.append({
                    "title": topic.get("Text", "")[:80],
                    "url": topic.get("FirstURL", ""),
                    "description": topic.get("Text", ""),
                    "type": "article",
                    "source": "DuckDuckGo"
                })
        
        return results[:max_results]
    except Exception as e:
        print(f"DuckDuckGo search error: {e}")
        return []

async def search_wikipedia(query: str, max_results: int = 3) -> List[Dict]:
    """Search Wikipedia API for educational content"""
    try:
        base = "https://en.wikipedia.org/api/rest_v1/page/summary/"
        search_url = f"https://en.wikipedia.org/w/api.php?action=search&format=json&srsearch={urllib.parse.quote(query)}&srlimit={max_results}"
        
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(search_url)
            data = resp.json()
        
        results = []
        for item in data.get("query", {}).get("search", []):
            title = item.get("title", "")
            snippet = re.sub(r'<[^>]+>', '', item.get("snippet", ""))
            results.append({
                "title": title,
                "url": f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}",
                "description": snippet,
                "type": "article",
                "source": "Wikipedia"
            })
        
        return results
    except Exception as e:
        print(f"Wikipedia search error: {e}")
        return []

async def search_youtube_free(query: str, max_results: int = 5) -> List[Dict]:
    """Search for YouTube videos using DuckDuckGo (no API key needed)"""
    try:
        yt_query = f"{query} site:youtube.com"
        results = await search_duckduckgo(yt_query, max_results * 2)
        
        yt_results = []
        for r in results:
            if "youtube.com/watch" in r.get("url", ""):
                vid_id = ""
                url = r["url"]
                if "v=" in url:
                    vid_id = url.split("v=")[1].split("&")[0]
                
                yt_results.append({
                    "title": r["title"],
                    "url": r["url"],
                    "description": r["description"],
                    "type": "youtube",
                    "source": "YouTube",
                    "thumbnail": f"https://img.youtube.com/vi/{vid_id}/mqdefault.jpg" if vid_id else None
                })
        
        return yt_results[:max_results]
    except Exception as e:
        print(f"YouTube search error: {e}")
        return []

async def search_educational_resources(
    class_level: int, subject: str, chapter: str, resource_type: str = "all"
) -> Dict[str, List[Dict]]:
    """Comprehensive resource search for a chapter"""
    
    base_query = f"CBSE Class {class_level} {subject} {chapter}"
    
    resources = {
        "youtube": [],
        "articles": [],
        "pdfs": [],
        "notes": []
    }
    
    tasks = []
    
    if resource_type in ["all", "youtube"]:
        tasks.append(("youtube", search_youtube_free(f"{base_query} lecture tutorial", 5)))
    
    if resource_type in ["all", "article"]:
        tasks.append(("wiki", search_wikipedia(f"{subject} {chapter}", 3)))
        tasks.append(("ddg", search_duckduckgo(f"{base_query} explanation notes", 5)))
    
    if resource_type in ["all", "pdf"]:
        tasks.append(("pdf", search_duckduckgo(f"{base_query} PDF notes download NCERT", 5)))
    
    # Execute all searches concurrently
    for name, coro in tasks:
        try:
            result = await coro
            if name == "youtube":
                resources["youtube"].extend(result)
            elif name in ["wiki", "ddg"]:
                resources["articles"].extend(result)
            elif name == "pdf":
                for r in result:
                    if ".pdf" in r.get("url", "").lower() or "pdf" in r.get("title", "").lower():
                        resources["pdfs"].append(r)
                    else:
                        resources["notes"].append(r)
        except Exception as e:
            print(f"Resource search {name} failed: {e}")
    
    # Curated trusted educational sites
    trusted_resources = get_trusted_resources(class_level, subject, chapter)
    resources["notes"].extend(trusted_resources)
    
    # Deduplicate
    for key in resources:
        seen = set()
        unique = []
        for r in resources[key]:
            url = r.get("url", "")
            if url and url not in seen:
                seen.add(url)
                unique.append(r)
        resources[key] = unique[:8]
    
    return resources

def get_trusted_resources(class_level: int, subject: str, chapter: str) -> List[Dict]:
    """Return curated trusted educational resources"""
    resources = []
    
    ch_encoded = urllib.parse.quote(chapter.replace(" ", "+"))
    
    # NCERT
    resources.append({
        "title": f"NCERT Class {class_level} {subject} - Official Textbook",
        "url": f"https://ncert.nic.in/textbook.php?class={class_level}&subject={subject.lower()}",
        "description": "Official NCERT textbook - Free to read online",
        "type": "article",
        "source": "NCERT"
    })
    
    # Khan Academy
    resources.append({
        "title": f"Khan Academy - {subject}: {chapter}",
        "url": f"https://www.khanacademy.org/search?page_search_query={ch_encoded}",
        "description": "Free video lessons and practice problems",
        "type": "youtube",
        "source": "Khan Academy"
    })
    
    # Byju's free content
    resources.append({
        "title": f"CBSE Class {class_level} {subject} {chapter} Notes",
        "url": f"https://byjus.com/cbse-notes/cbse-class-{class_level}-{subject.lower()}-notes/",
        "description": "Comprehensive chapter notes and summaries",
        "type": "article",
        "source": "Byju's"
    })
    
    return resources
