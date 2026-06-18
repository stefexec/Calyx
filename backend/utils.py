import httpx
import logging
from sqlalchemy.orm import Session
import models

logger = logging.getLogger(__name__)

async def send_ntfy_notification(title: str, message: str, priority: str, db: Session):
    ntfy_url_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "ntfyUrl").first()
    ntfy_topic_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "ntfyTopic").first()
    ntfy_token_setting = db.query(models.AppSetting).filter(models.AppSetting.key == "ntfyToken").first()
    
    ntfy_url = ntfy_url_setting.value if ntfy_url_setting else "https://ntfy.sh"
    ntfy_topic = ntfy_topic_setting.value if ntfy_topic_setting else "calyx_alerts"
    ntfy_token = ntfy_token_setting.value if ntfy_token_setting else ""
    
    if not ntfy_url or not ntfy_topic:
        logger.warning("Ntfy URL or Topic not configured. Skipping background push notification.")
        return

    base_url = ntfy_url.rstrip("/")
    ntfy_priority = 3
    if priority == "high":
        ntfy_priority = 5
    elif priority == "low":
        ntfy_priority = 1
        
    payload = {
        "topic": ntfy_topic,
        "message": message,
        "title": title,
        "priority": ntfy_priority,
        "tags": ["warning", "leaves"]
    }
    
    headers = {"Content-Type": "application/json"}
    if ntfy_token and ntfy_token.strip() != "":
        headers["Authorization"] = f"Bearer {ntfy_token}"
        
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"{base_url}/", json=payload, headers=headers, timeout=5.0)
            if response.status_code != 200:
                logger.error(f"Ntfy push failed with status: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to send ntfy alert: {e}")
