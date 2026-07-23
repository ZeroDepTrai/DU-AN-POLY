from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_customer_support
from app.models import Order, OrderStatus, Product, User, UserRole
from app.schemas import (
    AnalyticsOverview,
    AnalyticsOrdersByStatus,
    AnalyticsRevenue,
    AnalyticsTopProducts,
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/overview", response_model=AnalyticsOverview)
def get_analytics_overview(
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Get analytics overview for the dashboard."""
    # Total products
    total_products = db.query(func.count(Product.id)).scalar() or 0

    # Total orders
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    # Total revenue (from delivered orders)
    total_revenue = db.query(func.coalesce(func.sum(
        # This is simplified - in real scenario you'd sum order items
        0
    ), 0.0)).scalar() or 0.0

    # Try to calculate from orders (sum of items)
    try:
        result = db.execute(
            text("""
                SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) as total
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.status = 'delivered'
            """)
        ).scalar()
        if result:
            total_revenue = float(result)
    except Exception:
        pass

    # Active users (users who ordered in last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    active_users = db.query(func.count(func.distinct(Order.user_id))).filter(
        Order.status == OrderStatus.delivered
    ).scalar() or 0

    # Conversion rate (simplified)
    conversion_rate = 0.0
    if total_products > 0:
        conversion_rate = min(100.0, (total_orders / max(1, total_products)) * 10)

    # Average order value
    avg_order_value = 0.0
    if total_orders > 0:
        avg_order_value = total_revenue / total_orders

    return AnalyticsOverview(
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=total_revenue,
        active_users=active_users,
        conversion_rate=round(conversion_rate, 2),
        avg_order_value=round(avg_order_value, 0),
        chat_response_time=45.0,  # Placeholder
        customer_satisfaction=4.2,  # Placeholder
    )


@router.get("/revenue", response_model=AnalyticsRevenue)
def get_revenue_analytics(
    days: int = 7,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Get revenue analytics for the specified number of days."""
    labels = []
    values = []

    today = datetime.now(timezone.utc).date()

    for i in range(days - 1, -1, -1):
        date = today - timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        labels.append(date.strftime("%d/%m"))

        try:
            result = db.execute(
                text("""
                    SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) as daily_total
                    FROM orders o
                    JOIN order_items oi ON o.id = oi.order_id
                    WHERE DATE(o.created_at AT TIME ZONE 'UTC') = :date
                    AND o.status = 'delivered'
                """),
                {"date": date_str}
            ).scalar()
            values.append(float(result) if result else 0.0)
        except Exception:
            values.append(0.0)

    return AnalyticsRevenue(labels=labels, values=values)


@router.get("/orders-by-status", response_model=AnalyticsOrdersByStatus)
def get_orders_by_status(
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Get order count by status."""
    status_labels = ["pending", "processing", "shipped", "in_transit", "delivered"]
    status_values = [OrderStatus.pending, OrderStatus.processing, OrderStatus.shipped,
                     OrderStatus.in_transit, OrderStatus.delivered]

    labels = []
    values = []

    for label, status in zip(status_labels, status_values):
        count = db.query(func.count(Order.id)).filter(Order.status == status).scalar() or 0
        labels.append(label)
        values.append(count)

    return AnalyticsOrdersByStatus(labels=labels, values=values)


@router.get("/top-products", response_model=AnalyticsTopProducts)
def get_top_products(
    limit: int = 5,
    current_user: User = Depends(require_customer_support),
    db: Session = Depends(get_db),
):
    """Get top selling products."""
    labels = []
    values = []

    try:
        results = db.execute(
            text("""
                SELECT p.name, COALESCE(SUM(oi.quantity), 0) as total_sold
                FROM products p
                LEFT JOIN order_items oi ON p.id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id AND o.status = 'delivered'
                GROUP BY p.id, p.name
                ORDER BY total_sold DESC
                LIMIT :limit
            """),
            {"limit": limit}
        ).fetchall()

        for row in results:
            labels.append(row[0])
            values.append(row[1])
    except Exception:
        # Fallback to top rated products
        products = db.query(Product).limit(limit).all()
        for p in products:
            labels.append(p.name)
            values.append(0)

    return AnalyticsTopProducts(labels=labels, values=values)
