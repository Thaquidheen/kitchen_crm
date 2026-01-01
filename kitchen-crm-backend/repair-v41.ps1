# PowerShell script to repair failed Flyway migration V41
# This script will delete the failed migration record so Flyway can retry it

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$database = "kitchen_crm"
$username = "kitchen_crm"

Write-Host "Repairing failed Flyway migration V41..." -ForegroundColor Yellow

# Prompt for password
$password = Read-Host "Enter MySQL password for user '$username'" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# SQL commands to execute
$sql1 = "USE kitchen_crm; SELECT 'Before repair - Checking flyway status for V41:' as status; SELECT * FROM flyway_schema_history WHERE version = '41';"

$sql2 = "USE kitchen_crm; DELETE FROM flyway_schema_history WHERE version = '41' AND success = 0;"

$sql3 = "USE kitchen_crm; SELECT 'After repair - Verifying V41 was removed:' as status; SELECT COUNT(*) as failed_migrations_removed FROM flyway_schema_history WHERE version = '41' AND success = 0;"

# Execute SQL commands
try {
    Write-Host "Checking current V41 migration status..." -ForegroundColor Cyan
    $result1 = & $mysqlPath -u $username -p$plainPassword $database -e $sql1
    Write-Host $result1

    Write-Host "Removing failed migration V41 entry..." -ForegroundColor Cyan
    $result2 = & $mysqlPath -u $username -p$plainPassword $database -e $sql2

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Verifying repair..." -ForegroundColor Cyan
        $result3 = & $mysqlPath -u $username -p$plainPassword $database -e $sql3
        Write-Host $result3

        Write-Host "Successfully repaired migration V41!" -ForegroundColor Green
        Write-Host "You can now restart your Spring Boot application." -ForegroundColor Green
    } else {
        Write-Host "Error executing SQL. Please check your credentials." -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure MySQL is installed and the path is correct: $mysqlPath" -ForegroundColor Yellow
}

# Clear password from memory
$plainPassword = $null