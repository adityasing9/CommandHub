from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db import models

def get_dashboard_stats(db: Session):
    # Total Executions
    total_runs = db.query(models.History).count()
    
    # Success Rate (exit code 0)
    successful_runs = db.query(models.History).filter(models.History.exit_code == 0).count()
    success_rate = round((successful_runs / total_runs * 100), 1) if total_runs > 0 else 100.0
    
    # Most run commands
    most_used = (
        db.query(models.History.raw_command, func.count(models.History.raw_command).label("qty"))
        .group_by(models.History.raw_command)
        .order_by(func.count(models.History.raw_command).desc())
        .limit(5)
        .all()
    )
    
    most_used_list = [{"command": mu[0], "count": mu[1]} for mu in most_used]
    
    # Favorites count
    total_favs = db.query(models.Favorite).count()
    
    # Recent activities
    recent_runs = (
        db.query(models.History)
        .order_by(models.History.executed_at.desc())
        .limit(5)
        .all()
    )
    recent_list = [
        {
            "id": r.id,
            "raw_command": r.raw_command,
            "executed_at": r.executed_at.isoformat(),
            "exit_code": r.exit_code
        }
        for r in recent_runs
    ]
    
    return {
        "total_runs": total_runs,
        "success_rate": success_rate,
        "total_favorites": total_favs,
        "most_used": most_used_list,
        "recent_activity": recent_list
    }
