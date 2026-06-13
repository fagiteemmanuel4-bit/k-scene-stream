import asyncio
import json
from moviebox_api.v2 import Session, Search, MovieDetails, TVSeriesDetails

async def test_moviebox():
    session = Session()
    print("Searching for Squid Game...")
    search_api = Search(session, "Squid Game")
    results = await search_api.get_content_model()

    if results.items:
        first_item = results.items[0]
        print(f"First item: {first_item}")

        # Details
        details_api = TVSeriesDetails(session)
        details = await details_api.get_content_model(first_item.id)
        # print(f"Details keys: {details.model_fields.keys()}")

        # Check for download files
        # Let's try to find how to get links
        print("Checking for links...")
        # dir(details_api)
        print(f"API methods: {[m for m in dir(details_api) if not m.startswith('_')]}")

if __name__ == "__main__":
    asyncio.run(test_moviebox())
