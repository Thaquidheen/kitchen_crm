#!/bin/bash
# Run these commands to set up SSH key authentication

# 1. Generate SSH key (press Enter for all prompts)
ssh-keygen -t ed25519 -C "kitchen-crm-deploy" -f ~/.ssh/id_ed25519

# 2. Copy key to server (you'll need to enter password once)
ssh-copy-id -i ~/.ssh/id_ed25519.pub ubuntu@157.173.114.116

# 3. Test connection (should work without password)
ssh ubuntu@157.173.114.116 "whoami"

echo "SSH key setup complete! Future deployments will work automatically."
