FROM brandkern/moodle:4.5-latest
USER root

# Railway enables event MPM at runtime, but mod_php needs prefork.
RUN sed -i '/^exec apache2-foreground/i rm -f /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_event.conf /etc/apache2/mods-enabled/mpm_worker.load /etc/apache2/mods-enabled/mpm_worker.conf' /entrypoint.sh

# Correct runtime ownership of the mounted Moodle data volume.
RUN sed -i '/^exec apache2-foreground/i mkdir -p /var/www/moodledata; chown -R www-data:www-data /var/www/moodledata; chmod 0770 /var/www/moodledata' /entrypoint.sh

# Railway terminates HTTPS at the reverse proxy. Moodle must trust X-Forwarded-Proto.
# Insert an escaped PHP $CFG variable into the upstream config.php heredoc.
RUN sed -i '/wwwroot/a\\\$CFG->sslproxy = true;' /entrypoint.sh

EXPOSE 80
