from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from backend.utils.db import execute_query

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("")
def get_notifications(limit: int = 50):
    """Retrieves notifications audit trails."""
    try:
        notifications = execute_query(
            "SELECT * FROM notifications ORDER BY timestamp DESC LIMIT %s",
            (limit,)
        )
        return notifications
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to fetch notifications: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications due to an internal database error.")

@router.get("/unread-count")
def get_unread_count():
    """Retrieves count of unread system warnings and pricing event logs."""
    try:
        cnt = execute_query(
            "SELECT COUNT(*) as count FROM notifications WHERE status = %s",
            ("unread",)
        )
        return {"count": cnt[0]["count"] if cnt else 0}
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to read unread counts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve unread notifications count.")

@router.post("/read")
def mark_as_read(notif_id: Optional[int] = Query(None, description="Mark a specific notification ID as read, otherwise marks all.")):
    """Marks system notification alerts as read."""
    try:
        if notif_id:
            execute_query(
                "UPDATE notifications SET status = %s WHERE id = %s",
                ("read", notif_id),
                is_write=True
            )
        else:
            execute_query(
                "UPDATE notifications SET status = %s WHERE status = %s",
                ("read", "unread"),
                is_write=True
            )
        return {"status": "success", "message": "Notification(s) updated successfully."}
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to update notifications status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update notifications status due to a database write error.")

@router.post("/clear")
def clear_notifications():
    """Wipes the notifications list clean."""
    try:
        execute_query("DELETE FROM notifications", is_write=True)
        return {"status": "success", "message": "All system alerts cleared."}
    except Exception as e:
        import logging
        logging.getLogger("pricepilot").error(f"Failed to clear alerts: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to clear system notifications due to a database error.")
