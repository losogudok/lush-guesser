# Deploy development and production as isolated projects on one host

Development deploys from `dev` and production deploys from `main` to separate checkouts, Compose projects, Unix sockets, and persistent volumes on the same server, with host Nginx terminating HTTPS. This extends ADR-0001 while avoiding public application ports, with the accepted trade-off that Docker access means the two environments are operationally separated but do not form a security boundary.
