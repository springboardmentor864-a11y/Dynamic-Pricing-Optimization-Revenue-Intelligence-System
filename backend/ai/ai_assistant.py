import database_workspace

class PricePilotAssistant:
    def __init__(self, user_id, active_hash):
        self.user_id = user_id
        self.active_hash = active_hash

    def answer(self, question):
        if not self.active_hash:
            return {"answer": "No dataset loaded. Please upload a dataset first."}

        question = question.lower()
        conn = database_workspace.get_workspace_conn(self.user_id)
        
        where_str = "WHERE dataset_hash = ?" if (self.active_hash != "all") else ""
        params = [self.active_hash] if (self.active_hash != "all") else []

        try:
            if "highest revenue" in question:
                query = f"SELECT product, revenue FROM products {where_str} ORDER BY revenue DESC LIMIT 1;"
                row = conn.execute(query, params).fetchone()
                if row:
                    return {"answer": f'{row["product"]} generated the highest revenue (₹{row["revenue"]:,.2f}).'}
                return {"answer": "No product records found."}

            elif "highest sales" in question:
                query = f"SELECT product, sales FROM products {where_str} ORDER BY sales DESC LIMIT 1;"
                row = conn.execute(query, params).fetchone()
                if row:
                    return {"answer": f'{row["product"]} recorded the highest sales ({int(row["sales"]):,} units).'}
                return {"answer": "No product records found."}

            elif "lowest stock" in question:
                query = f"SELECT product, stock FROM products {where_str} ORDER BY stock ASC LIMIT 1;"
                row = conn.execute(query, params).fetchone()
                if row:
                    return {"answer": f'{row["product"]} has the lowest stock ({int(row["stock"])} left).'}
                return {"answer": "No product records found."}

            elif "average price" in question:
                query = f"SELECT AVG(price) as val FROM products {where_str};"
                row = conn.execute(query, params).fetchone()
                val = row["val"] if row and row["val"] is not None else 0.0
                return {"answer": f'Average price is ₹{val:,.2f}'}

            elif "total revenue" in question:
                query = f"SELECT SUM(revenue) as val FROM products {where_str};"
                row = conn.execute(query, params).fetchone()
                val = row["val"] if row and row["val"] is not None else 0.0
                return {"answer": f'Total revenue is ₹{val:,.2f}'}

            else:
                return {
                    "answer": "Sorry, I couldn't understand your question. Try asking about 'highest revenue', 'highest sales', 'lowest stock', 'average price', or 'total revenue'."
                }
        except Exception as e:
            return {"answer": f"Error answering question: {str(e)}"}
        finally:
            conn.close()