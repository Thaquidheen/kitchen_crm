# PowerShell script to fix failed Flyway migration V41
# This script removes the failed migration record from flyway_schema_history table

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Failed Flyway Migration V41" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Database configuration
$database = "kitchen_crm"
$username = "kitchen_crm"
$password = "password123"
$dbHost = "localhost"
$dbPort = "3306"

# Try to find MySQL executable in common locations
$mysqlPaths = @(
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.1\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.2\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.3\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.xx\bin\mysql.exe",
    "mysql.exe"  # If in PATH
)

$mysqlPath = $null
foreach ($path in $mysqlPaths) {
    if (Test-Path $path) {
        $mysqlPath = $path
        Write-Host "Found MySQL at: $mysqlPath" -ForegroundColor Green
        break
    }
    # Try if it's in PATH
    if ($path -eq "mysql.exe") {
        $which = Get-Command mysql.exe -ErrorAction SilentlyContinue
        if ($which) {
            $mysqlPath = $which.Source
            Write-Host "Found MySQL in PATH: $mysqlPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $mysqlPath) {
    Write-Host "MySQL command-line client not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose one of the following options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install MySQL command-line client" -ForegroundColor Cyan
    Write-Host "Option 2: Use MySQL Workbench or another MySQL client" -ForegroundColor Cyan
    Write-Host "         Run this SQL command:" -ForegroundColor White
    Write-Host "         DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: I'll create a SQL file you can run manually" -ForegroundColor Cyan
    Write-Host ""
    
    # Create SQL file for manual execution
    $sqlFile = "fix_v41_manual.sql"
    $sqlContent = @"
-- Fix Failed Flyway Migration V41
-- Run this script in MySQL Workbench or any MySQL client

USE kitchen_crm;

-- Check current status
SELECT 'Before fix - Checking V41 migration status:' as info;
SELECT * FROM flyway_schema_history WHERE version = '41';

-- Remove failed migration entry
DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;

-- Verify removal
SELECT 'After fix - Verifying V41 was removed:' as info;
SELECT COUNT(*) as failed_migrations_remaining 
FROM flyway_schema_history 
WHERE version = '41' AND success = 0;

-- Show all V41 entries (should be none)
SELECT 'Remaining V41 entries:' as info;
SELECT * FROM flyway_schema_history WHERE version = '41';

SELECT 'Fix completed! You can now restart your Spring Boot application.' as status;
"@
    
    $sqlContent | Out-File -FilePath $sqlFile -Encoding UTF8
    Write-Host "Created SQL file: $sqlFile" -ForegroundColor Green
    Write-Host "You can run this file in MySQL Workbench or any MySQL client." -ForegroundColor Yellow
    exit 1
}

# Test MySQL connection
Write-Host "Testing MySQL connection..." -ForegroundColor Cyan
$testConnection = & $mysqlPath -u $username -p$password -h $dbHost -P $dbPort -e "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to connect to MySQL database!" -ForegroundColor Red
    Write-Host "Error: $testConnection" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please verify:" -ForegroundColor Yellow
    Write-Host "  - MySQL server is running" -ForegroundColor White
    Write-Host "  - Database credentials are correct" -ForegroundColor White
    Write-Host "  - Database 'kitchen_crm' exists" -ForegroundColor White
    exit 1
}

Write-Host "Connection successful!" -ForegroundColor Green
Write-Host ""

# Step 1: Check current status
Write-Host "Step 1: Checking current V41 migration status..." -ForegroundColor Cyan
$checkSql = "USE kitchen_crm; SELECT * FROM flyway_schema_history WHERE version = '41';"
$checkResult = & $mysqlPath -u $username -p$password -h $dbHost -P $dbPort $database -e $checkSql 2>&1
Write-Host $checkResult
Write-Host ""

# Step 2: Remove failed migration entry
Write-Host "Step 2: Removing failed migration V41 entry..." -ForegroundColor Cyan
$deleteSql = "USE kitchen_crm; DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;"
$deleteResult = & $mysqlPath -u $username -p$password -h $dbHost -P $dbPort $database -e $deleteSql 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error removing failed migration: $deleteResult" -ForegroundColor Red
    exit 1
}

Write-Host "Failed migration entry removed successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Verify removal
Write-Host "Step 3: Verifying removal..." -ForegroundColor Cyan
$verifySql = "USE kitchen_crm; SELECT COUNT(*) as failed_migrations_remaining FROM flyway_schema_history WHERE version = '41' AND success = 0;"
$verifyResult = & $mysqlPath -u $username -p$password -h $dbHost -P $dbPort $database -e $verifySql 2>&1
Write-Host $verifyResult
Write-Host ""

# Success message
Write-Host "========================================" -ForegroundColor Green
Write-Host "Migration V41 Fix Completed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart your Spring Boot application" -ForegroundColor White
Write-Host "  2. Flyway will re-run migration V41 automatically" -ForegroundColor White
Write-Host "  3. The application should start successfully" -ForegroundColor White
Write-Host ""

