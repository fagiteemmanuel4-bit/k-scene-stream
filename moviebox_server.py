import asyncio
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from moviebox_api.v3.http_client import MovieBoxHttpClient
from moviebox_api.v3.core import Search, ItemDetails, SeasonDetails, DownloadableFilesDetail, Homepage, DownloadableCaptionFileDetails
from moviebox_api.v3.constants import TabID
from contextlib import asynccontextmanager
import uvicorn
import os
import random
from vidsrc_extractor import extract_vidsrc

session = MovieBoxHttpClient()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await session.__aenter__()
    yield
    await session.__aexit__(None, None, None)

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/search")
async def search(q: str = Query(...), page: int = 1):
    try:
        search_api = Search(session, q, page=page)
        results = await search_api.get_content_model()
        return results.model_dump()
    except Exception as e:
        print(f"Error in search: {e}")
        return {"items": [], "pager": {"has_more": False}}

@app.get("/details/{subject_id}")
async def details(subject_id: str):
    try:
        details_api = ItemDetails(session, include_seasons=True)
        results = await details_api.get_content_model(subject_id)
        return results.model_dump()
    except Exception as e:
        print(f"Error in details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/play")
async def play(subject_id: str, season: int = 0, episode: int = 0):
    try:
        from moviebox_api.v3.urls import PLAY_INFO_PATH
        params = {
            "subjectId": subject_id,
            "se": season,
            "ep": episode,
        }
        content = await session.get_from_api(PLAY_INFO_PATH, params=params)
        return content
    except Exception as e:
        print(f"Error in play: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/subtitles")
async def subtitles(subject_id: str, resource_id: str):
    try:
        captions_api = DownloadableCaptionFileDetails(session)
        results = await captions_api.get_content_model(subject_id, resource_id)
        return results.model_dump()
    except Exception as e:
        print(f"Error in subtitles: {e}")
        return {"subtitles": []}

@app.get("/trending")
async def trending(page: int = 1):
    try:
        homepage_api = Homepage(session)
        results = await homepage_api.get_content_model()
        return results.model_dump()
    except Exception as e:
        print(f"Error in trending: {e}")
        return {"items": []}

@app.get("/feeds")
async def feeds():
    # Scrape-like logic: Get latest trending items from moviebox and mix with dummy social data
    try:
        homepage_api = Homepage(session)
        data = await homepage_api.get_content_model()
        items = []
        for it in (data.items or []):
            if it.title:
                items.append({
                    "id": it.subject_id,
                    "title": it.title,
                    "content": f"New update on {it.title}! Check out the latest news and rumors about the upcoming season. #{it.title.replace(' ', '')} #KScene",
                    "source": random.choice(["YouTube", "Twitter", "Instagram"]),
                    "image": it.cover.url if it.cover else None,
                    "viewers": it.viewers,
                    "timestamp": "Just now"
                })
        return items
    except Exception as e:
        print(f"Error in feeds: {e}")
        return []

@app.get("/shorts")
async def get_shorts():
    # Mixing real moviebox items with shorts data
    try:
        homepage_api = Homepage(session)
        data = await homepage_api.get_content_model()
        shorts = []
        for it in (data.items or []):
            if it.subject_type == 2: # TV Series often have trailers
                 shorts.append({
                     "id": it.subject_id,
                     "name": it.title,
                     "poster_path": it.cover.url if it.cover else None,
                     "backdrop_path": it.cover.url if it.cover else None,
                     "content": f"Can't believe this happened in {it.title}! 😱",
                     "likes": random.randint(1000, 50000),
                     "shares": random.randint(100, 5000)
                 })
        return shorts
    except Exception as e:
        print(f"Error in shorts: {e}")
        return []

@app.get("/vidsrc")
async def get_vidsrc(tmdb_id: str, is_tv: bool = False, s: int = 1, e: int = 1):
    try:
        result = extract_vidsrc(tmdb_id, is_tv, s, e)
        if result:
            return result
        raise HTTPException(status_code=404, detail="No stream found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/artists")
async def get_artists():
    # Dynamic artist popup data
    artists = [
        {"name": "IU", "reason": "New Single 'Love Wins All' Trending", "img": "https://img.youtube.com/vi/6p_YI_Q6gOM/0.jpg"},
        {"name": "Jennie", "reason": "Solo Comeback Performance", "img": "https://img.youtube.com/vi/j5p9fB5u_yI/0.jpg"},
        {"name": "Squid Game Cast", "reason": "S2 Final Teaser Released", "img": "https://img.youtube.com/vi/U2ptPjAMnNI/0.jpg"}
    ]
    return random.sample(artists, 1)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
