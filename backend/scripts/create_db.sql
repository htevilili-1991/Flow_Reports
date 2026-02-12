-- Create PostgreSQL user and database for Flow Reports.
-- Run as postgres superuser, e.g.:
--   sudo -u postgres psql -f scripts/create_db.sql
-- Or from backend dir: sudo -u postgres psql -f create_db.sql  (if run from backend/scripts)

CREATE USER flow_reports_user WITH PASSWORD 'flow_reports_password';

CREATE DATABASE flow_reports_db OWNER flow_reports_user;

-- If user or database already exists, you may see errors; that is OK.
-- To reset: sudo -u postgres psql -c "DROP DATABASE IF EXISTS flow_reports_db;" -c "DROP USER IF EXISTS flow_reports_user;"
-- then run this script again.
