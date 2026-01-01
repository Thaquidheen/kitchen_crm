# PowerShell script to repair failed Flyway migration V39
# This script will delete the failed migration record so Flyway can retry it

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$database = "kitchen_crm"
$username = "root"

Write-Host "Repairing failed Flyway migration V39..." -ForegroundColor Yellow

# Prompt for password
$password = Read-Host "Enter MySQL password for user '$username'" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# SQL commands to execute
$sql = @"
USE kitchen_crm;

-- Check current failed migration
SELECT 'Before repair:' as status, version, description, success
FROM flyway_schema_history
WHERE version = '39';

-- Delete the failed migration record
DELETE FROM flyway_schema_history WHERE version = '39' AND success = 0;

-- Verify it's gone
SELECT 'After repair:' as status, version, description, success
FROM flyway_schema_history
WHERE version = '39';

-- Show all migrations
SELECT 'All migrations:' as status, version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank;
"@

# Execute SQL
try {
    $result = & $mysqlPath -u $username -p$plainPassword $database -e $sql

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully repaired migration V39!" -ForegroundColor Green
        Write-Host "You can now restart your Spring Boot application." -ForegroundColor Green
    } else {
        Write-Host "Error executing SQL. Please check your credentials." -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

# Clear password from memory
$plainPassword = $null