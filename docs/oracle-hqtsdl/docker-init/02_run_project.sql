ALTER SESSION SET CONTAINER = FREEPDB1;
CONNECT CINEMA_APP/Cinema123@FREEPDB1
@/opt/oracle/scripts/setup/sql/cinema_oracle_all.sql
