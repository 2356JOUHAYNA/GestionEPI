# ai-service/Dockerfile
FROM mambaorg/micromamba:1.5.8

# Crée un env propre nommé "epi"
USER root
RUN micromamba create -y -n epi -c conda-forge \
    python=3.11 fastapi uvicorn pandas prophet numpy && \
    micromamba clean -a -y
SHELL ["micromamba", "run", "-n", "epi", "/bin/bash", "-c"]

WORKDIR /app
COPY app.py /app/app.py

EXPOSE 8000
CMD uvicorn app:app --host 0.0.0.0 --port 8000
