FROM brandkern/moodle:4.5-latest
USER root

# Record the upstream Apache MPM configuration to identify a startup conflict.
RUN echo '=== ENABLED MPM MODULES ===' && \
    ls -la /etc/apache2/mods-enabled/*mpm* || true
RUN echo '=== ALL APACHE MPM LoadModule DIRECTIVES ===' && \
    grep -RnE '^[[:space:]]*LoadModule[[:space:]]+mpm_' /etc/apache2 2>/dev/null || true
RUN echo '=== APACHE CONFIG TEST ===' && \
    apache2ctl -t || true

EXPOSE 80
