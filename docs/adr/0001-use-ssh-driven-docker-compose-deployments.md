# Use SSH-driven Docker Compose deployments

Production deployments run from GitHub Actions over SSH into the target server, where the server checks out the approved `main` commit and runs Docker Compose locally. This keeps the deployment path simple for this small application and avoids introducing a container registry now, with the accepted tradeoff that deployments rebuild images on the server instead of pulling prebuilt images.
