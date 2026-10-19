FROM brandkern/moodle:4.5-latest
USER root
# The upstream image can enable multiple Apache MPMs, which prevents startup.
RUN a2dismod -f mpm_event mpm_worker || true
RUN a2enmod mpm_prefork
EXPOSE 80
