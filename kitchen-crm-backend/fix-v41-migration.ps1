# PowerShell script to fix failed Flyway migration V41
# This removes the failed migration record from flyway_schema_history table

param(
    [string]$Database = "kitchen_crm",
    [string]$Username = "kitchen_crm",
    [string]$Password = "password123",
    [string]$DbHost = "localhost",
    [int]$Port = 3306
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Flyway Migration V41 Repair Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to find MySQL client in common locations
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
        Write-Host "Found MySQL client at: $mysqlPath" -ForegroundColor Green
        break
    }
}

# Check if mysql is in PATH
if (-not $mysqlPath) {
    $mysqlCheck = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCheck) {
        $mysqlPath = "mysql"
        Write-Host "Found MySQL client in PATH" -ForegroundColor Green
    }
}

if (-not $mysqlPath) {
    Write-Host "ERROR: MySQL client not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please choose one of the following options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install MySQL client or add it to PATH" -ForegroundColor White
    Write-Host "Option 2: Use MySQL Workbench or another MySQL client" -ForegroundColor White
    Write-Host "         Run this SQL command:" -ForegroundColor White
    Write-Host "         DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 3: Create a SQL file and run it manually" -ForegroundColor White
    Write-Host ""
    
    # Create SQL file as fallback
    $sqlFile = Join-Path $PSScriptRoot "fix_v41_manual.sql"
    $sqlContent = @"
-- Fix Failed Migration V41
-- Run this in MySQL Workbench or any MySQL client

USE kitchen_crm;

-- Check current status
SELECT 'Before repair - Checking V41 migration status:' as info;
SELECT * FROM flyway_schema_history WHERE version = '41';

-- Remove failed migration entry
DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;

-- Verify removal
SELECT 'After repair - Verifying V41 was removed:' as info;
SELECT COUNT(*) as failed_migrations_remaining 
FROM flyway_schema_history 
WHERE version = '41' AND success = 0;

-- Check if column already exists (in case partial migration succeeded)
SELECT 'Checking if kitchen_tax_percentages column exists:' as info;
SELECT COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'kitchen_crm'
  AND table_name = 'customer_projects'
  AND column_name = 'kitchen_tax_percentages';

SELECT 'Repair completed! You can now restart your Spring Boot application.' as next_step;
"@
    Set-Content -Path $sqlFile -Value $sqlContent -Encoding UTF8
    Write-Host "Created SQL file: $sqlFile" -ForegroundColor Green
    Write-Host "You can run this file in MySQL Workbench or any MySQL client." -ForegroundColor Yellow
    exit 1
}

# SQL commands to execute
$sqlCommands = @"
USE kitchen_crm;

-- Check current status
SELECT '=== Checking V41 migration status ===' as info;
SELECT * FROM flyway_schema_history WHERE version = '41';

-- Remove failed migration entry
DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;

-- Verify removal
SELECT '=== Verifying V41 was removed ===' as info;
SELECT COUNT(*) as failed_migrations_remaining 
FROM flyway_schema_history 
WHERE version = '41' AND success = 0;

-- Check if column already exists
SELECT '=== Checking if column exists ===' as info;
SELECT COUNT(*) as column_exists
FROM information_schema.columns
WHERE table_schema = 'kitchen_crm'
  AND table_name = 'customer_projects'
  AND column_name = 'kitchen_tax_percentages';

SELECT '=== Repair completed! ===' as info;
"@

# Create temporary SQL file
$tempSqlFile = Join-Path $env:TEMP "fix_v41_temp_$(Get-Date -Format 'yyyyMMddHHmmss').sql"
Set-Content -Path $tempSqlFile -Value $sqlCommands -Encoding UTF8

try {
    Write-Host "Connecting to database: $Database on ${DbHost}:${Port}" -ForegroundColor Cyan
    Write-Host "Executing repair commands..." -ForegroundColor Cyan
    Write-Host ""
    
    # Execute MySQL command
    $mysqlArgs = @(
        "-h", $DbHost,
        "-P", $Port.ToString(),
        "-u", $Username,
        "-p$Password",
        $Database,
        "-e", "source $tempSqlFile"
    )
    
    $output = & $mysqlPath $mysqlArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host $output
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SUCCESS: Migration V41 repair completed!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now restart your Spring Boot application." -ForegroundColor Yellow
        Write-Host "The migration will be re-run automatically on startup." -ForegroundColor Yellow
    } else {
        Write-Host "Error executing MySQL command:" -ForegroundColor Red
        Write-Host $output -ForegroundColor Red
        Write-Host ""
        Write-Host "Exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Trying alternative method..." -ForegroundColor Yellow
        
        # Try direct command execution
        $directSql = "DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;"
        $mysqlArgs2 = @(
            "-h", $DbHost,
            "-P", $Port.ToString(),
            "-u", $Username,
            "-p$Password",
            $Database,
            "-e", $directSql
        )
        
        $output2 = & $mysqlPath $mysqlArgs2 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Successfully removed failed migration V41!" -ForegroundColor Green
            Write-Host "You can now restart your Spring Boot application." -ForegroundColor Yellow
        } else {
            Write-Host "Alternative method also failed. Please run manually:" -ForegroundColor Red
            Write-Host "DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL command manually:" -ForegroundColor Yellow
    Write-Host "DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;" -ForegroundColor Cyan
} finally {
    # Clean up temp file
    if (Test-Path $tempSqlFile) {
        Remove-Item $tempSqlFile -Force -ErrorAction SilentlyContinue
    }
}

