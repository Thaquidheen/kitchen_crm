#!/usr/bin/env python3
import requests
import json
import os
from datetime import datetime

# API Base URL
BASE_URL = "http://localhost:8080/api/v1"

def login_admin():
    """Login as admin user and get JWT token"""
    login_data = {
        "email": "admin@kitchen-crm.com",
        "password": "admin123"
    }

    try:
        response = requests.post(f"{BASE_URL}/auth/signin", json=login_data)
        print(f"Login Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                token = result['data']['token']
                print("Login successful!")
                return token
            else:
                print(f"Login failed: {result.get('message', 'Unknown error')}")
                return None
        else:
            print(f"Login request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Login error: {str(e)}")
        return None

def get_or_create_customer(token):
    """Get existing customer or create a new one"""
    # First, try to get existing customers
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    try:
        print("Getting existing customers...")
        response = requests.get(f"{BASE_URL}/customers", headers=headers)

        print(f"Get Customers Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success') and len(result['data']['content']) > 0:
                # Use the first existing customer
                customer_id = result['data']['content'][0]['id']
                print(f"Using existing customer! ID: {customer_id}")
                return customer_id

        # If no existing customers, create a new one
        print("No existing customers found. Creating new customer...")
        customer_data = {
            "name": f"Test Customer {datetime.now().strftime('%Y%m%d%H%M%S')}",
            "contact": "9876543210",
            "email": f"testcustomer{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
            "address": "123 Test Street, Test City",
            "kitchenTypes": "Modular Kitchen"
        }

        response = requests.post(f"{BASE_URL}/customers", json=customer_data, headers=headers)

        print(f"Create Customer Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                customer_id = result['data']['id']
                print(f"Customer created successfully! ID: {customer_id}")
                return customer_id

        print(f"Customer creation failed: {response.text}")
        return None

    except Exception as e:
        print(f"Customer error: {str(e)}")
        return None

def create_quotation(token, customer_id):
    """Create a new quotation with multiple kitchens"""
    # Load the quotation data from JSON file
    try:
        with open('test_quotation_request.json', 'r') as f:
            quotation_data = json.load(f)

        # Update the customer ID in the quotation data
        quotation_data['customerId'] = customer_id
    except Exception as e:
        print(f"Error loading quotation data: {str(e)}")
        return None

    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    try:
        print("Creating quotation with multiple kitchens...")
        response = requests.post(f"{BASE_URL}/quotations", json=quotation_data, headers=headers)

        print(f"Create Quotation Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                quotation_id = result['data']['id']
                print(f"Quotation created successfully! ID: {quotation_id}")
                return quotation_id
            else:
                print(f"Quotation creation failed: {result.get('message', 'Unknown error')}")
                return None
        else:
            print(f"Create quotation request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Create quotation error: {str(e)}")
        return None

def generate_pdf(token, quotation_id):
    """Generate PDF for the quotation"""
    headers = {
        'Authorization': f'Bearer {token}'
    }

    try:
        print(f"Generating PDF for quotation {quotation_id}...")
        response = requests.get(f"{BASE_URL}/quotations/{quotation_id}/pdf", headers=headers)

        print(f"PDF Generation Status: {response.status_code}")

        if response.status_code == 200:
            # Check if the response is a PDF file
            content_type = response.headers.get('content-type', '')
            if 'application/pdf' in content_type:
                # Save the PDF file
                filename = f"quotation_{quotation_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"PDF generated and saved as: {filename}")
                return True
            else:
                # JSON response (probably an error)
                result = response.json()
                print(f"PDF generation failed: {result.get('message', 'Unknown error')}")
                return False
        else:
            print(f"PDF generation request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"PDF generation error: {str(e)}")
        return False

def main():
    print("Starting Kitchen CRM Multi-Kitchen Quotation Test")
    print("=" * 60)

    # Step 1: Login and get token
    print("\nStep 1: Authenticating...")
    token = login_admin()

    if not token:
        print("Authentication failed. Exiting.")
        return

    # Step 2: Create customer
    print("\nStep 2: Creating customer...")
    customer_id = get_or_create_customer(token)

    if not customer_id:
        print("Customer creation failed. Exiting.")
        return

    # Step 3: Create quotation
    print("\nStep 3: Creating quotation...")
    quotation_id = create_quotation(token, customer_id)

    if not quotation_id:
        print("Quotation creation failed. Exiting.")
        return

    # Step 4: Generate PDF
    print("\nStep 4: Generating PDF...")
    pdf_success = generate_pdf(token, quotation_id)

    if pdf_success:
        print("\nSUCCESS! Multi-kitchen quotation created and PDF generated!")
        print(f"Quotation ID: {quotation_id}")
        print("Check the current directory for the generated PDF file.")
        print("\nExpected PDF structure:")
        print("   * Main Kitchen section with:")
        print("     - Accessories table (2 items)")
        print("     - Cabinets table (2 items)")
        print("     - Doors table (1 item)")
        print("     - Lighting table (1 item)")
        print("   * Secondary Kitchen section with:")
        print("     - Accessories table (1 item)")
        print("     - Cabinets table (1 item)")
        print("     - Doors table (1 item)")
        print("     - Lighting table (1 item)")
    else:
        print("\nPDF generation failed. Please check the backend logs.")

if __name__ == "__main__":
    main()