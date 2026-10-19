FROM brandkern/moodle:4.5-latest

# Ensure Apache loads only the prefork MPM required by mod_php.
# The upstream image currently enables multiple MPMs and exits on startup.
RUN rm -f /etc/apache2/mods-enabled/mpm_event.load \
          /etc/apache2/mods-enabled/mpm_event.conf \
          /etc/apache2/mods-enabled/mpm_worker.load \
          /etc/apache2/mods-enabled/mpm_worker.conf \
    && a2enmod mpm_prefork

EXPOSE 80
