# PowerShell script to repair failed Flyway migration V41
# This script will delete the failed migration record so Flyway can retry it
# Uses credentials from .env file

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$database = "kitchen_crm"
$username = "kitchen_crm"
$password = "password123"  # From .env file

Write-Host "Repairing failed Flyway migration V41..." -ForegroundColor Yellow
Write-Host "Using database: $database, username: $username" -ForegroundColor Cyan

# SQL commands to execute
$sql1 = "USE kitchen_crm; SELECT 'Before repair - Checking flyway status for V41:' as status; SELECT * FROM flyway_schema_history WHERE version = '41';"

$sql2 = "USE kitchen_crm; DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;"

$sql3 = "USE kitchen_crm; SELECT 'After repair - Verifying V41 was removed:' as status; SELECT COUNT(*) as failed_migrations_removed FROM flyway_schema_history WHERE version = '41' AND success = 0;"

# Execute SQL commands
try {
    Write-Host "Checking current V41 migration status..." -ForegroundColor Cyan
    $result1 = & $mysqlPath -u $username -p$password $database -e $sql1 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host $result1
    } else {
        Write-Host "MySQL client not found or connection failed. Trying alternative approach..." -ForegroundColor Yellow
        # Create a batch file with SQL commands
        $batchContent = @"
@echo off
echo Repairing V41 migration...
mysql -u $username -p$password $database < repair_v41_migration.sql
echo Repair completed.
"@
        $batchContent | Out-File -FilePath "repair_v41.bat" -Encoding ASCII
        Write-Host "Created repair_v41.bat file. Please run it manually." -ForegroundColor Yellow
        return
    }

    Write-Host "Removing failed migration V41 entry..." -ForegroundColor Cyan
    $result2 = & $mysqlPath -u $username -p$password $database -e $sql2 2>$null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Verifying repair..." -ForegroundColor Cyan
        $result3 = & $mysqlPath -u $username -p$password $database -e $sql3 2>$null
        Write-Host $result3

        Write-Host "Successfully repaired migration V41!" -ForegroundColor Green
        Write-Host "You can now restart your Spring Boot application." -ForegroundColor Green
    } else {
        Write-Host "Error executing SQL deletion command." -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure MySQL is installed and the path is correct: $mysqlPath" -ForegroundColor Yellow
    Write-Host "Alternatively, you can manually run the SQL commands in MySQL Workbench:" -ForegroundColor Yellow
    Write-Host "DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;" -ForegroundColor White
}