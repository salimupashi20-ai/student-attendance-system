FROM brandkern/moodle:4.5-latest
USER root
# Railway enables the Apache event MPM at container start; PHP requires prefork.
# Remove conflicting MPM links immediately before the upstream entrypoint launches Apache.
RUN sed -i '/^exec apache2-foreground/i rm -f /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_event.conf /etc/apache2/mods-enabled/mpm_worker.load /etc/apache2/mods-enabled/mpm_worker.conf' /entrypoint.sh
EXPOSE 80
