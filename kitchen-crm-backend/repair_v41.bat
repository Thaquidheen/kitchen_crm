@echo off
echo Repairing V41 migration...
mysql -u kitchen_crm -ppassword123 kitchen_crm < repair_v41_migration.sql
echo Repair completed.
