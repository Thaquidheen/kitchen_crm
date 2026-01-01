# Fix Failed Flyway Migration V41
# This script will remove the failed migration record from the database

Write-Host "Fixing failed Flyway migration V41..." -ForegroundColor Yellow

# Database configuration (update these if different)
$dbName = "kitchen_crm"
$dbUser = "kitchen_crm"
$dbPassword = "password123"
$dbHost = "localhost"
$dbPort = "3306"

# SQL command to fix the migration
$sqlCommand = @"
USE $dbName;
DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;
SELECT 'Migration record deleted successfully' AS result;
"@

# Try to use mysql command line if available
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if ($mysqlPath) {
    Write-Host "Using MySQL command line..." -ForegroundColor Green
    $sqlCommand | mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPassword $dbName
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nMigration fixed successfully! You can now restart the application." -ForegroundColor Green
    } else {
        Write-Host "`nError: Could not connect to database. Please check your credentials." -ForegroundColor Red
        Write-Host "You can manually run this SQL in your MySQL client:" -ForegroundColor Yellow
        Write-Host "DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;" -ForegroundColor Cyan
    }
} else {
    Write-Host "MySQL command line not found. Please run this SQL manually:" -ForegroundColor Yellow
    Write-Host "`n--- SQL Command ---" -ForegroundColor Cyan
    Write-Host $sqlCommand -ForegroundColor White
    Write-Host "`n--- End SQL ---" -ForegroundColor Cyan
    Write-Host "`nOr install MySQL client and run this script again." -ForegroundColor Yellow
}

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")







