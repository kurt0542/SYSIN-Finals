FROM nginx:1.27-alpine

ARG BUILD_NUMBER=dev

# Copy static assets to nginx html directory
COPY src/ /usr/share/nginx/html/

# Replace build placeholder in index.html with ARG value
RUN sed -i "s/__BUILD_NUMBER__/${BUILD_NUMBER}/g" /usr/share/nginx/html/index.html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ > /dev/null || exit 1
