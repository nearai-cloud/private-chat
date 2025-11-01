import logging
import os

from open_webui.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])


class NearAiCloudError(Exception):
    """Custom exception for NEAR AI Cloud API errors"""

    pass


def create_customer_sync(user_id: str) -> bool:
    """
    Create a new customer in NEAR AI Cloud.

    Args:
        user_id: The user ID from the local system

    Returns:
        bool: True if customer was created successfully

    Raises:
        NearAiCloudError: If the API call fails
    """
    import requests

    near_ai_cloud_url = os.getenv("NEAR_AI_CLOUD")
    free_tier_budget_id = os.getenv("FREE_TIER_BUDGET_ID")
    near_ai_cloud_token = os.getenv("NEAR_AI_CLOUD_TOKEN")

    if not near_ai_cloud_url:
        raise NearAiCloudError("NEAR_AI_CLOUD environment variable is not set")
    if not free_tier_budget_id:
        raise NearAiCloudError("FREE_TIER_BUDGET_ID environment variable is not set")
    if not near_ai_cloud_token:
        raise NearAiCloudError("NEAR_AI_CLOUD_TOKEN environment variable is not set")

    url = f"{near_ai_cloud_url.rstrip('/')}/customer/new"
    headers = {
        "Authorization": f"Bearer {near_ai_cloud_token}",
        "Content-Type": "application/json",
    }
    data = {"user_id": user_id, "budget_id": free_tier_budget_id}

    log.info(f"Creating customer in NEAR AI Cloud for user_id: {user_id}")

    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        if response.status_code == 200 or response.status_code == 201:
            log.info(
                f"Successfully created customer in NEAR AI Cloud for user_id: {user_id}"
            )
            return True
        else:
            log.error(
                f"Failed to create customer in NEAR AI Cloud for user_id: {user_id}. "
                f"Status: {response.status_code}, Response: {response.text}"
            )
            raise NearAiCloudError(
                f"API call failed with status {response.status_code}: {response.text}"
            )

    except requests.RequestException as e:
        log.error(
            f"Network error creating customer in NEAR AI Cloud for user_id: {user_id}: {str(e)}"
        )
        raise NearAiCloudError(f"Network error: {str(e)}")
    except Exception as e:
        log.error(
            f"Unexpected error creating customer in NEAR AI Cloud for user_id: {user_id}: {str(e)}"
        )
        raise NearAiCloudError(f"Unexpected error: {str(e)}")
