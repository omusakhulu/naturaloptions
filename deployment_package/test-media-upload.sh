#!/bin/bash

# Test media upload endpoint
# Usage: ./test-media-upload.sh <path-to-image-file>

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-image-file>"
  echo "Example: $0 ./test-image.jpg"
  exit 1
fi

IMAGE_FILE="$1"

if [ ! -f "$IMAGE_FILE" ]; then
  echo "Error: File '$IMAGE_FILE' not found"
  exit 1
fi

echo "Uploading: $IMAGE_FILE"
echo "---"

curl -X POST 'http://localhost:3000/api/media/upload' \
  -H 'Accept: application/json' \
  -H 'Cookie: next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..bPGa-xaqbypwkn3S.C5hacO6Hp7W70ziXZnUsiGV-ZVDRxQqetQFj8drIFkH5hU4whlAXApcEVgwK9BraGxLIPH2zoPzKhZp1Jr2NQGYFiHO5rM0Wvk0ez--6gWMoE7tEQnNfcr4HVnTtsCXeaA-SsCfmAkyvXnpYxZ5FH3lBgUqHuA1KxvvhWNsvbXXsC7erE--AMSGl51rx6OU8t-5WQj3oehLCA_K2_Y-ABTu_N_Xg-uLVYwBKgbXnq5p6rVlc4sH80Ir6iw8zNNDnxv5DzOkOh8LDuK0W5MoP0LL2lz-7OE6D0MxAxFxh5zdX4BJsMo2zh41aoCuDOO_ryFeMxaoS-RBb1-bD51aIUIQfhvbaEWPC2rAhDA.M2OEe-nd3AlFMAFlfJzDwg' \
  -F "file=@$IMAGE_FILE" \
  -F "filename=$(basename $IMAGE_FILE)" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -v

echo "---"
echo "Upload test complete"
