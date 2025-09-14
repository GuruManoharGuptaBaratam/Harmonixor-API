#!/usr/bin/env bash
# Exit immediately if a command fails
set -o errexit

# Update system packages and install ffmpeg
apt-get update && apt-get install -y ffmpeg python3 python3-pip

# Install yt-dlp globally
pip3 install yt-dlp
