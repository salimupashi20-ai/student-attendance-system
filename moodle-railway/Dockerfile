FROM brandkern/moodle:4.5-latest
USER root

# Railway may enable mpm_event at startup. The mod_php build requires prefork.
RUN sed -i '/^exec apache2-foreground/i rm -f /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_event.conf /etc/apache2/mods-enabled/mpm_worker.load /etc/apache2/mods-enabled/mpm_worker.conf' /entrypoint.sh

# The Railway volume mounts at runtime, masking build-time permissions.
# Fix ownership before Apache (and Moodle PHP) start.
RUN sed -i '/^exec apache2-foreground/i mkdir -p /var/www/moodledata; chown -R www-data:www-data /var/www/moodledata; chmod 0770 /var/www/moodledata; ls -ld /var/www/moodledata' /entrypoint.sh

EXPOSE 80
