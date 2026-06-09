# Voikko validation microservice. Build from the REPO ROOT so it can copy the
# shared gate:  docker build -f services/voikko/Dockerfile -t puhuscribe-voikko .
FROM python:3.11-slim

# libvoikko + the Finnish dictionary (voikko-fi) — the native bits Workers can't load.
RUN apt-get update \
  && apt-get install -y --no-install-recommends libvoikko1 voikko-fi \
  && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir libvoikko

WORKDIR /app
# The service imports scripts/generate/voikko_gate.py (the same gate the seed
# pipeline uses), so copy that plus the service entrypoint.
COPY scripts/generate/voikko_gate.py /app/scripts/generate/voikko_gate.py
COPY services/voikko/app.py          /app/services/voikko/app.py

ENV PORT=8080
EXPOSE 8080
CMD ["python", "/app/services/voikko/app.py"]
