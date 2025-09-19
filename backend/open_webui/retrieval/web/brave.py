import logging
from typing import Optional

import requests
from open_webui.env import SRC_LOG_LEVELS
from open_webui.retrieval.web.main import SearchResult, get_filtered_results

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["RAG"])


def search_brave(
    api_key: str, query: str, count: int, filter_list: Optional[list[str]] = None
) -> list[SearchResult]:
    """Search using Brave's Chat Completions API and return the results as a list of SearchResult objects.

    Args:
        api_key (str): A Brave Search API key
        query (str): The query to search for
    """
    url = "https://api.search.brave.com/res/v1/chat/completions"
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": api_key,
        "Content-Type": "application/json",
    }

    # Prepare the request body for chat completions
    payload = {"stream": "false", "messages": [{"role": "user", "content": query}]}

    response = requests.post(url, headers=headers, json=payload)
    response.raise_for_status()

    json_response = response.json()

    # Extract content from the chat completion response
    choices = json_response.get("choices", [])
    if not choices:
        return []

    content = choices[0].get("message", {}).get("content", "")

    # Create a single SearchResult with the content as snippet
    # Using mock values for link and title as requested
    result = SearchResult(
        link="https://search.brave.com/",
        title="Brave Search Results",
        snippet=content,
    )

    return [result]
