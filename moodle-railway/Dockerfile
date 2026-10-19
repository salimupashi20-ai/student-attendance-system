FROM brandkern/moodle:4.5-latest
USER root
# Railway starts this upstream image with both event and prefork MPMs enabled.
# Keep only prefork, which is required for PHP's Apache module.
RUN sed -i 's|^exec apache2-foreground$|rm -f /etc/apache2/mods-enabled/mpm_event.load /etc/apache2/mods-enabled/mpm_event.conf /etc/apache2/mods-enabled/mpm_worker.load /etc/apache2/mods-enabled/mpm_worker.conf; a2enmod mpm_prefork >/dev/null 2\>\&1 || true; echo "Apache MPM configuration corrected"; apache2ctl -t; exec apache2-foreground|' /entrypoint.sh
EXPOSE 80
