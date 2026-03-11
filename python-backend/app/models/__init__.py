"""
Models package - Pydantic models for data validation.
Note: Database operations now use direct PostgreSQL queries via asyncpg.
The old Beanie/MongoDB models have been removed.
"""

# This package is now used for Pydantic schemas only
# Actual database operations are in app/services/database.py
# and individual API files (app/api/*.py)
