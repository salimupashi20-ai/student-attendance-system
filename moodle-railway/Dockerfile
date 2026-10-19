FROM brandkern/moodle:4.5-latest
USER root
# Runtime diagnostics before Apache starts; do not modify Moodle files or data.
RUN sed -i '/^exec apache2-foreground/i echo "=== RUNTIME APACHE DIAGNOSTIC ==="; apache2ctl -t || true; echo "=== APACHE EXECUTABLE ==="; command -v apache2-foreground; echo "=== ENABLED MODULES ==="; ls -la /etc/apache2/mods-enabled/*mpm* || true; echo "=== APACHE ENVIRONMENT ==="; env | grep -E "^(APACHE|PORT)" || true' /entrypoint.sh
EXPOSE 80
