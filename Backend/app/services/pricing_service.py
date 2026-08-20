from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.competitor import CompetitorPrice
from app.models.sales import Sales


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def safe_float(value, default=0.0):
    """
    Safely convert a value to float.
    """
    try:
        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):
        return default


def calculate_percentage_change(old_value, new_value):
    """
    Calculate percentage change safely.
    """
    if old_value == 0:
        return 0.0

    return (
        (new_value - old_value)
        / old_value
    ) * 100


# =========================================================
# AI PRICING RECOMMENDATION
# =========================================================

def get_pricing_recommendation(
    db: Session,
    product_id: int
):
    # -----------------------------------------------------
    # Get product
    # -----------------------------------------------------

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        return None

    # -----------------------------------------------------
    # Current product price
    # -----------------------------------------------------

    current_price = safe_float(
        product.selling_price
    )

    cost_price = safe_float(
        product.cost_price
    )

    # -----------------------------------------------------
    # Get competitor prices
    # -----------------------------------------------------

    competitors = (
        db.query(CompetitorPrice)
        .filter(
            CompetitorPrice.product_id == product_id
        )
        .all()
    )

    competitor_prices = [
        safe_float(item.competitor_price)
        for item in competitors
        if item.competitor_price is not None
    ]

    # -----------------------------------------------------
    # Competitor analysis
    # -----------------------------------------------------

    if competitor_prices:

        average_competitor_price = (
            sum(competitor_prices)
            / len(competitor_prices)
        )

        lowest_competitor_price = min(
            competitor_prices
        )

        highest_competitor_price = max(
            competitor_prices
        )

        # -------------------------------------------------
        # Pricing recommendation
        # -------------------------------------------------

        # Move partially toward market average.
        # This avoids aggressive price changes.

        recommended_price = (
            current_price * 0.5
            + average_competitor_price * 0.5
        )

        # -------------------------------------------------
        # Keep recommendation inside sensible bounds
        # -------------------------------------------------

        lower_bound = (
            lowest_competitor_price * 0.95
        )

        upper_bound = (
            highest_competitor_price * 1.05
        )

        recommended_price = max(
            recommended_price,
            lower_bound
        )

        recommended_price = min(
            recommended_price,
            upper_bound
        )

    else:

        average_competitor_price = None
        lowest_competitor_price = None
        highest_competitor_price = None

        recommended_price = current_price

    # -----------------------------------------------------
    # Recommendation direction
    # -----------------------------------------------------

    if recommended_price > current_price:

        recommendation_direction = "INCREASE"

    elif recommended_price < current_price:

        recommendation_direction = "DECREASE"

    else:

        recommendation_direction = "MAINTAIN"

    # -----------------------------------------------------
    # Market position
    # -----------------------------------------------------

    if average_competitor_price is None:

        market_position = "NO COMPETITOR DATA"

    elif current_price < lowest_competitor_price:

        market_position = "BELOW MARKET"

    elif current_price > highest_competitor_price:

        market_position = "ABOVE MARKET"

    else:

        market_position = "WITHIN MARKET RANGE"

    # -----------------------------------------------------
    # Price difference from competitor average
    # -----------------------------------------------------

    if average_competitor_price:

        competitor_difference = (
            current_price
            - average_competitor_price
        )

        competitor_difference_percent = (
            competitor_difference
            / average_competitor_price
        ) * 100

    else:

        competitor_difference = None
        competitor_difference_percent = None

    # -----------------------------------------------------
    # Pricing opportunity
    # -----------------------------------------------------

    if average_competitor_price:

        if current_price > average_competitor_price:

            pricing_opportunity = (
                "Improve competitiveness by reducing price."
            )

        elif current_price < average_competitor_price:

            pricing_opportunity = (
                "Potential opportunity to increase price "
                "while remaining competitive."
            )

        else:

            pricing_opportunity = (
                "Current price is closely aligned "
                "with the market."
            )

    else:

        pricing_opportunity = (
            "Add competitor pricing data for "
            "stronger market analysis."
        )

    # -----------------------------------------------------
    # Recommendation confidence
    # -----------------------------------------------------

    competitor_count = len(
        competitor_prices
    )

    if competitor_count >= 5:

        recommendation_confidence = "HIGH"

    elif competitor_count >= 2:

        recommendation_confidence = "MEDIUM"

    elif competitor_count == 1:

        recommendation_confidence = "LOW"

    else:

        recommendation_confidence = "LIMITED"

    # -----------------------------------------------------
    # Return recommendation
    # -----------------------------------------------------

    return {
        "product_id": product.id,

        "product_name": product.product_name,

        "current_price": round(
            current_price,
            2
        ),

        "cost_price": round(
            cost_price,
            2
        ),

        "average_competitor_price": (
            round(
                average_competitor_price,
                2
            )
            if average_competitor_price is not None
            else None
        ),

        "lowest_competitor_price": (
            round(
                lowest_competitor_price,
                2
            )
            if lowest_competitor_price is not None
            else None
        ),

        "highest_competitor_price": (
            round(
                highest_competitor_price,
                2
            )
            if highest_competitor_price is not None
            else None
        ),

        "recommended_price": round(
            recommended_price,
            2
        ),

        "competitor_count": competitor_count,

        "market_position": market_position,

        "recommendation_direction": (
            recommendation_direction
        ),

        "competitor_price_difference": (
            round(
                competitor_difference,
                2
            )
            if competitor_difference is not None
            else None
        ),

        "competitor_price_difference_percent": (
            round(
                competitor_difference_percent,
                2
            )
            if competitor_difference_percent is not None
            else None
        ),

        "pricing_opportunity": (
            pricing_opportunity
        ),

        "recommendation_confidence": (
            recommendation_confidence
        )
    }


