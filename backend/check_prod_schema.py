from sqlalchemy import create_engine, text
import os
db = create_engine(os.environ.get("DATABASE_URL"))
with db.connect() as c:
    rows = c.execute(text(
        "SELECT column_name, data_type, is_nullable, column_default "
        "FROM information_schema.columns "
        "WHERE table_schema='public' AND table_name='products' "
        "ORDER BY ordinal_position"
    )).fetchall()
    for r in rows:
        print(r.column_name, r.data_type, "nullable:", r.is_nullable, "default:", r.column_default)
