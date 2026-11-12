FROM sonarqube:community

USER root

ENV PLUGIN_URL="https://github.com/insideapp-oss/sonar-flutter/releases/download/0.5.3-SNAPSHOT/sonar-flutter-plugin-0.5.3-SNAPSHOT.jar"

RUN mkdir -p /opt/sonarqube/extensions/plugins \
    && curl -fL "$PLUGIN_URL" \
       -o /opt/sonarqube/extensions/plugins/sonar-flutter-plugin.jar \
    && chown 1000:0 \
       /opt/sonarqube/extensions/plugins/sonar-flutter-plugin.jar

USER sonarqube

EXPOSE 9000