# =========================================================
# WHAT-IF PRICING SIMULATION
# =========================================================

def simulate_pricing(
    db: Session,
    product_id: int,
    proposed_price: float
):

    # -----------------------------------------------------
    # Validate proposed price
    # -----------------------------------------------------

    if proposed_price <= 0:
        return None

    proposed_price = safe_float(
        proposed_price
    )

    # -----------------------------------------------------
    # Get product
    # -----------------------------------------------------

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        return None

    # -----------------------------------------------------
    # Current product price
    # -----------------------------------------------------

    current_price = safe_float(
        product.selling_price
    )

    cost_price = safe_float(
        product.cost_price
    )

    # -----------------------------------------------------
    # Get competitor prices
    # -----------------------------------------------------

    competitors = (
        db.query(CompetitorPrice)
        .filter(
            CompetitorPrice.product_id == product_id
        )
        .all()
    )

    competitor_prices = [
        safe_float(item.competitor_price)
        for item in competitors
        if item.competitor_price is not None
    ]

    # -----------------------------------------------------
    # Competitor statistics
    # -----------------------------------------------------

    if competitor_prices:

        average_competitor_price = (
            sum(competitor_prices)
            / len(competitor_prices)
        )

        lowest_competitor_price = min(
            competitor_prices
        )

        highest_competitor_price = max(
            competitor_prices
        )

    else:

        average_competitor_price = None
        lowest_competitor_price = None
        highest_competitor_price = None

    competitor_count = len(
        competitor_prices
    )

    # -----------------------------------------------------
    # Get sales history
    # -----------------------------------------------------

    sales = (
        db.query(Sales)
        .filter(
            Sales.product_id == product_id
        )
        .all()
    )

    total_quantity_sold = sum(
        safe_float(sale.quantity_sold)
        for sale in sales
        if sale.quantity_sold is not None
    )

    total_historical_revenue = sum(
        safe_float(sale.revenue)
        for sale in sales
        if sale.revenue is not None
    )

    sales_count = len(sales)

    # -----------------------------------------------------
    # Historical average demand
    # -----------------------------------------------------

    if sales_count > 0:

        average_quantity_per_sale = (
            total_quantity_sold
            / sales_count
        )

    else:

        average_quantity_per_sale = 0.0

    # -----------------------------------------------------
    # Price change
    # -----------------------------------------------------

    price_change = (
        proposed_price
        - current_price
    )

    price_change_percent = (
        calculate_percentage_change(
            current_price,
            proposed_price
        )
    )

    # -----------------------------------------------------
    # DEMAND SIMULATION
    # -----------------------------------------------------
    #
    # Transparent price-elasticity assumption.
    #
    # This is NOT presented as a trained ML model.
    #
    # Negative elasticity means:
    #
    # Price ↑ → Demand ↓
    #
    # Price ↓ → Demand ↑
    #
    # -----------------------------------------------------

    elasticity = -0.5

    price_change_ratio = 0.0

    if current_price > 0:

        price_change_ratio = (
            proposed_price
            - current_price
        ) / current_price

    demand_factor = (
        1
        + elasticity
        * price_change_ratio
    )

    # Prevent impossible negative demand.

    demand_factor = max(
        demand_factor,
        0
    )

    estimated_demand = (
        average_quantity_per_sale
        * demand_factor
    )

    # -----------------------------------------------------
    # Estimated revenue
    # -----------------------------------------------------

    estimated_revenue = (
        proposed_price
        * estimated_demand
    )

    # -----------------------------------------------------
    # Current estimated revenue
    # -----------------------------------------------------

    current_estimated_revenue = (
        current_price
        * average_quantity_per_sale
    )

    # -----------------------------------------------------
    # Revenue impact
    # -----------------------------------------------------

    revenue_change = (
        estimated_revenue
        - current_estimated_revenue
    )

    revenue_change_percent = (
        calculate_percentage_change(
            current_estimated_revenue,
            estimated_revenue
        )
    )

    # -----------------------------------------------------
    # PROFIT SIMULATION
    # -----------------------------------------------------

    current_profit_per_unit = (
        current_price
        - cost_price
    )

    proposed_profit_per_unit = (
        proposed_price
        - cost_price
    )

    current_estimated_profit = (
        current_profit_per_unit
        * average_quantity_per_sale
    )

    estimated_profit = (
        proposed_profit_per_unit
        * estimated_demand
    )

    profit_change = (
        estimated_profit
        - current_estimated_profit
    )

    profit_change_percent = (
        calculate_percentage_change(
            current_estimated_profit,
            estimated_profit
        )
    )

    # -----------------------------------------------------
    # PROFIT MARGIN
    # -----------------------------------------------------

    if proposed_price > 0:

        proposed_profit_margin = (
            proposed_profit_per_unit
            / proposed_price
        ) * 100

    else:

        proposed_profit_margin = 0.0

    # -----------------------------------------------------
    # DEMAND IMPACT
    # -----------------------------------------------------

    demand_change_percent = (
        calculate_percentage_change(
            average_quantity_per_sale,
            estimated_demand
        )
    )

    # -----------------------------------------------------
    # MARKET POSITION
    # -----------------------------------------------------

    if average_competitor_price is None:

        market_position = (
            "NO COMPETITOR DATA"
        )

    elif proposed_price < lowest_competitor_price:

        market_position = (
            "BELOW MARKET"
        )

    elif proposed_price > highest_competitor_price:

        market_position = (
            "ABOVE MARKET"
        )

    else:

        market_position = (
            "WITHIN MARKET RANGE"
        )

    # -----------------------------------------------------
    # Competitor price difference
    # -----------------------------------------------------

    if average_competitor_price is not None:

        competitor_price_difference = (
            proposed_price
            - average_competitor_price
        )

        competitor_price_difference_percent = (
            calculate_percentage_change(
                average_competitor_price,
                proposed_price
            )
        )

    else:

        competitor_price_difference = None
        competitor_price_difference_percent = None

    # -----------------------------------------------------
    # PRICE COMPETITIVENESS SCORE
    # -----------------------------------------------------

    if average_competitor_price is None:

        competitiveness_score = None

    else:

        price_distance = abs(
            proposed_price
            - average_competitor_price
        )

        if average_competitor_price > 0:

            distance_percent = (
                price_distance
                / average_competitor_price
            ) * 100

        else:

            distance_percent = 100

        competitiveness_score = max(
            0,
            min(
                100,
                100 - distance_percent * 2
            )
        )

    # -----------------------------------------------------
    # DATA QUALITY
    # -----------------------------------------------------

    if (
        sales_count >= 10
        and competitor_count >= 5
    ):

        data_quality = "HIGH"

    elif (
        sales_count >= 5
        and competitor_count >= 2
    ):

        data_quality = "MEDIUM"

    elif (
        sales_count > 0
        or competitor_count > 0
    ):

        data_quality = "LOW"

    else:

        data_quality = "LIMITED"

    # -----------------------------------------------------
    # BUSINESS RECOMMENDATION
    # -----------------------------------------------------

    if (
        profit_change_percent > 0
        and revenue_change_percent > 0
    ):

        business_recommendation = (
            "FAVORABLE SCENARIO"
        )

        business_message = (
            "The proposed price shows potential "
            "improvement in both estimated revenue "
            "and estimated profit."
        )

    elif (
        revenue_change_percent > 0
        and profit_change_percent <= 0
    ):

        business_recommendation = (
            "REVENUE PRIORITY"
        )

        business_message = (
            "The proposed price may increase revenue, "
            "but the estimated profit impact should "
            "be reviewed before implementation."
        )

    elif (
        revenue_change_percent <= 0
        and profit_change_percent > 0
    ):

        business_recommendation = (
            "MARGIN PRIORITY"
        )

        business_message = (
            "The proposed price may reduce estimated "
            "revenue but improve estimated profit "
            "per scenario."
        )

    elif proposed_price > current_price:

        business_recommendation = (
            "CAUTIOUS INCREASE"
        )

        business_message = (
            "The proposed price is higher than the "
            "current price. Review demand sensitivity "
            "before applying the change."
        )

    elif proposed_price < current_price:

        business_recommendation = (
            "CAUTIOUS DECREASE"
        )

        business_message = (
            "The proposed price is lower than the "
            "current price. The scenario may improve "
            "competitiveness but should be evaluated "
            "against profitability."
        )

    else:

        business_recommendation = (
            "MAINTAIN PRICE"
        )

        business_message = (
            "The proposed price matches the current "
            "price, so no material pricing change "
            "is simulated."
        )

    # -----------------------------------------------------
    # Revenue status
    # -----------------------------------------------------

    if revenue_change_percent > 0:

        recommendation_status = (
            "POTENTIAL REVENUE IMPROVEMENT"
        )

    elif revenue_change_percent < 0:

        recommendation_status = (
            "POTENTIAL REVENUE DECLINE"
        )

    else:

        recommendation_status = (
            "REVENUE UNCHANGED"
        )

    # -----------------------------------------------------
    # Simulation note
    # -----------------------------------------------------

    simulation_note = (
        "This scenario uses historical sales volume, "
        "competitor pricing, current product pricing, "
        "and a transparent price-elasticity assumption "
        "of -0.5. It is a decision-support simulation "
        "and not a trained price-elasticity model."
    )

    # -----------------------------------------------------
    # Return result
    # -----------------------------------------------------

    return {

        # -------------------------------------------------
        # Product
        # -------------------------------------------------

        "product_id": product.id,

        "product_name": product.product_name,

        # -------------------------------------------------
        # Price
        # -------------------------------------------------

        "current_price": round(
            current_price,
            2
        ),

        "proposed_price": round(
            proposed_price,
            2
        ),

        "price_change": round(
            price_change,
            2
        ),

        "price_change_percent": round(
            price_change_percent,
            2
        ),

        # -------------------------------------------------
        # Cost / profit
        # -------------------------------------------------

        "cost_price": round(
            cost_price,
            2
        ),

        "current_profit_per_unit": round(
            current_profit_per_unit,
            2
        ),

        "proposed_profit_per_unit": round(
            proposed_profit_per_unit,
            2
        ),

        "current_estimated_profit": round(
            current_estimated_profit,
            2
        ),

        "estimated_profit": round(
            estimated_profit,
            2
        ),

        "profit_change": round(
            profit_change,
            2
        ),

        "profit_change_percent": round(
            profit_change_percent,
            2
        ),

        "proposed_profit_margin": round(
            proposed_profit_margin,
            2
        ),

        # -------------------------------------------------
        # Competitor
        # -------------------------------------------------

        "average_competitor_price": (
            round(
                average_competitor_price,
                2
            )
            if average_competitor_price is not None
            else None
        ),

        "lowest_competitor_price": (
            round(
                lowest_competitor_price,
                2
            )
            if lowest_competitor_price is not None
            else None
        ),

        "highest_competitor_price": (
            round(
                highest_competitor_price,
                2
            )
            if highest_competitor_price is not None
            else None
        ),

        "competitor_count": (
            competitor_count
        ),

        "competitor_price_difference": (
            round(
                competitor_price_difference,
                2
            )
            if competitor_price_difference is not None
            else None
        ),

        "competitor_price_difference_percent": (
            round(
                competitor_price_difference_percent,
                2
            )
            if competitor_price_difference_percent is not None
            else None
        ),

        # -------------------------------------------------
        # Sales history
        # -------------------------------------------------

        "total_sales_records": (
            sales_count
        ),

        "total_quantity_sold": (
            round(
                total_quantity_sold,
                2
            )
        ),

        "total_historical_revenue": (
            round(
                total_historical_revenue,
                2
            )
        ),

        "average_quantity_per_sale": (
            round(
                average_quantity_per_sale,
                2
            )
        ),

        # -------------------------------------------------
        # Demand simulation
        # -------------------------------------------------

        "elasticity_assumption": (
            elasticity
        ),

        "demand_factor": round(
            demand_factor,
            4
        ),

        "estimated_demand": round(
            estimated_demand,
            2
        ),

        "demand_change_percent": round(
            demand_change_percent,
            2
        ),

        # -------------------------------------------------
        # Revenue
        # -------------------------------------------------

        "estimated_revenue": round(
            estimated_revenue,
            2
        ),

        "current_estimated_revenue": round(
            current_estimated_revenue,
            2
        ),

        "revenue_change": round(
            revenue_change,
            2
        ),

        "revenue_change_percent": round(
            revenue_change_percent,
            2
        ),

        # -------------------------------------------------
        # Market analysis
        # -------------------------------------------------

        "market_position": (
            market_position
        ),

        "competitiveness_score": (
            round(
                competitiveness_score,
                2
            )
            if competitiveness_score is not None
            else None
        ),

        # -------------------------------------------------
        # Decision support
        # -------------------------------------------------

        "recommendation_status": (
            recommendation_status
        ),

        "business_recommendation": (
            business_recommendation
        ),

        "business_message": (
            business_message
        ),

        # -------------------------------------------------
        # Data quality
        # -------------------------------------------------

        "data_quality": (
            data_quality
        ),

        # -------------------------------------------------
        # Transparency
        # -------------------------------------------------

        "simulation_note": (
            simulation_note
        )
    }