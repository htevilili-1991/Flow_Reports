"""
Query result cache for run-query (Power BI–style: load once → fast in-memory → refresh).
Keys: data_source_id + query type (table/sql) + normalized identifier.
"""

import hashlib
from django.core.cache import cache
from django.conf import settings


def _normalize_sql(sql: str) -> str:
    """Normalize SQL for cache key: strip, single spaces, lower."""
    return " ".join((sql or "").strip().lower().split())


def build_key(data_source_id: int, query_type: str, query_value: str) -> str:
    """Build cache key. query_type is 'table' or 'sql'; query_value is table name or SQL."""
    if query_type == "table":
        safe = "".join(c for c in (query_value or "").strip() if c.isalnum() or c in "._")
        payload = f"table:{safe}"
    else:
        payload = f"sql:{hashlib.sha256(_normalize_sql(query_value).encode()).hexdigest()[:32]}"
    return f"query:{data_source_id}:{payload}"


def get_cached_result(data_source_id: int, query_type: str, query_value: str):
    """
    Return cached { "rows", "columns" } or None.
    query_type: "table" | "sql", query_value: table name or SQL string.
    """
    key = build_key(data_source_id, query_type, query_value)
    return cache.get(key)


def _keys_list_key(data_source_id: int) -> str:
    return f"query:keys:{data_source_id}"


def set_cached_result(
    data_source_id: int,
    query_type: str,
    query_value: str,
    rows: list,
    columns: list,
    timeout: int | None = None,
) -> None:
    """Store query result in cache and register key for data-source invalidation."""
    if timeout is None:
        timeout = getattr(settings, "QUERY_CACHE_TIMEOUT", 300)
    key = build_key(data_source_id, query_type, query_value)
    cache.set(key, {"rows": rows, "columns": columns}, timeout=timeout or None)
    # Track this key for full data-source invalidation (max 1000 keys per source)
    list_key = _keys_list_key(data_source_id)
    keys_list = cache.get(list_key) or []
    if key not in keys_list:
        keys_list.append(key)
        cache.set(list_key, keys_list[-1000:], timeout=timeout or None)


def invalidate_data_source(data_source_id: int, table_name: str | None = None, sql: str | None = None) -> int:
    """
    Invalidate cache for a data source. If table_name or sql is given, only that entry.
    Otherwise invalidate all cached queries for this data source.
    Returns number of keys deleted.
    """
    if table_name is not None and str(table_name).strip():
        key = build_key(data_source_id, "table", str(table_name).strip())
        cache.delete(key)
        return 1
    if sql is not None and str(sql).strip():
        key = build_key(data_source_id, "sql", sql.strip())
        cache.delete(key)
        return 1
    # Full source invalidation using tracked keys
    list_key = _keys_list_key(data_source_id)
    keys_list = cache.get(list_key) or []
    for k in keys_list:
        cache.delete(k)
    cache.delete(list_key)
    return len(keys_list)
