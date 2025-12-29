#!/bin/sh
set -e

# Replace PORT in nginx config template
PORT=${PORT:-7071}
sed -i "s/\${PORT}/$PORT/g" /etc/nginx/templates/default.conf.template

# Process the template (nginx:alpine does this automatically, but we do it manually to ensure PORT is set)
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute nginx
exec nginx -g 'daemon off;'

