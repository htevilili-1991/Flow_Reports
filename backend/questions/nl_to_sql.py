"""
Natural language to SQL service with read-only safety.

- Validates that generated SQL is SELECT-only (no INSERT/UPDATE/DELETE/DROP etc.).
- Single statement only.
- Optional: integrate with LLM (e.g. OpenAI) via env; otherwise uses simple placeholder rules.
"""

import re


# Allowed SQL keywords for execution (read-only)
READ_ONLY_KEYWORDS = {"select", "with", "from", "where", "join", "left", "right", "inner", "outer",
                      "on", "group", "by", "order", "asc", "desc", "limit", "offset", "as", "and", "or", "not",
                      "in", "is", "null", "like", "between", "distinct", "having", "union", "all"}
FORBIDDEN_KEYWORDS = {"insert", "update", "delete", "drop", "create", "alter", "truncate", "grant",
                      "revoke", "exec", "execute", "xp_", "sp_", ";--", "/*", "*/"}


def is_sql_read_only(sql: str) -> bool:
    """Return True if sql appears to be a read-only (SELECT/WITH) statement."""
    if not sql or not sql.strip():
        return False
    # Normalize: single statement, strip comments
    normalized = re.sub(r"--[^\n]*", "", sql)
    normalized = re.sub(r"/\*.*?\*/", "", normalized, flags=re.DOTALL)
    normalized = " ".join(normalized.split()).strip().rstrip(";")
    if not normalized:
        return False
    # Must not contain forbidden patterns
    lower = normalized.lower()
    for f in FORBIDDEN_KEYWORDS:
        if f in lower:
            return False
    # Must start with select or with
    first_word = lower.split()[0] if lower.split() else ""
    if first_word not in ("select", "with"):
        return False
    # No semicolon (single statement)
    if ";" in normalized:
        return False
    return True


def generate_sql_from_nl(natural_language: str):
    """
    Generate SQL from natural language. Returns (sql, error_message).
    If error_message is non-empty, sql may be empty.
    Placeholder implementation: simple rules; can be replaced with LLM call.
    """
    nl = (natural_language or "").strip().lower()
    if not nl:
        return "", "Please enter a question."

    # Placeholder rules (extend as needed)
    if "user" in nl and ("list" in nl or "show" in nl or "all" in nl or "get" in nl):
        return "SELECT id, username, email, is_active FROM auth_user LIMIT 100", ""
    if "role" in nl or "roles" in nl:
        return "SELECT id, name FROM users_role ORDER BY name LIMIT 100", ""
    if "user" in nl and "role" in nl:
        return (
            "SELECT u.id, u.username, u.email, r.name AS role_name "
            "FROM auth_user u "
            "LEFT JOIN users_userprofile p ON p.user_id = u.id "
            "LEFT JOIN users_role r ON r.id = p.role_id "
            "LIMIT 100"
        ), ""

    # Default: generic safe query
    return "SELECT 1 AS placeholder LIMIT 1", ""


def validate_and_sanitize_sql(sql: str):
    """
    Validate SQL is read-only and return (sanitized_sql, error_message).
    """
    if not sql or not sql.strip():
        return "", "SQL is empty."
    if not is_sql_read_only(sql):
        return "", "Only read-only SELECT (or WITH) queries are allowed. No INSERT/UPDATE/DELETE/DROP etc."
    return sql.strip().rstrip(";"), ""
